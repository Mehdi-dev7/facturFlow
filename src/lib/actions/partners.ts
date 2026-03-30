"use server";
// src/lib/actions/partners.ts
// Server Actions pour la gestion du système d'affiliation / partenaires.
// Toutes les actions (sauf getPartnerByToken) nécessitent d'être admin.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

// ─── Guard admin ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (
    !session?.user?.email ||
    !process.env.ADMIN_EMAIL ||
    session.user.email !== process.env.ADMIN_EMAIL
  ) {
    throw new Error("Accès non autorisé");
  }
  return session;
}

// ─── Types exportés ───────────────────────────────────────────────────────────

export interface PartnerWithStats {
  id: string;
  name: string;
  email: string;
  code: string;
  token: string;
  commissionMonthly: number;
  commissionYearly: number;
  iban: string | null;
  status: string;
  createdAt: Date;
  _count: { referrals: number };
  totalDue: number;    // Somme commissions PENDING (€)
  totalPaid: number;   // Somme commissions PAID (€)
  referralsCount: number;
}

export interface PartnerReferralDetail {
  id: string;
  userId: string;
  plan: string;
  billingCycle: string;
  monthlyAmount: number;
  commissionRate: number;
  status: string;
  createdAt: Date;
  commissionsCount: number;
  commissionsPending: number;
  commissionsPaid: number;
}

