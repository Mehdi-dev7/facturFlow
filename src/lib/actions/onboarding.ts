'use server'

// src/lib/actions/onboarding.ts
// Marque l'onboarding comme terminé pour l'utilisateur connecté.

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

/**
 * Met à jour onboardingCompletedAt = now() pour l'utilisateur connecté.
 * Appelée depuis le composant OnboardingTutorial au clic sur "Terminer".
 */
export async function markOnboardingComplete(): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompletedAt: new Date() },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de mettre à jour l'onboarding" }
  }
}
