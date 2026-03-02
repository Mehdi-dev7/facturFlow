// src/app/api/webhooks/stripe/route.ts
// Webhook Stripe unifié :
//  - checkout.session.completed → facture PAID (paiement par lien) + liaison customer/sub
//  - customer.subscription.created/updated → mise à jour du plan en DB
//  - customer.subscription.deleted → retour au plan FREE
//
// Sécurité de la signature :
//  1. On parse le body non-vérifié pour extraire l'invoiceId / userId depuis les metadata
//  2. On récupère le webhookSecret du user (stocké dans PaymentAccount.credential)
//  3. On re-vérifie la signature Stripe avec ce secret
//  4. Seulement après vérification, on traite l'événement (pas de side effects avant)
//
// Fallback : si STRIPE_WEBHOOK_SECRET est dans .env, on l'utilise en dev / CI.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getStripeClient } from "@/lib/stripe";
import type { StripeCredential } from "@/lib/actions/payments";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  // ── Étape 1 : extraire les metadata sans vérifier (lecture seule) ──────────
  let invoiceId: string | undefined;
  let userId: string | undefined;
  let eventType: string | undefined;

  try {
    const parsed = JSON.parse(rawBody) as {
      type?: string;
      data?: { object?: { metadata?: { invoiceId?: string; userId?: string } } };
    };
    eventType = parsed.type;

    if (parsed.type === "checkout.session.completed") {
      invoiceId = parsed.data?.object?.metadata?.invoiceId;
      userId = parsed.data?.object?.metadata?.userId;
    }
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  // ── Étape 2 : trouver le webhookSecret ────────────────────────────────────
  // On essaie d'abord la variable d'env globale (plateforme FacturNow),
  // puis le secret stocké sur le compte du user (paiements de factures).
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

  // ── Étape 3 : vérifier la signature Stripe ────────────────────────────────
  if (sig && webhookSecret) {
    try {
      const stripe = getStripeClient(process.env.STRIPE_FALLBACK_KEY ?? "sk_test_dummy");
      stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signature invalide";
      console.error("[Stripe webhook] Signature invalide :", msg);
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }
  } else if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Stripe webhook] Aucun webhookSecret trouvé — rejeté en production");
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
    }
    console.warn("[Stripe webhook] Pas de webhookSecret — signature non vérifiée (dev uniquement)");
  }

  // ── Étape 4 : traiter l'événement ─────────────────────────────────────────
  try {
    switch (eventType) {
      // ── Paiement de facture via lien (provider du user) ─────────────────
      case "checkout.session.completed": {
        const parsed = JSON.parse(rawBody) as {
          data: {
            object: {
              mode?: string;
              metadata?: { invoiceId?: string; userId?: string };
              customer?: string;
              subscription?: string;
            };
          };
        };
        const sessionObj = parsed.data.object;

        // Abonnement FacturNow (mode = subscription, metadata.plan présent)
        if (sessionObj.mode === "subscription" && sessionObj.metadata?.userId) {
          const uid = sessionObj.metadata.userId;
          const updateData: Record<string, unknown> = {};
          if (sessionObj.customer) updateData.stripeCustomerId = sessionObj.customer;
          if (sessionObj.subscription) updateData.stripeSubId = sessionObj.subscription;

          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: uid },
              data: updateData,
            });
          }
          break;
        }

        // Paiement de facture via lien (mode = payment ou pas de plan dans metadata)
        if (!invoiceId) break;

        const invoice = await prisma.document.findFirst({
          where: { id: invoiceId, type: "INVOICE" },
          select: { id: true, status: true, total: true },
        });

        if (!invoice) {
          console.warn(`[Stripe webhook] Facture ${invoiceId} introuvable`);
          break;
        }

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
        break;
      }

      // ── Abonnement FacturNow créé ou mis à jour ─────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const parsed = JSON.parse(rawBody) as {
          data: { object: Stripe.Subscription };
        };
        const sub = parsed.data.object;

        // Déduire le plan depuis les metadata ou le price ID
        let plan = sub.metadata?.plan;
        if (!plan) {
          const priceId = sub.items.data[0]?.price.id;
          if (
            priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
            priceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID
          ) {
            plan = "BUSINESS";
          } else if (
            priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
            priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID
          ) {
            plan = "PRO";
          }
        }

        if (!plan || typeof sub.customer !== "string") break;

        // updateMany : stripeCustomerId n'est pas @unique dans le schema
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: {
            plan,
            planExpiresAt: null, // Plan actif → pas de date d'expiration
            stripeSubId: sub.id,
          },
        });

        console.log(`[Stripe webhook] Plan ${plan} activé pour customer ${sub.customer}`);
        break;
      }

      // ── Abonnement FacturNow supprimé/annulé ────────────────────────────
      case "customer.subscription.deleted": {
        const parsed = JSON.parse(rawBody) as {
          data: { object: Stripe.Subscription };
        };
        const sub = parsed.data.object;

        if (typeof sub.customer !== "string") break;

        // updateMany : stripeCustomerId n'est pas @unique dans le schema
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: {
            plan: "FREE",
            planExpiresAt: new Date(), // Plan expiré immédiatement à la suppression
            stripeSubId: null,
          },
        });

        console.log(`[Stripe webhook] Abonnement supprimé pour customer ${sub.customer} → FREE`);
        break;
      }

      default:
        // Événement non géré — ignorer silencieusement
        break;
    }
  } catch (error) {
    console.error("[Stripe webhook] Erreur de traitement :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
