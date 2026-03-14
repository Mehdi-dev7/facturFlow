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
 */
export async function createStripeCheckoutSession(
  plan: "PRO" | "BUSINESS",
  interval: "monthly" | "yearly"
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

    // Créer la Checkout Session en mode subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: session.user.id, plan },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      // Pré-remplir l'email du client
      customer_email: customerId ? undefined : user.email,
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
