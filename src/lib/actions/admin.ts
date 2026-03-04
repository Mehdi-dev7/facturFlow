// src/lib/actions/admin.ts
// Server Actions réservées à l'admin (email === ADMIN_EMAIL).
// Toutes les fonctions vérifient l'identité avant d'exécuter quoi que ce soit.

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  plan: string;
  grantedPlan: string | null;
  trialEndsAt: Date | null;
  trialUsed: boolean;
  createdAt: Date;
}

export interface AdminStats {
  total: number;
  free: number;
  pro: number;
  business: number;
  invited: number;
  trial: number;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Liste paginée des utilisateurs avec recherche et filtre par plan.
 */
export async function getAdminUsers({
  page = 1,
  search = "",
  planFilter = "",
}: {
  page?: number;
  search?: string;
  planFilter?: string;
}): Promise<{ success: boolean; data?: { users: AdminUser[]; total: number; pages: number }; error?: string }> {
  try {
    await requireAdmin();

    const PAGE_SIZE = 20;
    const skip = (page - 1) * PAGE_SIZE;

    const where = {
      AND: [
        // Recherche par nom ou email
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        // Filtre par plan (FREE/PRO/BUSINESS/INVITED)
        planFilter === "INVITED"
          ? { grantedPlan: { not: null } }
          : planFilter
          ? { plan: planFilter }
          : {},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plan: true,
          grantedPlan: true,
          trialEndsAt: true,
          trialUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: {
        users,
        total,
        pages: Math.ceil(total / PAGE_SIZE),
      },
    };
  } catch (error) {
    console.error("[admin] getAdminUsers error:", error);
    return { success: false, error: "Erreur lors du chargement des utilisateurs" };
  }
}

/**
 * Stats globales : total users par plan + invités + trial actifs.
 */
export async function getAdminStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
  try {
    await requireAdmin();

    const now = new Date();

    const [total, free, pro, business, invited, trial] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "FREE", grantedPlan: null } }),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.user.count({ where: { plan: "BUSINESS" } }),
      prisma.user.count({ where: { grantedPlan: { not: null } } }),
      prisma.user.count({ where: { trialEndsAt: { gt: now } } }),
    ]);

    return { success: true, data: { total, free, pro, business, invited, trial } };
  } catch (error) {
    console.error("[admin] getAdminStats error:", error);
    return { success: false, error: "Erreur lors du chargement des stats" };
  }
}

/**
 * Accorde l'accès BUSINESS à un utilisateur (mode invité).
 */
export async function grantGuestAccess(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin();

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        grantedPlan: "BUSINESS",
        grantedById: session.user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[admin] grantGuestAccess error:", error);
    return { success: false, error: "Erreur lors de l'attribution de l'accès" };
  }
}

/**
 * Révoque l'accès invité d'un utilisateur (retour à son plan DB).
 */
export async function revokeGuestAccess(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        grantedPlan: null,
        grantedById: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[admin] revokeGuestAccess error:", error);
    return { success: false, error: "Erreur lors de la révocation de l'accès" };
  }
}
