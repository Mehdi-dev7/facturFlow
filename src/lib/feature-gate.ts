// src/lib/feature-gate.ts
// Contrôle d'accès aux fonctionnalités selon le plan de l'utilisateur.
//
// Plans :
//  FREE     — 5 docs/mois, 3 clients max, pas de paiements en ligne
//  PRO      — tout illimité + paiements + apparence + stats + exports CSV + 100 factures élec.
//  BUSINESS — tout PRO + multi-users + exports FEC + rapports comptables + API/webhooks
//
// Un user en trial voit son plan effectif comme PRO tant que trialEndsAt > now.

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Feature =
  | "unlimited_documents"
  | "unlimited_clients"
  | "custom_appearance"
  | "payment_stripe"
  | "payment_paypal"
  | "payment_gocardless"
  | "auto_reminders"
  | "recurring_invoices"
  | "statistics"
  | "business_templates"
  | "csv_export"
  | "einvoice_100"
  | "einvoice_unlimited"
  | "fec_export"
  | "monthly_accounting_report"
  | "annual_report"
  | "legal_archiving"
  | "api_webhooks"
  | "priority_support"
  | "multi_users";

// ─── Limites du plan FREE ─────────────────────────────────────────────────────

export const FREE_LIMITS = {
  documentsPerMonth: 5,
  clients: 3,
} as const;

// ─── Features par plan ────────────────────────────────────────────────────────

const PRO_FEATURES: Feature[] = [
  "unlimited_documents",
  "unlimited_clients",
  "custom_appearance",
  "payment_stripe",
  "payment_paypal",
  "payment_gocardless",
  "auto_reminders",
  "recurring_invoices",
  "statistics",
  "business_templates",
  "csv_export",
  "einvoice_100",
];

const BUSINESS_FEATURES: Feature[] = [
  ...PRO_FEATURES,
  "einvoice_unlimited",
  "fec_export",
  "monthly_accounting_report",
  "annual_report",
  "legal_archiving",
  "api_webhooks",
  "priority_support",
  "multi_users",
];

const FEATURES_BY_PLAN: Record<string, Feature[]> = {
  FREE: [],
  PRO: PRO_FEATURES,
  BUSINESS: BUSINESS_FEATURES,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retourne le plan effectif de l'utilisateur.
 * Si le trial est encore actif (trialEndsAt > maintenant), le plan retourné est PRO.
 */
export function getEffectivePlan(
  user: { plan: string; trialEndsAt: Date | null }
): "FREE" | "PRO" | "BUSINESS" {
  // Trial actif → on considère l'utilisateur en PRO
  if (user.trialEndsAt && user.trialEndsAt > new Date()) {
    return "PRO";
  }

  if (user.plan === "BUSINESS") return "BUSINESS";
  if (user.plan === "PRO") return "PRO";
  return "FREE";
}

/**
 * Vérifie si l'utilisateur a accès à une feature donnée.
 */
export function canUseFeature(
  user: { plan: string; trialEndsAt: Date | null },
  feature: Feature
): boolean {
  const effectivePlan = getEffectivePlan(user);
  const features = FEATURES_BY_PLAN[effectivePlan] ?? [];
  return features.includes(feature);
}

/**
 * Vérifie si l'utilisateur peut créer un nouveau document ce mois-ci.
 * Les plans PRO et BUSINESS sont illimités.
 */
export async function canCreateDocument(
  userId: string
): Promise<{ allowed: boolean; count: number; max: number }> {
  // Récupérer le plan de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, trialEndsAt: true },
  });

  if (!user) return { allowed: false, count: 0, max: 0 };

  const effectivePlan = getEffectivePlan(user);

  // PRO et BUSINESS sont illimités
  if (effectivePlan !== "FREE") {
    return { allowed: true, count: 0, max: Infinity };
  }

  // FREE : compter les documents créés ce mois-ci (hors brouillons temporaires)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.document.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
      // Exclure les brouillons temporaires (numéro commence par "BROUILLON-")
      NOT: { number: { startsWith: "BROUILLON-" } },
    },
  });

  const max = FREE_LIMITS.documentsPerMonth;
  return { allowed: count < max, count, max };
}

/**
 * Vérifie si l'utilisateur peut ajouter un nouveau client.
 * Les plans PRO et BUSINESS sont illimités.
 */
export async function canAddClient(
  userId: string
): Promise<{ allowed: boolean; count: number; max: number }> {
  // Récupérer le plan de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, trialEndsAt: true },
  });

  if (!user) return { allowed: false, count: 0, max: 0 };

  const effectivePlan = getEffectivePlan(user);

  // PRO et BUSINESS sont illimités
  if (effectivePlan !== "FREE") {
    return { allowed: true, count: 0, max: Infinity };
  }

  // FREE : compter le total de clients
  const count = await prisma.client.count({ where: { userId } });

  const max = FREE_LIMITS.clients;
  return { allowed: count < max, count, max };
}
