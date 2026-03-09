// src/app/api/webhooks/gocardless/route.ts
//
// Webhook GoCardless — reçoit les events signés HMAC-SHA256.
// Events traités :
//   - mandates.active       → stocker mandate_id sur le Client + déclencher le paiement
//   - payments.confirmed    → marquer la facture PAID
//   - payments.failed       → logger l'échec (notification future)
//
// Sécurité : signature vérifiée via le webhookSecret stocké en DB (par user).
// Fallback : variable d'env GOCARDLESS_WEBHOOK_SECRET (dev uniquement).

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { verifyGoCardlessWebhook, createSepaPayment } from "@/lib/gocardless";
import type { GcWebhookEvent } from "@/lib/gocardless";
import type { GocardlessCredential } from "@/lib/actions/payments";

export const runtime = "nodejs";

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Webhook-Signature") ?? "";

  // ── Trouver le webhookSecret + credentials du user ──────────────────────
  // Stratégie 1 : via invoiceId dans les metadata (events paiement)
  // Stratégie 2 : tester la signature avec chaque compte GoCardless actif (events mandat)
  // Fallback   : variable d'env globale (dev uniquement)
  let webhookSecret: string | undefined;
  let matchedCred: GocardlessCredential | undefined;

  // Stratégie 1 : retrouver le user via invoiceId
  try {
    const parsed = JSON.parse(body) as { events?: GcWebhookEvent[] };
    const firstEvent = parsed.events?.[0];
    const invoiceId = firstEvent?.metadata?.invoiceId;

    if (invoiceId) {
      const invoice = await prisma.document.findFirst({
        where: { id: invoiceId },
        select: { userId: true },
      });

      if (invoice?.userId) {
        const account = await prisma.paymentAccount.findUnique({
          where: { userId_provider: { userId: invoice.userId, provider: "GOCARDLESS" } },
          select: { credential: true, isActive: true },
        });

        if (account?.isActive) {
          const cred = JSON.parse(decrypt(account.credential)) as GocardlessCredential;
          if (cred.webhookSecret) {
            webhookSecret = cred.webhookSecret;
            matchedCred = cred;
          }
        }
      }
    }
  } catch {
    // Pas grave — on tente la stratégie 2
  }

  // Stratégie 2 : parcourir tous les comptes GC actifs et tester la signature
  if (!webhookSecret) {
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
        metadata: event.metadata,
      });

      if (event.resource_type === "mandates" && event.action === "active") {
        await handleMandateActive(event, cred);
      } else if (event.resource_type === "payments" && event.action === "confirmed") {
        await handlePaymentConfirmed(event);
      } else if (event.resource_type === "payments" && event.action === "failed") {
        console.warn("[GC webhook] Paiement échoué:", event.links.payment, event.details);
      }
    } catch (err) {
      console.error(`[GC webhook] Erreur event ${event.id}:`, err);
    }
  }
}

// ─── Mandat activé : stocker le mandate_id + déclencher le paiement ──────────
// GoCardless ne propage PAS les metadata du billing_request vers l'event mandat.
// On retrouve l'invoiceId via l'API billing_request si nécessaire.

async function handleMandateActive(event: GcWebhookEvent, cred?: GocardlessCredential) {
  const mandateId = event.links.mandate;
  if (!mandateId) return;

  // Essayer de récupérer l'invoiceId — d'abord dans les metadata de l'event...
  let invoiceId: string | undefined = event.metadata?.invoiceId;

  // ...sinon via le billing_request lié (API GoCardless)
  if (!invoiceId && event.links.billing_request && cred?.accessToken) {
    invoiceId = await fetchInvoiceIdFromBillingRequest(
      cred.accessToken,
      cred.accessToken.startsWith("sandbox_"),
      event.links.billing_request,
    );
  }

  if (!invoiceId) {
    console.warn("[GC webhook] mandates.active sans invoiceId — impossible de retrouver la facture", {
      mandateId,
      links: event.links,
    });
    return;
  }

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

// ─── Récupérer l'invoiceId depuis un billing_request GoCardless ──────────────

async function fetchInvoiceIdFromBillingRequest(
  accessToken: string,
  isSandbox: boolean,
  billingRequestId: string,
): Promise<string | undefined> {
  try {
    const base = isSandbox
      ? "https://api-sandbox.gocardless.com"
      : "https://api.gocardless.com";

    const res = await fetch(`${base}/billing_requests/${billingRequestId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "GoCardless-Version": "2015-07-06",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn("[GC webhook] Échec GET billing_request:", res.status);
      return undefined;
    }

    const data = (await res.json()) as {
      billing_requests: { metadata?: Record<string, string> };
    };

    return data.billing_requests?.metadata?.invoiceId;
  } catch (err) {
    console.error("[GC webhook] Erreur fetch billing_request:", err);
    return undefined;
  }
}

// ─── Paiement confirmé : marquer la facture PAID ──────────────────────────────

async function handlePaymentConfirmed(event: GcWebhookEvent) {
  const invoiceId = event.metadata?.invoiceId;
  if (!invoiceId) return;

  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    select: { id: true, status: true, total: true },
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
}
