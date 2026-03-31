"use server";
// src/lib/actions/subscription.ts
// Server Actions pour la gestion des abonnements FacturNow.
//
// Stripe plateforme : clé secrète STRIPE_SECRET_KEY (pas la clé du user).
// On crée des Checkout Sessions pour les plans Pro/Business.
// Le webhook stripe met à jour le plan en DB après paiement confirmé.

import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/feature-gate";

// Instance Stripe plateforme (clé globale de FacturNow, pas celle du user)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ─── Price IDs selon plan + intervalle ───────────────────────────────────────

const PRICE_IDS = {
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  BUSINESS: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
  },
} as const;

// ─── getCurrentSubscription ───────────────────────────────────────────────────

/**
 * Retourne les infos d'abonnement de l'utilisateur connecté.
 * Utilisé pour afficher l'état du plan dans le dashboard.
 */
export async function getCurrentSubscription() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planExpiresAt: true,
        trialEndsAt: true,
        stripeSubId: true,
        stripeCustomerId: true,
        email: true,
        grantedPlan: true,
        bcPagesUsedThisMonth: true,
        bcPagesCredit: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" } as const;
    }

    const effectivePlan = getEffectivePlan(user);

    // Calculer les jours restants de trial
    let trialDaysLeft: number | null = null;
    if (user.trialEndsAt && user.trialEndsAt > new Date()) {
      const ms = user.trialEndsAt.getTime() - Date.now();
      trialDaysLeft = Math.ceil(ms / (1000 * 60 * 60 * 24));
    }

    return {
      success: true,
      data: {
        plan: user.plan,
        effectivePlan,
        trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
        trialDaysLeft,
        planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
        stripeSubId: user.stripeSubId,
        bcPagesUsedThisMonth: user.bcPagesUsedThisMonth,
        bcPagesCredit: user.bcPagesCredit,
      },
    } as const;
  } catch (error) {
    console.error("[getCurrentSubscription] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération de l'abonnement" } as const;
  }
}

// ─── createStripeCheckoutSession ──────────────────────────────────────────────

/**
 * Crée une Checkout Session Stripe pour souscrire à un plan.
 * Retourne l'URL de redirection vers la page de paiement Stripe.
 * @param promoCode   Code promo optionnel (ex: "FONDATEUR") — appliqué directement si valide
 * @param partnerCode Code partenaire optionnel — mutuellement exclusif avec FONDATEUR
 */
export async function createStripeCheckoutSession(
  plan: "PRO" | "BUSINESS",
  interval: "monthly" | "yearly",
  promoCode?: string,
  partnerCode?: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  const priceId = PRICE_IDS[plan][interval];
  if (!priceId) {
    return { success: false, error: "Plan ou intervalle invalide" } as const;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" } as const;
    }

    // Créer ou récupérer le customer Stripe pour cet utilisateur
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID en DB
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Résoudre le partnerCode si fourni : on vérifie qu'il est actif et on note s'il est fondateur
    let resolvedPartnerCode: string | undefined;
    let isFounderPartner = false;
    if (partnerCode) {
      const code = partnerCode.toUpperCase().trim();
      const partner = await prisma.partner.findFirst({
        where: { code, status: "ACTIVE" },
        select: { code: true, isFounder: true },
      });
      if (partner) {
        resolvedPartnerCode = partner.code;
        isFounderPartner = partner.isFounder;
      }
    }

    // Appliquer la promo fondateur si :
    // 1. promoCode manuel = "FONDATEUR" (champ texte au checkout), OU
    // 2. Le partnerCode est d'un partenaire marqué fondateur (isFounder = true)
    // Dans le cas 2, le referral est quand même tracké (non exclusif)
    const applyFounderPromo =
      (promoCode === "FONDATEUR" || isFounderPartner) &&
      !!process.env.STRIPE_FOUNDER_PROMO_CODE_ID;
    const discounts = applyFounderPromo
      ? [{ promotion_code: process.env.STRIPE_FOUNDER_PROMO_CODE_ID! }]
      : undefined;

    // Construire les metadata de la session (userId, plan + partnerCode si valide)
    const sessionMetadata: Record<string, string> = { userId: session.user.id, plan };
    if (resolvedPartnerCode) {
      sessionMetadata.partnerCode = resolvedPartnerCode;
    }

    // Créer la Checkout Session en mode subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: sessionMetadata,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.toLowerCase()}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      // Pré-remplir l'email du client
      customer_email: customerId ? undefined : user.email,
      // Message de réassurance affiché sous le bouton de paiement
      custom_text: {
        submit: {
          message: "Paiement 100% sécurisé par Stripe · Chiffrement SSL · Sans engagement · Annulable à tout moment depuis FacturNow",
        },
      },
      // Promo fondateur appliquée directement si applicable, sinon champ libre
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    });

    return { success: true, data: { url: checkoutSession.url! } } as const;
  } catch (error) {
    console.error("[createStripeCheckoutSession] Erreur:", error);
    return { success: false, error: "Erreur lors de la création de la session de paiement" } as const;
  }
}