export interface PartnerCommissionDetail {
  id: string;
  referralId: string;
  periodIndex: number;
  amount: number;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface PartnerStatsData {
  partner: PartnerWithStats;
  referrals: PartnerReferralDetail[];
  commissions: PartnerCommissionDetail[];
  totalDue: number;
  totalPaid: number;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Récupère la liste de tous les partenaires avec leurs statistiques.
 */
export async function getPartners(): Promise<{
  success: boolean;
  data?: PartnerWithStats[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const partners = await prisma.partner.findMany({
      include: {
        _count: { select: { referrals: true } },
        referrals: {
          include: {
            commissions: {
              select: { amount: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcul des totaux par partenaire
    const result: PartnerWithStats[] = partners.map((p) => {
      let totalDue = 0;
      let totalPaid = 0;

      for (const referral of p.referrals) {
        for (const commission of referral.commissions) {
          if (commission.status === "PENDING") totalDue += commission.amount;
          if (commission.status === "PAID") totalPaid += commission.amount;
        }
      }

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        code: p.code,
        token: p.token,
        commissionMonthly: p.commissionMonthly,
        commissionYearly: p.commissionYearly,
        iban: p.iban,
        status: p.status,
        createdAt: p.createdAt,
        _count: p._count,
        totalDue: Math.round(totalDue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        referralsCount: p._count.referrals,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[partners] getPartners error:", error);
    return { success: false, error: "Erreur lors du chargement des partenaires" };
  }
}

/**
 * Crée un nouveau partenaire.
 * Génère automatiquement un token 32 chars pour le portail public.
 */
export async function createPartner(data: {
  name: string;
  email: string;
  code: string;
  commissionMonthly?: number;
  commissionYearly?: number;
  iban?: string;
}): Promise<{ success: boolean; data?: PartnerWithStats; error?: string }> {
  try {
    await requireAdmin();

    // Normaliser le code en uppercase
    const code = data.code.toUpperCase().trim();

    // Vérifier l'unicité du code et de l'email
    const existing = await prisma.partner.findFirst({
      where: { OR: [{ code }, { email: data.email }] },
    });
    if (existing) {
      if (existing.code === code) return { success: false, error: "Ce code partenaire est déjà utilisé" };
      return { success: false, error: "Cet email est déjà utilisé" };
    }

    // Générer un token unique 32 chars
    const token = randomBytes(16).toString("hex");

    const partner = await prisma.partner.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        code,
        token,
        commissionMonthly: data.commissionMonthly ?? 10,
        commissionYearly: data.commissionYearly ?? 15,
        iban: data.iban?.trim() || null,
      },
      include: {
        _count: { select: { referrals: true } },
      },
    });

    revalidatePath("/admin/partners");

    return {
      success: true,
      data: {
        ...partner,
        totalDue: 0,
        totalPaid: 0,
        referralsCount: 0,
      },
    };
  } catch (error) {
    console.error("[partners] createPartner error:", error);
    return { success: false, error: "Erreur lors de la création du partenaire" };
  }
}

/**
 * Met à jour un partenaire existant (nom, email, IBAN, statut, commissions).
 */
export async function updatePartner(
  id: string,
  data: {
    name?: string;
    email?: string;
    iban?: string | null;
    status?: string;
    commissionMonthly?: number;
    commissionYearly?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await prisma.partner.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.email !== undefined && { email: data.email.toLowerCase().trim() }),
        ...(data.iban !== undefined && { iban: data.iban?.trim() || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.commissionMonthly !== undefined && { commissionMonthly: data.commissionMonthly }),
        ...(data.commissionYearly !== undefined && { commissionYearly: data.commissionYearly }),
      },
    });

    revalidatePath("/admin/partners");
    return { success: true };
  } catch (error) {
    console.error("[partners] updatePartner error:", error);
    return { success: false, error: "Erreur lors de la mise à jour du partenaire" };
  }
}

/**
 * Supprime un partenaire — uniquement si aucun referral n'existe.
 */
export async function deletePartner(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const referralsCount = await prisma.partnerReferral.count({ where: { partnerId: id } });
    if (referralsCount > 0) {
      return {
        success: false,
        error: `Impossible de supprimer : ${referralsCount} referral(s) associé(s)`,
      };
    }

    await prisma.partner.delete({ where: { id } });

    revalidatePath("/admin/partners");
    return { success: true };
  } catch (error) {
    console.error("[partners] deletePartner error:", error);
    return { success: false, error: "Erreur lors de la suppression du partenaire" };
  }
}

/**
 * Stats détaillées d'un partenaire : referrals + commissions.
 */
export async function getPartnerStats(
  partnerId: string
): Promise<{ success: boolean; data?: PartnerStatsData; error?: string }> {
  try {
    await requireAdmin();

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        _count: { select: { referrals: true } },
        referrals: {
          include: {
            commissions: {
              orderBy: { periodIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) return { success: false, error: "Partenaire introuvable" };

    // Construire les stats du partenaire
    let totalDue = 0;
    let totalPaid = 0;
    const referrals: PartnerReferralDetail[] = [];
    const allCommissions: PartnerCommissionDetail[] = [];

    for (const referral of partner.referrals) {
      let refPending = 0;
      let refPaid = 0;

      for (const commission of referral.commissions) {
        if (commission.status === "PENDING") {
          refPending += commission.amount;
          totalDue += commission.amount;
        }
        if (commission.status === "PAID") {
          refPaid += commission.amount;
          totalPaid += commission.amount;
        }

        allCommissions.push({
          id: commission.id,
          referralId: commission.referralId,
          periodIndex: commission.periodIndex,
          amount: commission.amount,
          status: commission.status,
          paidAt: commission.paidAt,
          createdAt: commission.createdAt,
        });
      }

      referrals.push({
        id: referral.id,
        userId: referral.userId,
        plan: referral.plan,
        billingCycle: referral.billingCycle,
        monthlyAmount: referral.monthlyAmount,
        commissionRate: referral.commissionRate,
        status: referral.status,
        createdAt: referral.createdAt,
        commissionsCount: referral.commissions.length,
        commissionsPending: Math.round(refPending * 100) / 100,
        commissionsPaid: Math.round(refPaid * 100) / 100,
      });
    }

    const partnerWithStats: PartnerWithStats = {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      code: partner.code,
      token: partner.token,
      commissionMonthly: partner.commissionMonthly,
      commissionYearly: partner.commissionYearly,
      iban: partner.iban,
      status: partner.status,
      createdAt: partner.createdAt,
      _count: partner._count,
      totalDue: Math.round(totalDue * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      referralsCount: partner._count.referrals,
    };

    return {
      success: true,
      data: {
        partner: partnerWithStats,
        referrals,
        commissions: allCommissions,
        totalDue: Math.round(totalDue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
      },
    };
  } catch (error) {
    console.error("[partners] getPartnerStats error:", error);
    return { success: false, error: "Erreur lors du chargement des stats" };
  }
}

/**
 * Marque une commission spécifique comme payée.
 */
export async function markCommissionPaid(
  commissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await prisma.partnerCommission.update({
      where: { id: commissionId },
      data: { status: "PAID", paidAt: new Date() },
    });

    revalidatePath("/admin/partners");
    return { success: true };
  } catch (error) {
    console.error("[partners] markCommissionPaid error:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la commission" };
  }
}

/**
 * Marque toutes les commissions PENDING d'un partenaire comme payées en une transaction.
 */
export async function markAllPendingPaid(
  partnerId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await requireAdmin();

    const result = await prisma.partnerCommission.updateMany({
      where: { partnerId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });

    revalidatePath("/admin/partners");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("[partners] markAllPendingPaid error:", error);
    return { success: false, error: "Erreur lors du paiement des commissions" };
  }
}

/**
 * Récupère un partenaire par son token (portail public — pas de guard admin).
 * Inclut referrals + commissions pour affichage côté partenaire.
 */
export async function getPartnerByToken(token: string): Promise<{
  success: boolean;
  data?: PartnerStatsData;
  error?: string;
}> {
  try {
    const partner = await prisma.partner.findUnique({
      where: { token },
      include: {
        _count: { select: { referrals: true } },
        referrals: {
          include: {
            commissions: {
              orderBy: { periodIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) return { success: false, error: "Partenaire introuvable" };

    // Construire les données (même logique que getPartnerStats)
    let totalDue = 0;
    let totalPaid = 0;
    const referrals: PartnerReferralDetail[] = [];
    const allCommissions: PartnerCommissionDetail[] = [];

    for (const referral of partner.referrals) {
      let refPending = 0;
      let refPaid = 0;

      for (const commission of referral.commissions) {
        if (commission.status === "PENDING") {
          refPending += commission.amount;
          totalDue += commission.amount;
        }
        if (commission.status === "PAID") {
          refPaid += commission.amount;
          totalPaid += commission.amount;
        }

        allCommissions.push({
          id: commission.id,
          referralId: commission.referralId,
          periodIndex: commission.periodIndex,
          amount: commission.amount,
          status: commission.status,
          paidAt: commission.paidAt,
          createdAt: commission.createdAt,
        });
      }

      referrals.push({
        id: referral.id,
        userId: referral.userId,
        plan: referral.plan,
        billingCycle: referral.billingCycle,
        monthlyAmount: referral.monthlyAmount,
        commissionRate: referral.commissionRate,
        status: referral.status,
        createdAt: referral.createdAt,
        commissionsCount: referral.commissions.length,
        commissionsPending: Math.round(refPending * 100) / 100,
        commissionsPaid: Math.round(refPaid * 100) / 100,
      });
    }

    const partnerWithStats: PartnerWithStats = {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      code: partner.code,
      token: partner.token,
      commissionMonthly: partner.commissionMonthly,
      commissionYearly: partner.commissionYearly,
      iban: partner.iban,
      status: partner.status,
      createdAt: partner.createdAt,
      _count: partner._count,
      totalDue: Math.round(totalDue * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      referralsCount: partner._count.referrals,
    };

    return {
      success: true,
      data: {
        partner: partnerWithStats,
        referrals,
        commissions: allCommissions,
        totalDue: Math.round(totalDue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
      },
    };
  } catch (error) {
    console.error("[partners] getPartnerByToken error:", error);
    return { success: false, error: "Erreur lors du chargement des données partenaire" };
  }
}
