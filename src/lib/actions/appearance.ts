"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppearanceData {
  themeColor: string;
  companyFont: string;
  companyName: string;
  companyLogo: string | null;
}

// ─── Sauvegarder les réglages d'apparence ────────────────────────────────────

export async function saveAppearance(data: AppearanceData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Non authentifié" } as const;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        themeColor: data.themeColor,
        companyFont: data.companyFont,
        companyName: data.companyName,
        companyLogo: data.companyLogo,
      },
    });

    revalidatePath("/dashboard");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Erreur lors de la sauvegarde" } as const;
  }
}

// ─── Récupérer les réglages de l'utilisateur connecté ────────────────────────

export async function getAppearanceSettings() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      themeColor: true,
      companyFont: true,
      companyName: true,
      companyLogo: true,
    },
  });
}
