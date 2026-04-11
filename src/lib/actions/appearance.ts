"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/feature-gate";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DEFAULT_THEME_COLOR = "#7c3aed";
const DEFAULT_FONT = "Inter";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppearanceData {
  themeColor: string;
  companyFont: string;
  companyName: string;
  companyLogo: string | null;
  invoiceFooter: string;
  headerTextColor: string;
}

export interface AppearanceSettings extends AppearanceData {
  /** true si le user est en plan FREE — les champs Pro-gated retournent leurs valeurs par défaut */
  isCustomAppearanceLocked: boolean;
  /** Devise choisie par l'utilisateur (gérée depuis Mon Profil) */
  currency: string;
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
        invoiceFooter: data.invoiceFooter || null,
        headerTextColor: data.headerTextColor ?? "auto",
      },
    });

    revalidatePath("/dashboard");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Erreur lors de la sauvegarde" } as const;
  }
}

// ─── Récupérer les réglages de l'utilisateur connecté ────────────────────────

export async function getAppearanceSettings(): Promise<AppearanceSettings | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // On récupère les champs nécessaires à getEffectivePlan + les champs apparence
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      themeColor: true,
      companyFont: true,
      companyName: true,
      companyLogo: true,
      invoiceFooter: true,
      headerTextColor: true,
      currency: true,
      // Champs pour le calcul du plan effectif
      plan: true,
      trialEndsAt: true,
      email: true,
      grantedPlan: true,
    },
  });

  if (!user) return null;

  const effectivePlan = getEffectivePlan({
    plan: user.plan,
    trialEndsAt: user.trialEndsAt,
    email: user.email,
    grantedPlan: user.grantedPlan,
  });

  const isCustomAppearanceLocked = effectivePlan === "FREE";

  // Sur plan FREE, on renvoie les valeurs par défaut pour les champs Pro-gated
  // afin que le rendu PDF et les previews utilisent toujours des valeurs cohérentes.
  // companyName et invoiceFooter restent accessibles en FREE (pas de restriction).
  return {
    themeColor: isCustomAppearanceLocked ? DEFAULT_THEME_COLOR : (user.themeColor ?? DEFAULT_THEME_COLOR),
    companyFont: isCustomAppearanceLocked ? DEFAULT_FONT : (user.companyFont ?? DEFAULT_FONT),
    companyName: user.companyName ?? "",
    companyLogo: isCustomAppearanceLocked ? null : (user.companyLogo ?? null),
    invoiceFooter: user.invoiceFooter ?? "",
    headerTextColor: user.headerTextColor ?? "auto",
    currency: user.currency ?? "EUR",
    isCustomAppearanceLocked,
  };
}
