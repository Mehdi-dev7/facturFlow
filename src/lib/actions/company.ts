"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Schema de validation ─────────────────────────────────────────────────────

const companySchema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  companySiren: z.string().min(9, "SIREN requis (9 chiffres)").max(9, "SIREN doit faire 9 chiffres"),
  companySiret: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().min(5, "Adresse requise"),
  companyPostalCode: z.string().min(5, "Code postal requis"),
  companyCity: z.string().min(2, "Ville requise"),
  companyEmail: z.string().email("Email invalide").min(1, "Email entreprise requis"),
  companyPhone: z.string().optional(),
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

    // Mise à jour en base
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        companyName: validatedData.companyName,
        companySiren: validatedData.companySiren,
        companySiret: validatedData.companySiret || null,
        companyVatNumber: validatedData.companyVatNumber || null,
        companyAddress: validatedData.companyAddress,
        companyPostalCode: validatedData.companyPostalCode,
        companyCity: validatedData.companyCity,
        companyEmail: validatedData.companyEmail,
        companyPhone: validatedData.companyPhone || null,
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