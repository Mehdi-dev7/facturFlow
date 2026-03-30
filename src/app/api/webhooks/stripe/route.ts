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
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

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
              metadata?: { invoiceId?: string; userId?: string; plan?: string; partnerCode?: string };
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

          // ── Créer le referral partenaire si un partnerCode est dans les metadata ──
          const partnerCode = sessionObj.metadata?.partnerCode;
          const plan = sessionObj.metadata?.plan as string | undefined;

          if (partnerCode && uid && plan) {
            try {
              // Récupérer le partenaire par code (findFirst car on filtre aussi par status)
              const partner = await prisma.partner.findFirst({
                where: { code: partnerCode, status: "ACTIVE" },
              });

              if (partner) {
                // Vérifier si le user a déjà un referral (unicité @@unique userId)
                const existingReferral = await prisma.partnerReferral.findUnique({
                  where: { userId: uid },
                });

                if (!existingReferral) {
                  // Déduire le billingCycle et monthlyAmount depuis le priceId exact
                  // On récupère le sub Stripe pour obtenir le price ID exact
                  let billingCycle = "MONTHLY";
                  let monthlyAmount = 0;
                  let commissionRate = partner.commissionMonthly;

                  if (sessionObj.subscription && typeof sessionObj.subscription === "string") {
                    try {
                      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
                      const sub = await stripe.subscriptions.retrieve(sessionObj.subscription);
                      const actualPriceId = sub.items.data[0]?.price.id;

                      if (
                        actualPriceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID ||
                        actualPriceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID
                      ) {
                        billingCycle = "YEARLY";
                        commissionRate = partner.commissionYearly;
                        monthlyAmount = plan === "BUSINESS" ? 192 : 95.9;
                      } else {
                        billingCycle = "MONTHLY";
                        commissionRate = partner.commissionMonthly;
                        monthlyAmount = plan === "BUSINESS" ? 20 : 9.99;
                      }
                    } catch {
                      // Fallback sur les montants monthly si impossible de récupérer le sub
                      monthlyAmount = plan === "BUSINESS" ? 20 : 9.99;
                    }
                  }

                  // Calculer la commission de la 1ère période
                  const commissionAmount = Math.round((monthlyAmount * commissionRate / 100) * 100) / 100;

                  // Créer le referral + première commission atomiquement
                  await prisma.partnerReferral.create({
                    data: {
                      partnerId: partner.id,
                      userId: uid,
                      plan: plan.toUpperCase(),
                      billingCycle,
                      monthlyAmount,
                      commissionRate,
                      stripeSubId: typeof sessionObj.subscription === "string" ? sessionObj.subscription : null,
                      status: "ACTIVE",
                      commissions: {
                        create: {
                          partnerId: partner.id,
                          periodIndex: 1,
                          amount: commissionAmount,
                          status: "PENDING",
                        },
                      },
                    },
                  });

                  console.log(
                    `[Stripe webhook] Referral créé : partner=${partner.code}, user=${uid}, plan=${plan}, commission=${commissionAmount}€`
                  );
                }
              }
            } catch (err) {
              // Ne pas bloquer le webhook pour un referral — juste logger
              console.error("[Stripe webhook] Erreur création referral partenaire:", err);
            }
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
          if (userId) {
            dispatchWebhook(userId, "invoice.paid", { id: invoiceId, provider: "stripe" }).catch(() => {});
          }
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

        // Si cancel_at_period_end = true → annulation programmée, on stocke la date de fin
        let planExpiresAt: Date | null = null;
        if (sub.cancel_at_period_end) {
          const item = sub.items.data[0] as unknown as { current_period_end?: number };
          const periodEnd = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
          if (periodEnd) planExpiresAt = new Date(periodEnd * 1000);
        }

        // updateMany : stripeCustomerId n'est pas @unique dans le schema
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: {
            plan,
            planExpiresAt,
            stripeSubId: sub.id,
          },
        });

        console.log(`[Stripe webhook] Plan ${plan} activé pour customer ${sub.customer}${planExpiresAt ? ` (annulation prévue le ${planExpiresAt.toISOString()})` : ""}`);

        // ── Détecter le coupon Fondateur et envoyer l'email de bienvenue ──────
        // On n'envoie l'email que sur "created" pour éviter les doublons lors des mises à jour
        if (eventType === "customer.subscription.created") {
          const discount = (sub as unknown as { discount?: { promotion_code?: string } }).discount;
          const isFounder = discount?.promotion_code === process.env.STRIPE_FOUNDER_PROMO_CODE_ID;

          if (isFounder) {
            const user = await prisma.user.findFirst({
              where: { stripeCustomerId: sub.customer as string },
              select: { email: true, name: true },
            });

            if (user) {
              const { sendFounderEmail } = await import("@/lib/email/send-founder-email");
              sendFounderEmail({
                to: user.email,
                name: user.name ?? user.email,
              }).catch((err: unknown) => console.error("[Founder email] Erreur:", err));
            }
          }
        }

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

      // ── Renouvellement d'abonnement Stripe → commission partenaire ───────
      case "invoice.paid": {
        // Cet événement se déclenche à chaque renouvellement (mensuel ou annuel).
        // On vérifie si le user a un referral partenaire actif et on crée la commission.
        try {
          const parsed = JSON.parse(rawBody) as {
            data: {
              object: {
                customer?: string;
                subscription?: string;
                billing_reason?: string; // "subscription_create" | "subscription_cycle" | etc.
              };
            };
          };
          const invoiceObj = parsed.data.object;

          // Ignorer la première facture (déjà gérée dans checkout.session.completed)
          if (invoiceObj.billing_reason === "subscription_create") break;
          if (!invoiceObj.customer || typeof invoiceObj.customer !== "string") break;

          // Trouver l'utilisateur via son stripeCustomerId
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: invoiceObj.customer },
            select: { id: true },
          });

          if (!user) break;

          // Vérifier si cet user a un referral partenaire actif
          const referral = await prisma.partnerReferral.findUnique({
            where: { userId: user.id },
            include: {
              partner: { select: { id: true, status: true } },
              commissions: { select: { id: true, periodIndex: true } },
            },
          });

          if (!referral || referral.status !== "ACTIVE" || referral.partner.status !== "ACTIVE") break;

          // Vérifier si on n'a pas atteint le maximum de 12 périodes
          const existingCount = referral.commissions.length;
          if (existingCount >= 12) {
            console.log(`[Stripe webhook] Referral ${referral.id} : limite de 12 commissions atteinte`);
            break;
          }

          // Calculer le montant de la commission pour cette période
          const commissionAmount =
            Math.round((referral.monthlyAmount * referral.commissionRate / 100) * 100) / 100;

          const periodIndex = existingCount + 1;

          // Créer la commission (@@unique [referralId, periodIndex] évite les doublons)
          await prisma.partnerCommission.create({
            data: {
              referralId: referral.id,
              partnerId: referral.partner.id,
              periodIndex,
              amount: commissionAmount,
              status: "PENDING",
            },
          });

          console.log(
            `[Stripe webhook] Commission partenaire créée : referral=${referral.id}, période=${periodIndex}/${12}, montant=${commissionAmount}€`
          );
        } catch (err) {
          // Ne pas bloquer le webhook — juste logger
          console.error("[Stripe webhook] Erreur traitement invoice.paid (partenaire):", err);
        }
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
