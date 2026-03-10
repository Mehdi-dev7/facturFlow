// src/app/api/webhooks/gocardless/route.ts
//
// Webhook GoCardless — reçoit les events signés HMAC-SHA256.
//
// Events traités :
//   - billing_requests.fulfilled → le client a signé le mandat SEPA
//     → stocker mandate_id sur le Client + déclencher le paiement
//   - mandates.active            → backup si billing_requests.fulfilled raté
//   - payments.confirmed         → marquer la facture PAID
//   - payments.paid_out          → backup pour PAID
//   - payments.failed            → logger l'échec
//
// IMPORTANT : les metadata des events GoCardless sont TOUJOURS vides ({}).
// Les metadata sont sur la RESSOURCE (billing_request, payment), pas sur l'event.
// On doit donc appeler l'API GoCardless pour récupérer l'invoiceId.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  verifyGoCardlessWebhook,
  createSepaPayment,
  getBillingRequestMetadata,
} from "@/lib/gocardless";
import type { GcWebhookEvent } from "@/lib/gocardless";
import type { GocardlessCredential } from "@/lib/actions/payments";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

export const runtime = "nodejs";

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Webhook-Signature") ?? "";

  // ── Trouver le webhookSecret + credentials via signature matching ───────
  // On teste la signature HMAC avec chaque compte GoCardless actif en DB.
  let webhookSecret: string | undefined;
  let matchedCred: GocardlessCredential | undefined;

  try {
    const gcAccounts = await prisma.paymentAccount.findMany({
      where: { provider: "GOCARDLESS", isActive: true },
      select: { credential: true },
    });

    for (const account of gcAccounts) {
      const cred = JSON.parse(decrypt(account.credential)) as GocardlessCredential;
      if (cred.webhookSecret && verifyGoCardlessWebhook(body, signature, cred.webhookSecret)) {
        webhookSecret = cred.webhookSecret;
        matchedCred = cred;
        break;
      }
    }
  } catch {
    // Fallback env ci-dessous
  }

  // Fallback : variable d'env globale (dev / CI)
  if (!webhookSecret) webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[GC webhook] Aucun webhookSecret disponible");
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  // ── Vérifier la signature ─────────────────────────────────────────────────
  if (!verifyGoCardlessWebhook(body, signature, webhookSecret)) {
    console.warn("[GC webhook] Signature invalide");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // ── Parser les events ─────────────────────────────────────────────────────
  let events: GcWebhookEvent[];
  try {
    const parsed = JSON.parse(body) as { events: GcWebhookEvent[] };
    events = parsed.events ?? [];
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // GoCardless attend un 200 rapide — on traite en arrière-plan (fire & forget)
  handleEvents(events, matchedCred).catch((err) =>
    console.error("[GC webhook] handleEvents:", err),
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

// ─── Traitement des events ────────────────────────────────────────────────────

async function handleEvents(events: GcWebhookEvent[], cred?: GocardlessCredential) {
  for (const event of events) {
    try {
      console.log(`[GC webhook] Event: ${event.resource_type}.${event.action}`, {
        links: event.links,
      });

      // billing_requests.fulfilled = le client a signé → mandat créé
      if (event.resource_type === "billing_requests" && event.action === "fulfilled") {
        await handleBillingRequestFulfilled(event, cred);
      }
      // mandates.active = backup (certains flows envoient ça aussi)
      else if (event.resource_type === "mandates" && event.action === "active") {
        await handleMandateActive(event, cred);
      }
      // payments.confirmed ou payments.paid_out = paiement réussi
      else if (
        event.resource_type === "payments" &&
        (event.action === "confirmed" || event.action === "paid_out")
      ) {
        await handlePaymentConfirmed(event, cred);
      }
      // payments.failed = échec
      else if (event.resource_type === "payments" && event.action === "failed") {
        console.warn("[GC webhook] Paiement échoué:", event.links.payment, event.details);
      }
    } catch (err) {
      console.error(`[GC webhook] Erreur event ${event.id}:`, err);
    }
  }
}

// ─── Billing Request fulfilled : mandat signé → stocker + paiement ───────────
// C'est l'event principal du Billing Requests API.
// links contient : billing_request, mandate_request_mandate, customer, customer_bank_account

async function handleBillingRequestFulfilled(event: GcWebhookEvent, cred?: GocardlessCredential) {
  const mandateId = event.links.mandate_request_mandate;
  const billingRequestId = event.links.billing_request;

  if (!mandateId) {
    console.warn("[GC webhook] billing_requests.fulfilled sans mandate_request_mandate");
    return;
  }

  // Récupérer l'invoiceId depuis les metadata de la ressource billing_request
  let invoiceId: string | undefined;
  if (billingRequestId && cred?.accessToken) {
    try {
      const metadata = await getBillingRequestMetadata(
        cred.accessToken,
        cred.accessToken.startsWith("sandbox_"),
        billingRequestId,
      );
      invoiceId = metadata.invoiceId;
    } catch (err) {
      console.error("[GC webhook] Erreur fetch billing_request metadata:", err);
    }
  }

  if (!invoiceId) {
    console.warn("[GC webhook] billing_requests.fulfilled sans invoiceId", { mandateId, billingRequestId });
    return;
  }

  await processMandate(mandateId, invoiceId, cred);
}

// ─── Mandat activé (backup) ──────────────────────────────────────────────────

async function handleMandateActive(event: GcWebhookEvent, cred?: GocardlessCredential) {
  const mandateId = event.links.mandate;
  if (!mandateId) return;

  // Essayer metadata de l'event (rarement rempli mais on tente)
  let invoiceId: string | undefined = event.metadata?.invoiceId;

  // Sinon via billing_request dans les links
  if (!invoiceId && event.links.billing_request && cred?.accessToken) {
    try {
      const metadata = await getBillingRequestMetadata(
        cred.accessToken,
        cred.accessToken.startsWith("sandbox_"),
        event.links.billing_request,
      );
      invoiceId = metadata.invoiceId;
    } catch {
      // Pas grave
    }
  }

  if (!invoiceId) {
    // Vérifier si le mandat a déjà été traité (via billing_requests.fulfilled)
    const existing = await prisma.client.findFirst({
      where: { gcMandateId: mandateId },
    });
    if (existing) {
      console.log("[GC webhook] mandates.active — mandat déjà traité via billing_requests.fulfilled");
      return;
    }
    console.warn("[GC webhook] mandates.active sans invoiceId", { mandateId });
    return;
  }

  await processMandate(mandateId, invoiceId, cred);
}

// ─── Logique commune : stocker mandat + déclencher paiement ──────────────────

async function processMandate(
  mandateId: string,
  invoiceId: string,
  cred?: GocardlessCredential,
) {
  // Récupérer la facture + client + user
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: {
      client: true,
      user: { select: { id: true } },
    },
  });

  if (!invoice) {
    console.warn("[GC webhook] Facture introuvable:", invoiceId);
    return;
  }

  // Stocker le mandate_id sur le Client
  await prisma.client.update({
    where: { id: invoice.client.id },
    data: {
      gcMandateId: mandateId,
      gcMandateStatus: "active",
    },
  });
  console.log(`[GC webhook] Mandat ${mandateId} stocké sur client ${invoice.client.id}`);

  // Récupérer les credentials GoCardless du user (si pas déjà disponibles)
  let userCred = cred;
  if (!userCred) {
    const account = await prisma.paymentAccount.findUnique({
      where: { userId_provider: { userId: invoice.user.id, provider: "GOCARDLESS" } },
      select: { credential: true, isActive: true },
    });

    if (!account || !account.isActive) return;

    try {
      userCred = JSON.parse(decrypt(account.credential)) as GocardlessCredential;
    } catch {
      return;
    }
  }

  const isSandbox = userCred.accessToken.startsWith("sandbox_");
  const amountCents = Math.round(Number(invoice.total) * 100);

  if (amountCents < 1) {
    console.warn("[GC webhook] Montant trop faible:", amountCents);
    return;
  }

  // Déclencher le paiement SEPA
  const { paymentId } = await createSepaPayment(
    userCred.accessToken,
    isSandbox,
    {
      mandateId,
      amountCents,
      description: `Facture ${invoice.number}`,
      invoiceId,
    },
  );

  // Passer la facture en SEPA_PENDING
  if (invoice.status !== "PAID") {
    await prisma.document.update({
      where: { id: invoice.id },
      data: { status: "SEPA_PENDING" },
    });
    revalidatePath("/dashboard/invoices");
  }

  console.log(`[GC webhook] Paiement SEPA créé: ${paymentId} pour facture ${invoice.number}`);
}

// ─── Paiement confirmé : marquer la facture PAID ──────────────────────────────
// Les metadata du PAYMENT contiennent l'invoiceId (on les met nous-mêmes
// dans createSepaPayment). Mais par sécurité, on fetch aussi via l'API.

async function handlePaymentConfirmed(event: GcWebhookEvent, cred?: GocardlessCredential) {
  // D'abord essayer metadata de l'event
  let invoiceId: string | undefined = event.metadata?.invoiceId;

  // Sinon fetch les metadata du payment via l'API
  if (!invoiceId && event.links.payment && cred?.accessToken) {
    try {
      const isSandbox = cred.accessToken.startsWith("sandbox_");
      const base = isSandbox
        ? "https://api-sandbox.gocardless.com"
        : "https://api.gocardless.com";

      const res = await fetch(`${base}/payments/${event.links.payment}`, {
        headers: {
          Authorization: `Bearer ${cred.accessToken}`,
          "GoCardless-Version": "2015-07-06",
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = (await res.json()) as {
          payments: { metadata?: Record<string, string> };
        };
        invoiceId = data.payments?.metadata?.invoiceId;
      }
    } catch {
      // Pas grave
    }
  }

  if (!invoiceId) {
    console.warn("[GC webhook] payments.confirmed sans invoiceId", { links: event.links });
    return;
  }

  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    select: { id: true, status: true, total: true, userId: true },
  });

  if (!invoice || invoice.status === "PAID") return;

  await prisma.document.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paidAmount: invoice.total,
      paymentMethod: "sepa",
    },
  });

  revalidatePath("/dashboard/invoices");
  console.log(`[GC webhook] Facture ${invoiceId} marquée PAID via SEPA`);
  dispatchWebhook(invoice.userId, "invoice.paid", { id: invoiceId, provider: "sepa" }).catch(() => {});
}
