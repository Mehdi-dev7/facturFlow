// src/app/api/webhooks/gocardless/route.ts
//
// Webhook GoCardless — reçoit les events signés HMAC-SHA256.
// Events traités :
//   - mandates.active       → stocker mandate_id sur le Client + déclencher le paiement
//   - payments.confirmed    → marquer la facture PAID
//   - payments.failed       → logger l'échec (notification future)
//
// Sécurité : signature vérifiée via GOCARDLESS_WEBHOOK_SECRET (env global).
// Pour le multi-tenant, on retrouve d'abord le user via le metadata.invoiceId.

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

  // ── Trouver le webhookSecret : depuis la DB (par user) ou env global (fallback dev) ──
  let webhookSecret: string | undefined;

  // Extraire l'invoiceId des events pour retrouver le user
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
          if (cred.webhookSecret) webhookSecret = cred.webhookSecret;
        }
      }
    }
  } catch {
    // Pas grave — on tombe sur le fallback env
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
  handleEvents(events).catch((err) => console.error("[GC webhook] handleEvents:", err));

  return NextResponse.json({ ok: true }, { status: 200 });
}

// ─── Traitement des events ────────────────────────────────────────────────────

async function handleEvents(events: GcWebhookEvent[]) {
  for (const event of events) {
    try {
      if (event.resource_type === "mandates" && event.action === "active") {
        await handleMandateActive(event);
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

async function handleMandateActive(event: GcWebhookEvent) {
  const mandateId = event.links.mandate;
  const invoiceId = event.metadata?.invoiceId;

  if (!mandateId || !invoiceId) return;

  // Récupérer la facture + client + user
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: {
      client: true,
      user:   { select: { id: true } },
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

  // Récupérer les credentials GoCardless du user
  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId: invoice.user.id, provider: "GOCARDLESS" } },
    select: { credential: true, isActive: true },
  });

  if (!account || !account.isActive) return;

  let cred: GocardlessCredential;
  try {
    cred = JSON.parse(decrypt(account.credential)) as GocardlessCredential;
  } catch {
    return;
  }

  const isSandbox = cred.accessToken.startsWith("sandbox_");
  const amountCents = Math.round(Number(invoice.total) * 100);

  if (amountCents < 1) {
    console.warn("[GC webhook] Montant trop faible:", amountCents);
    return;
  }

  // Déclencher le paiement SEPA
  const { paymentId } = await createSepaPayment(
    cred.accessToken,
    isSandbox,
    {
      mandateId,
      amountCents,
      description: `Facture ${invoice.number}`,
      invoiceId,
    },
  );

  // Passer la facture en SEPA_PENDING (prélèvement soumis, en attente confirmation bancaire 2-5j)
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
      status:        "PAID",
      paidAt:        new Date(),
      paidAmount:    invoice.total,
      paymentMethod: "sepa",
    },
  });

  revalidatePath("/dashboard/invoices");
  console.log(`[GC webhook] Facture ${invoiceId} marquée PAID via SEPA`);
}