// ─── cancelSubscription ───────────────────────────────────────────────────────

/**
 * Annule l'abonnement Stripe à la fin de la période en cours.
 * L'utilisateur garde son plan actif jusqu'à la date d'expiration.
 */
export async function cancelSubscription() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubId: true },
    });

    if (!user?.stripeSubId) {
      return { success: false, error: "Aucun abonnement actif trouvé" } as const;
    }

    // cancel_at_period_end : l'abonnement reste actif jusqu'à la fin de la période
    const updatedSub = await stripe.subscriptions.update(user.stripeSubId, {
      cancel_at_period_end: true,
    });

    // Dans l'API Stripe 2026-02-25+, current_period_end est sur les items
    const subItem = updatedSub.items.data[0] as unknown as { current_period_end?: number };
    const periodEnd = subItem?.current_period_end
      ? new Date(subItem.current_period_end * 1000)
      : null;

    if (periodEnd) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { planExpiresAt: periodEnd },
      });
    }

    return { success: true, data: { expiresAt: periodEnd?.toISOString() ?? null } } as const;
  } catch (error) {
    console.error("[cancelSubscription] Erreur:", error);
    return { success: false, error: "Erreur lors de l'annulation de l'abonnement" } as const;
  }
}

// ─── getStripePortalUrl ───────────────────────────────────────────────────────

/**
 * Génère un lien vers le portail de facturation Stripe.
 * Permet à l'utilisateur de gérer ses paiements, télécharger ses factures, etc.
 */
export async function getStripePortalUrl() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return { success: false, error: "Aucun compte de facturation trouvé" } as const;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard/subscription`,
    });

    return { success: true, data: { url: portalSession.url } } as const;
  } catch (error) {
    console.error("[getStripePortalUrl] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du portail de facturation" } as const;
  }
}

// ─── Packs de recharge pages BC ──────────────────────────────────────────────

import { BC_PAGE_PACKS, type BcPackPages } from "@/lib/bc-packs";

export async function createBcRechargeCheckout(pages: BcPackPages) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false, error: "Non authentifié" } as const;

  const pack = BC_PAGE_PACKS.find((p) => p.pages === pages);
  if (!pack) return { success: false, error: "Pack invalide" } as const;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Créer ou récupérer le customer Stripe
    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user?.email ?? undefined });
      customerId = customer.id;
      await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: pack.price * 100,
          product_data: {
            name: `Crédit extraction BC — ${pack.label}`,
            description: `${pack.pages} pages supplémentaires pour l'import de bons de commande`,
          },
        },
        quantity: 1,
      }],
      metadata: { userId: session.user.id, bcPages: String(pack.pages), type: "bc_recharge" },
      success_url: `${appUrl}/dashboard/subscription?bc_recharge=success`,
      cancel_url: `${appUrl}/dashboard/subscription`,
    });

    return { success: true, data: { url: checkoutSession.url } } as const;
  } catch (error) {
    console.error("[createBcRechargeCheckout] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du paiement" } as const;
  }
}
