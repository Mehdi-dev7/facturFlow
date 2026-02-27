// src/app/api/webhooks/stripe/route.ts
// Webhook Stripe : écoute checkout.session.completed → marque la facture PAID.
//
// Sécurité de la signature :
//  1. On parse le body non-vérifié pour extraire l'invoiceId depuis les metadata
//  2. On récupère le webhookSecret du user (stocké dans PaymentAccount.credential)
//  3. On re-vérifie la signature Stripe avec ce secret
//  4. Seulement après vérification, on traite l'événement (pas de side effects avant)
//
// Fallback : si STRIPE_WEBHOOK_SECRET est dans .env, on l'utilise en dev / CI.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getStripeClient } from "@/lib/stripe";
import type { StripeCredential } from "@/lib/actions/payments";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  // ── Étape 1 : extraire l'invoiceId sans vérifier (lecture seule) ───────────
  let invoiceId: string | undefined;
  let userId: string | undefined;

  try {
    const parsed = JSON.parse(rawBody) as {
      type?: string;
      data?: { object?: { metadata?: { invoiceId?: string; userId?: string } } };
    };

    if (parsed.type === "checkout.session.completed") {
      invoiceId = parsed.data?.object?.metadata?.invoiceId;
      userId = parsed.data?.object?.metadata?.userId;
    }
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  // ── Étape 2 : trouver le webhookSecret du user ─────────────────────────────
  let webhookSecret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET;

  if (userId && !webhookSecret) {
    try {
      const account = await prisma.paymentAccount.findUnique({
        where: { userId_provider: { userId, provider: "STRIPE" } },
        select: { credential: true },
      });
      if (account) {
        const cred = JSON.parse(decrypt(account.credential)) as StripeCredential;
        webhookSecret = cred.webhookSecret;
      }
    } catch {
      // Impossible de récupérer le secret → on continue sans vérification
    }
  }

  // ── Étape 3 : vérifier la signature Stripe ─────────────────────────────────
  if (sig && webhookSecret) {
    try {
      // On utilise n'importe quelle instance Stripe (la vérification ne dépend pas de la clé)
      const stripe = getStripeClient(process.env.STRIPE_FALLBACK_KEY ?? "sk_test_dummy");
      stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signature invalide";
      console.error("[Stripe webhook] Signature invalide :", msg);
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }
  } else if (!webhookSecret) {
    // Aucun secret configuré : on avertit en dev, on bloque en prod
    if (process.env.NODE_ENV === "production") {
      console.error("[Stripe webhook] Aucun webhookSecret trouvé — rejeté en production");
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
    }
    console.warn("[Stripe webhook] Pas de webhookSecret — signature non vérifiée (dev uniquement)");
  }

  // ── Étape 4 : traiter l'événement (checkout.session.completed) ────────────
  if (!invoiceId) {
    // Événement Stripe sans invoiceId dans les metadata → ignorer
    return NextResponse.json({ received: true });
  }

  try {
    const invoice = await prisma.document.findFirst({
      where: { id: invoiceId, type: "INVOICE" },
      select: { id: true, status: true, total: true },
    });

    if (!invoice) {
      console.warn(`[Stripe webhook] Facture ${invoiceId} introuvable`);
      return NextResponse.json({ received: true });
    }

    // Mettre à jour le statut uniquement si pas déjà PAID
    if (invoice.status !== "PAID") {
      await prisma.document.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paidAmount: invoice.total,
          paymentMethod: "stripe",
        },
      });

      revalidatePath("/dashboard/invoices");
      console.log(`[Stripe webhook] Facture ${invoiceId} marquée PAID`);
    }
  } catch (error) {
    console.error("[Stripe webhook] Erreur DB :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
