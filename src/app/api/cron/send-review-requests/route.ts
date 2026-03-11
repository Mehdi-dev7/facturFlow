// src/app/api/cron/send-review-requests/route.ts
// Cron : envoie les demandes d'avis aux users PRO/BUSINESS inscrits depuis >= 7 jours.
// Exporté comme runSendReviewRequests() pour être orchestré par le cron nightly.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendReviewRequestEmail } from "@/lib/email/send-review-request-email"

/**
 * Logique principale — utilisable depuis le cron nightly sans passer par HTTP.
 * Trouve les users éligibles (inscrits >= 7 jours, pas encore contactés, plan != FREE)
 * et envoie un email avec un token unique.
 */
export async function runSendReviewRequests(): Promise<{
  sent: number
  errors: number
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Users éligibles : inscrits depuis >= 7j, pas encore d'email envoyé, plan actif
  const eligibleUsers = await prisma.user.findMany({
    where: {
      createdAt: { lte: sevenDaysAgo },
      reviewEmailSentAt: null,
      // Exclure les utilisateurs FREE (seulement les payants / trial / invités)
      NOT: {
        AND: [
          { plan: "FREE" },
          { grantedPlan: null },
          {
            OR: [
              { trialEndsAt: null },
              { trialEndsAt: { lt: new Date() } },
            ],
          },
        ],
      },
    },
    select: { id: true, name: true, email: true },
  })

  let sent = 0
  let errors = 0

  for (const user of eligibleUsers) {
    try {
      const token = crypto.randomUUID()

      // Créer le Review en DB (vide — l'user le remplira via le lien)
      await prisma.review.create({
        data: {
          userId: user.id,
          token,
          rating: 0, // sera mis à jour à la soumission
          status: "PENDING",
        },
      })

      // Envoyer l'email
      await sendReviewRequestEmail({
        to: user.email,
        userName: user.name,
        token,
      })

      // Marquer l'email comme envoyé
      await prisma.user.update({
        where: { id: user.id },
        data: { reviewEmailSentAt: new Date() },
      })

      sent++
      console.log(`[review-requests] Email envoyé à ${user.email}`)
    } catch (err) {
      errors++
      console.error(`[review-requests] Erreur pour ${user.email}:`, err)
    }
  }

  console.log(`[review-requests] Terminé — ${sent} envoyés, ${errors} erreurs`)
  return { sent, errors }
}

// ─── Route HTTP (test manuel en dev) ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runSendReviewRequests()
  return NextResponse.json({ success: true, ...result })
}
