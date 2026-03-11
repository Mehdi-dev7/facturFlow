'use server'

// src/lib/actions/reviews.ts
// Actions serveur pour le système d'avis clients.

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ─── Schémas de validation ────────────────────────────────────────────────────

const submitSchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

// ─── Helper admin ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const adminEmail = process.env.ADMIN_EMAIL
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return null
  }
  return session
}

// ─── Actions publiques ────────────────────────────────────────────────────────

/**
 * Soumet l'avis à partir du token unique (lien email).
 * Met à jour le Review existant avec la note, le commentaire et la date de soumission.
 */
export async function submitReview(
  token: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = submitSchema.safeParse({ token, rating, comment })
  if (!parsed.success) {
    return { success: false, error: "Données invalides" }
  }

  try {
    // Vérifier que le token existe et que l'avis n'a pas encore été soumis
    const review = await prisma.review.findUnique({ where: { token } })
    if (!review) {
      return { success: false, error: "Lien invalide ou expiré" }
    }
    if (review.submittedAt) {
      return { success: false, error: "Avis déjà soumis" }
    }

    await prisma.review.update({
      where: { token },
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
        submittedAt: new Date(),
        // Le status reste PENDING — c'est l'admin qui valide
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: "Erreur lors de la soumission" }
  }
}

/**
 * Retourne les avis APPROVED pour l'affichage public (landing page).
 * Inclut note, commentaire tronqué, prénom + initiale du nom.
 */
export async function getApprovedReviews(): Promise<{
  id: string
  rating: number
  comment: string | null
  displayName: string
  submittedAt: string
}[]> {
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED", submittedAt: { not: null } },
    include: { user: { select: { name: true } } },
    orderBy: { submittedAt: "desc" },
  })

  return reviews.map((r) => {
    // Construire le nom affiché : "Prénom N."
    const parts = r.user.name.trim().split(" ")
    const displayName =
      parts.length >= 2
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : r.user.name

    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      displayName,
      submittedAt: r.submittedAt!.toISOString(),
    }
  })
}

// ─── Actions admin ────────────────────────────────────────────────────────────

/** Retourne tous les avis avec le détail de l'user (admin uniquement). */
export async function getReviews(): Promise<{
  success: boolean
  data?: {
    id: string
    rating: number
    comment: string | null
    status: string
    submittedAt: string | null
    user: { name: string; email: string }
  }[]
  error?: string
}> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: "Non autorisé" }

  const reviews = await prisma.review.findMany({
    where: { submittedAt: { not: null } }, // uniquement ceux soumis
    include: { user: { select: { name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
  })

  return {
    success: true,
    data: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      user: { name: r.user.name, email: r.user.email },
    })),
  }
}

/** Approuve un avis (admin uniquement). */
export async function approveReview(id: string): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: "Non autorisé" }

  try {
    await prisma.review.update({ where: { id }, data: { status: "APPROVED" } })
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Erreur lors de l'approbation" }
  }
}

/** Rejette un avis (admin uniquement). */
export async function rejectReview(id: string): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: "Non autorisé" }

  try {
    await prisma.review.update({ where: { id }, data: { status: "REJECTED" } })
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Erreur lors du rejet" }
  }
}

/** Compte les avis en attente de validation (admin uniquement). */
export async function getPendingReviewsCount(): Promise<number> {
  const admin = await requireAdmin()
  if (!admin) return 0

  return prisma.review.count({
    where: { status: "PENDING", submittedAt: { not: null } },
  })
}
