"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Schema de validation ─────────────────────────────────────────────────────

const companySchema = z.object({
  // Tous les champs sont optionnels (String? en DB) — pas de blocage si incomplet
  companyName: z.string().optional(),
  // SIREN : si renseigné, doit faire exactement 9 chiffres
  companySiren: z
    .string()
    .refine((v) => !v || /^\d{9}$/.test(v), "SIREN doit faire 9 chiffres")
    .optional(),
  companySiret: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPostalCode: z.string().optional(),
  companyCity: z.string().optional(),
  // Email : si renseigné, doit être valide
  companyEmail: z
    .union([z.literal(""), z.string().email("Email professionnel invalide")])
    .optional(),
  companyPhone: z.string().optional(),
  // Coordonnées bancaires affichées sur les factures
  iban: z.string().optional(),
  bic: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Récupère les informations de l'entreprise de l'utilisateur connecté
 */
export async function getCompanyInfo() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: null } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        companyName: true,
        companySiren: true,
        companySiret: true,
        companyVatNumber: true,
        companyAddress: true,
        companyPostalCode: true,
        companyCity: true,
        companyEmail: true,
        companyPhone: true,
        iban: true,
        bic: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable", data: null } as const;
    }

    return { success: true, data: user } as const;
  } catch (error) {
    console.error("[getCompanyInfo] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération", data: null } as const;
  }
}

/**
 * Met à jour les informations de l'entreprise de l'utilisateur connecté
 */
export async function updateCompanyInfo(data: CompanyFormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    // Validation des données
    const validatedData = companySchema.parse(data);

    // Mise à jour en base (|| null → champ vide stocké comme NULL, pas string vide)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        companyName: validatedData.companyName || null,
        companySiren: validatedData.companySiren || null,
        companySiret: validatedData.companySiret || null,
        companyVatNumber: validatedData.companyVatNumber || null,
        companyAddress: validatedData.companyAddress || null,
        companyPostalCode: validatedData.companyPostalCode || null,
        companyCity: validatedData.companyCity || null,
        companyEmail: validatedData.companyEmail || null,
        companyPhone: validatedData.companyPhone || null,
        // Coordonnées bancaires (affichées sur les factures)
        iban: validatedData.iban || null,
        bic: validatedData.bic || null,
      },
    });

    // Revalider les pages qui utilisent ces données
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/invoices");

    return { success: true } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Données invalides", 
        details: error.issues 
      } as const;
    }
    
    console.error("[updateCompanyInfo] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour" } as const;
  }
}