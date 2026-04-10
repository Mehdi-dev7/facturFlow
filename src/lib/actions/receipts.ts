"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { receiptSchema } from "@/lib/types/receipts";
import { canCreateDocument } from "@/lib/feature-gate";
import type { SavedReceipt, ReceiptPaymentMethod } from "@/lib/types/receipts";

// ─── Prisma include + mapper ─────────────────────────────────────────────────

const receiptInclude = {
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
      companyLogo: true,
      currency: true,
    },
  },
} as const;

type PrismaReceiptWithRelations = {
  id: string;
  number: string;
  status: string;
  date: Date;
  total: { toNumber: () => number };
  notes: string | null;
  businessMetadata: unknown;
  clientId: string;
  createdAt: Date;
  client: SavedReceipt["client"];
  user: SavedReceipt["user"];
};

function mapToSavedReceipt(doc: PrismaReceiptWithRelations): SavedReceipt {
  const meta = doc.businessMetadata as Record<string, unknown> | null;
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    total: doc.total.toNumber(),
    description: (meta?.description as string) || "Paiement reçu",
    paymentMethod: (meta?.paymentMethod as ReceiptPaymentMethod) || "CASH",
    notes: doc.notes,
    client: doc.client,
    user: doc.user,
    createdAt: doc.createdAt.toISOString(),
  };
}

// ─── Résoudre le client (existant ou nouveau à créer) ───────────────────────

async function resolveClient(data: z.infer<typeof receiptSchema>, userId: string) {
  // Nouveau client à créer à la volée
  if (data.newClient) {
    const nc = data.newClient;
    const hasSiret = !!nc.siret?.trim();

    const email = nc.email?.trim() || null;
    const address = nc.address?.trim() || null;

    // Réutiliser le client s'il existe déjà (même email + userId, seulement si email fourni)
    if (email) {
      const existing = await prisma.client.findFirst({
        where: { email, userId },
      });
      if (existing) return existing;
    }

    return prisma.client.create({
      data: {
        userId,
        type: hasSiret ? "COMPANY" : "INDIVIDUAL",
        companyName: hasSiret ? nc.name : null,
        companySiret: hasSiret ? nc.siret! : null,
        companySiren: hasSiret ? nc.siret!.substring(0, 9) : null,
        firstName: hasSiret ? null : (nc.name.split(" ")[0] ?? nc.name),
        lastName: hasSiret ? null : (nc.name.split(" ").slice(1).join(" ") || null),
        email: email ?? `noreply-${Date.now()}@receipt.local`,
        address,
        postalCode: nc.zipCode ?? null,
        city: nc.city,
      },
    });
  }

  // Client existant
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId },
  });
  if (!client) throw new Error("Client introuvable");
  return client;
}

// ─── Action : créer un reçu manuel ──────────────────────────────────────────

export async function createReceipt(data: z.infer<typeof receiptSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }
  const userId = session.user.id;

  // Vérifier la limite de documents selon le plan (FREE = 10/mois)
  const { allowed, count: docCount, max: docMax } = await canCreateDocument(userId);
  if (!allowed) {
    return {
      success: false,
      error: `Limite de ${docMax} documents/mois atteinte (${docCount}/${docMax}). Passez au plan Pro pour continuer.`,
    } as const;
  }

  // Validation côté serveur
  try {
    receiptSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // Résoudre le client (existant ou création à la volée)
    let client;
    try {
      client = await resolveClient(data, userId);
    } catch {
      return { success: false, error: "Client introuvable" } as const;
    }

    // Numérotation atomique : REC-YYYY-XXXX
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextReceiptNumber: { increment: 1 } },
      select: { nextReceiptNumber: true },
    });

    const year = new Date().getFullYear();
    const usedNumber = updatedUser.nextReceiptNumber - 1;
    const receiptNumber = `REC-${year}-${String(usedNumber).padStart(4, "0")}`;

    // Créer le document RECEIPT (toujours PAID)
    const doc = await prisma.document.create({
      data: {
        userId,
        clientId: client.id,
        type: "RECEIPT",
        number: receiptNumber,
        date: data.date ? new Date(data.date) : new Date(),
        status: "PAID",
        subtotal: data.amount,
        taxTotal: 0,
        total: data.amount,
        notes: data.notes || null,
        businessMetadata: {
          description: data.description,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
        },
      },
      include: receiptInclude,
    });

    revalidatePath("/dashboard/receipts");

    return { success: true, data: mapToSavedReceipt(doc as unknown as PrismaReceiptWithRelations) } as const;
  } catch (error) {
    console.error("[createReceipt] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du reçu" } as const;
  }
}

// ─── Action : liste des reçus manuels ───────────────────────────────────────

export async function getReceipts() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: [] } as const;
  }

  try {
    const documents = await prisma.document.findMany({
      where: { userId: session.user.id, type: "RECEIPT" },
      include: receiptInclude,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: documents.map((d) => mapToSavedReceipt(d as unknown as PrismaReceiptWithRelations)),
    } as const;
  } catch (error) {
    console.error("[getReceipts] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des reçus", data: [] } as const;
  }
}

// ─── Action : prochain numéro de reçu (preview, sans incrémenter) ───────────

export async function getNextReceiptNumber() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: null } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nextReceiptNumber: true },
    });
    const year = new Date().getFullYear();
    const next = user?.nextReceiptNumber ?? 1;
    return { success: true, data: `REC-${year}-${String(next).padStart(4, "0")}` } as const;
  } catch {
    return { success: false, error: "Erreur", data: null } as const;
  }
}

// ─── Action : supprimer un reçu ─────────────────────────────────────────────

export async function deleteReceipt(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    await prisma.document.deleteMany({
      where: { id, userId: session.user.id, type: "RECEIPT" },
    });

    revalidatePath("/dashboard/receipts");
    return { success: true } as const;
  } catch (error) {
    console.error("[deleteReceipt] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression du reçu" } as const;
  }
}
