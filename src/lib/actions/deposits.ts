"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Imports des types ──────────────────────────────────────────────────────

import type { SavedDeposit } from "@/lib/types/deposits";

// ─── Schema Zod (interne) ───────────────────────────────────────────────────

const depositSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  amount: z.number().min(0.01, "Montant requis"),
  vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  relatedQuoteId: z.string().optional(),
  notes: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

// ─── Prisma include & mapper ────────────────────────────────────────────────

const depositInclude = {
  client: {
    select: {
      id: true,
      companyName: true,
      firstName: true,
      lastName: true,
      email: true,
      city: true,
    },
  },
  user: {
    select: {
      companyName: true,
      companySiret: true,
      companyAddress: true,
      companyPostalCode: true,
      companyCity: true,
      companyEmail: true,
      companyPhone: true,
    },
  },
} as const;

type PrismaDepositWithRelations = {
  id: string;
  number: string;
  status: string;
  date: Date;
  dueDate: Date | null;
  subtotal: { toNumber: () => number };
  taxTotal: { toNumber: () => number };
  total: { toNumber: () => number };
  notes: string | null;
  relatedDocumentId: string | null;
  businessMetadata: unknown;
  client: SavedDeposit["client"];
  user: SavedDeposit["user"];
};

function mapToSavedDeposit(doc: PrismaDepositWithRelations): SavedDeposit {
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    subtotal: doc.subtotal.toNumber(),
    taxTotal: doc.taxTotal.toNumber(),
    total: doc.total.toNumber(),
    notes: doc.notes,
    relatedDocumentId: doc.relatedDocumentId,
    businessMetadata:
      doc.businessMetadata != null
        ? (doc.businessMetadata as Record<string, unknown>)
        : null,
    client: doc.client,
    user: doc.user,
  };
}

// ─── Action : créer un acompte ──────────────────────────────────────────────

export async function createDeposit(data: DepositFormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  const userId = session.user.id;

  // Validation côté serveur
  try {
    depositSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // Vérifier que le client existe et appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId },
    });
    if (!client) {
      return { success: false, error: "Client introuvable" } as const;
    }

    // Calcul des totaux (simple, pas de lignes)
    const subtotal = data.amount;
    const taxTotal = subtotal * (data.vatRate / 100);
    const total = subtotal + taxTotal;

    // Numérotation atomique : DEP-YYYY-XXXX
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextDepositNumber: { increment: 1 } },
      select: { nextDepositNumber: true },
    });

    const year = new Date().getFullYear();
    const usedNumber = updatedUser.nextDepositNumber - 1;
    const depositNumber = `DEP-${year}-${String(usedNumber).padStart(4, "0")}`;

    // Créer le document DEPOSIT
    const doc = await prisma.document.create({
      data: {
        userId,
        clientId: data.clientId,
        type: "DEPOSIT",
        number: depositNumber,
        date: new Date(),
        dueDate: new Date(data.dueDate),
        status: "DRAFT",
        subtotal,
        taxTotal,
        total,
        relatedDocumentId: data.relatedQuoteId ?? null,
        notes: data.notes ?? null,
        businessMetadata: {
          vatRate: data.vatRate,
          amount: data.amount,
        },
      },
      include: depositInclude,
    });

    revalidatePath("/dashboard/acomptes");

    const saved = mapToSavedDeposit(doc as unknown as PrismaDepositWithRelations);
    return { success: true, data: saved } as const;
  } catch (error) {
    console.error("[createDeposit] Erreur:", error);
    return { success: false, error: "Erreur lors de la création de l'acompte" } as const;
  }
}

// ─── Fonction interne : créer un acompte depuis un devis accepté ────────────
// Appelée depuis quotes.ts — pas de vérification session (l'appelant l'a déjà faite)

