"use server";

// Server actions pour les avoirs (CREDIT_NOTE)
// Pattern identique aux reçus (receipts.ts)

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { SavedCreditNote } from "@/lib/types/credit-notes";

// ─── Schema Zod de création ──────────────────────────────────────────────────

const createCreditNoteSchema = z.object({
  invoiceId: z.string().min(1, "Facture requise"),
  type: z.enum(["full", "partial"]),
  amount: z.number().positive("Le montant doit être positif").optional(),
  reason: z.string().min(1, "Motif requis"),
  notes: z.string().optional(),
});

export type CreateCreditNoteInput = z.infer<typeof createCreditNoteSchema>;

// ─── Prisma include partagé ──────────────────────────────────────────────────

const creditNoteInclude = {
  client: {
    select: {
      id: true,
      companyName: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      postalCode: true,
      city: true,
      companySiret: true,
    },
  },
  user: {
    select: {
      name: true,
      companyName: true,
      companySiret: true,
      companyAddress: true,
      companyPostalCode: true,
      companyCity: true,
      companyEmail: true,
      companyPhone: true,
      themeColor: true,
      companyFont: true,
      invoiceFooter: true,
      companyLogo: true,
      iban: true,
      bic: true,
    },
  },
} as const;

// ─── Type Prisma interne ─────────────────────────────────────────────────────

type PrismaCreditNoteWithRelations = {
  id: string;
  number: string;
  status: string;
  date: Date;
  total: { toNumber: () => number };
  notes: string | null;
  businessMetadata: unknown;
  clientId: string;
  createdAt: Date;
  client: SavedCreditNote["client"];
  user: SavedCreditNote["user"];
};

// ─── Mapper Prisma → SavedCreditNote ────────────────────────────────────────

function mapToSavedCreditNote(doc: PrismaCreditNoteWithRelations): SavedCreditNote {
  const meta = doc.businessMetadata as Record<string, unknown> | null;
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    total: doc.total.toNumber(),
    // Extraire les champs stockés dans businessMetadata
    type: (meta?.type as "full" | "partial") ?? "full",
    reason: (meta?.reason as string) ?? "autre",
    invoiceId: (meta?.invoiceId as string) ?? "",
    invoiceNumber: (meta?.invoiceNumber as string) ?? "",
    notes: doc.notes,
    client: doc.client,
    user: doc.user,
    createdAt: doc.createdAt.toISOString(),
  };
}

// ─── Action : créer un avoir ─────────────────────────────────────────────────

export async function createCreditNote(data: CreateCreditNoteInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }
  const userId = session.user.id;

  // Validation côté serveur
  let parsed: CreateCreditNoteInput;
  try {
    parsed = createCreditNoteSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // 1. Vérifier que la facture appartient à l'utilisateur et est de type INVOICE
    const invoice = await prisma.document.findFirst({
      where: { id: parsed.invoiceId, userId, type: "INVOICE" },
      select: { id: true, number: true, total: true, clientId: true, status: true },
    });

    if (!invoice) {
      return { success: false, error: "Facture introuvable ou non autorisée" } as const;
    }

    // 2. Calculer le montant selon le type
    const invoiceTotal = Number(invoice.total);
    let creditAmount: number;

    if (parsed.type === "full") {
      creditAmount = invoiceTotal;
    } else {
      if (!parsed.amount) {
        return { success: false, error: "Montant requis pour un avoir partiel" } as const;
      }
      if (parsed.amount > invoiceTotal) {
        return { success: false, error: "Le montant ne peut pas dépasser le total de la facture" } as const;
      }
      creditAmount = parsed.amount;
    }

    // 3. Numérotation atomique : CN-YYYY-XXXX
    // On récupère le préfixe et le compteur depuis l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextCreditNumber: { increment: 1 } },
      select: {
        nextCreditNumber: true,
        creditNotePrefix: true,
      },
    });

    const year = new Date().getFullYear();
    const usedNumber = updatedUser.nextCreditNumber - 1;
    const prefix = updatedUser.creditNotePrefix ?? "CN";
    const creditNoteNumber = `${prefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

    // 4. Créer le document CREDIT_NOTE
    const doc = await prisma.document.create({
      data: {
        userId,
        clientId: invoice.clientId,
        type: "CREDIT_NOTE",
        number: creditNoteNumber,
        date: new Date(),
        status: "PAID", // Un avoir est toujours considéré comme validé
        subtotal: creditAmount,
        taxTotal: 0,
        total: creditAmount,
        notes: parsed.notes ?? null,
        // Stocker les métadonnées de référence à la facture
        businessMetadata: {
          invoiceId: parsed.invoiceId,
          invoiceNumber: invoice.number,
          type: parsed.type,
          reason: parsed.reason,
          amount: creditAmount,
        },
      },
      include: creditNoteInclude,
    });

    revalidatePath("/dashboard/avoirs");
    revalidatePath("/dashboard/invoices");

    return {
      success: true,
      data: mapToSavedCreditNote(doc as unknown as PrismaCreditNoteWithRelations),
    } as const;
  } catch (error) {
    console.error("[createCreditNote] Erreur:", error);
    return { success: false, error: "Erreur lors de la création de l'avoir" } as const;
  }
}

// ─── Action : liste des avoirs ───────────────────────────────────────────────

export async function getCreditNotes() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: [] } as const;
  }

  try {
    const documents = await prisma.document.findMany({
      where: { userId: session.user.id, type: "CREDIT_NOTE" },
      include: creditNoteInclude,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: documents.map((d) =>
        mapToSavedCreditNote(d as unknown as PrismaCreditNoteWithRelations),
      ),
    } as const;
  } catch (error) {
    console.error("[getCreditNotes] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des avoirs", data: [] } as const;
  }
}

// ─── Action : supprimer un avoir ─────────────────────────────────────────────

export async function deleteCreditNote(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    await prisma.document.deleteMany({
      where: { id, userId: session.user.id, type: "CREDIT_NOTE" },
    });

    revalidatePath("/dashboard/avoirs");
    return { success: true } as const;
  } catch (error) {
    console.error("[deleteCreditNote] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression de l'avoir" } as const;
  }
}