export async function createDepositFromQuote(quoteId: string, userId: string) {
  try {
    // Récupérer le devis avec son client
    const quote = await prisma.document.findFirst({
      where: { id: quoteId, type: "QUOTE", userId },
      select: {
        id: true,
        clientId: true,
        depositAmount: true,
        businessMetadata: true,
        dueDate: true,
      },
    });

    if (!quote) {
      return { success: false, error: "Devis introuvable" } as const;
    }

    const depositAmount = quote.depositAmount ? Number(quote.depositAmount) : 0;
    if (depositAmount <= 0) {
      return { success: false, error: "Pas d'acompte défini sur ce devis" } as const;
    }

    // Vérifier qu'il n'y a pas déjà un acompte pour ce devis
    const existing = await prisma.document.findFirst({
      where: { relatedDocumentId: quoteId, type: "DEPOSIT" },
    });
    if (existing) {
      return { success: false, error: "Un acompte existe déjà pour ce devis" } as const;
    }

    // Récupérer le taux de TVA depuis businessMetadata du devis
    const metadata = quote.businessMetadata as Record<string, unknown> | null;
    const vatRate = (metadata?.vatRate as number) ?? 20;

    // Calcul des totaux
    const subtotal = depositAmount;
    const taxTotal = subtotal * (vatRate / 100);
    const total = subtotal + taxTotal;

    // Numérotation atomique
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextDepositNumber: { increment: 1 } },
      select: { nextDepositNumber: true },
    });

    const year = new Date().getFullYear();
    const usedNumber = updatedUser.nextDepositNumber - 1;
    const depositNumber = `DEP-${year}-${String(usedNumber).padStart(4, "0")}`;

    // Créer le document DEPOSIT en SENT (puisque le devis vient d'être accepté)
    const doc = await prisma.document.create({
      data: {
        userId,
        clientId: quote.clientId,
        type: "DEPOSIT",
        number: depositNumber,
        date: new Date(),
        dueDate: quote.dueDate,
        status: "SENT",
        subtotal,
        taxTotal,
        total,
        relatedDocumentId: quoteId,
        notes: `Acompte automatique suite à l'acceptation du devis`,
        businessMetadata: {
          vatRate,
          amount: depositAmount,
          autoGenerated: true,
        },
      },
      include: depositInclude,
    });

    revalidatePath("/dashboard/acomptes");

    const saved = mapToSavedDeposit(doc as unknown as PrismaDepositWithRelations);
    return { success: true, data: saved } as const;
  } catch (error) {
    console.error("[createDepositFromQuote] Erreur:", error);
    return { success: false, error: "Erreur lors de la création de l'acompte" } as const;
  }
}

// ─── Action : récupérer la liste des acomptes ──────────────────────────────

export async function getDeposits(filters?: { month?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: [] } as const;
  }

  try {
    // Filtre de date optionnel (format "YYYY-MM")
    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (filters?.month) {
      const [year, month] = filters.month.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        type: "DEPOSIT",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: depositInclude,
      orderBy: { createdAt: "desc" },
    });

    const deposits = documents.map((doc) =>
      mapToSavedDeposit(doc as unknown as PrismaDepositWithRelations),
    );

    return { success: true, data: deposits } as const;
  } catch (error) {
    console.error("[getDeposits] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des acomptes", data: [] } as const;
  }
}

// ─── Action : récupérer un acompte par ID ───────────────────────────────────

export async function getDeposit(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: null } as const;
  }

  try {
    const doc = await prisma.document.findFirst({
      where: { id, userId: session.user.id, type: "DEPOSIT" },
      include: depositInclude,
    });

    if (!doc) {
      return { success: false, error: "Acompte introuvable", data: null } as const;
    }

    const deposit = mapToSavedDeposit(doc as unknown as PrismaDepositWithRelations);

    return { success: true, data: deposit } as const;
  } catch (error) {
    console.error("[getDeposit] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération de l'acompte", data: null } as const;
  }
}

// ─── Action : changer le statut d'un acompte ────────────────────────────────

const DEPOSIT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["PAID", "OVERDUE"],
  OVERDUE: ["PAID", "SENT"],
  PAID: ["SENT"],
};

export async function updateDepositStatus(id: string, newStatus: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    const doc = await prisma.document.findFirst({
      where: { id, userId: session.user.id, type: "DEPOSIT" },
      select: { status: true },
    });

    if (!doc) {
      return { success: false, error: "Acompte introuvable" } as const;
    }

    // Vérifier que la transition est autorisée
    const allowed = DEPOSIT_TRANSITIONS[doc.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Transition non autorisée : ${doc.status} → ${newStatus}`,
      } as const;
    }

    await prisma.document.update({
      where: { id },
      data: { status: newStatus as "DRAFT" | "SENT" | "PAID" | "OVERDUE" },
    });

    revalidatePath("/dashboard/acomptes");

    return { success: true } as const;
  } catch (error) {
    console.error("[updateDepositStatus] Erreur:", error);
    return { success: false, error: "Erreur lors du changement de statut" } as const;
  }
}

// ─── Action : supprimer un acompte ──────────────────────────────────────────

export async function deleteDeposit(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    await prisma.document.deleteMany({
      where: { id, userId: session.user.id, type: "DEPOSIT" },
    });

    revalidatePath("/dashboard/acomptes");

    return { success: true } as const;
  } catch (error) {
    console.error("[deleteDeposit] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression de l'acompte" } as const;
  }
}
