"use server";

// Server actions pour les bons de livraison (DELIVERY_NOTE)
// Pattern identique à credit-notes.ts

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { SavedDeliveryNote, DeliveryNoteLine } from "@/lib/types/delivery-notes";

// ─── Schema Zod de création ──────────────────────────────────────────────────

const createDeliveryNoteSchema = z.object({
  invoiceId: z.string().min(1, "Facture requise"),
  notes: z.string().optional(),
  deliveryDate: z.string().min(1, "Date de livraison requise"),
});

export type CreateDeliveryNoteInput = z.infer<typeof createDeliveryNoteSchema>;

// ─── Prisma include partagé ──────────────────────────────────────────────────

const deliveryNoteInclude = {
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
      companyLogo: true,
    },
  },
} as const;

// ─── Type Prisma interne ─────────────────────────────────────────────────────

type PrismaDeliveryNoteWithRelations = {
  id: string;
  number: string;
  status: string;
  date: Date;
  total: { toNumber: () => number };
  notes: string | null;
  businessMetadata: unknown;
  clientId: string;
  createdAt: Date;
  client: SavedDeliveryNote["client"];
  user: SavedDeliveryNote["user"];
};

// ─── Mapper Prisma → SavedDeliveryNote ───────────────────────────────────────

function mapToSavedDeliveryNote(doc: PrismaDeliveryNoteWithRelations): SavedDeliveryNote {
  const meta = doc.businessMetadata as Record<string, unknown> | null;
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    deliveryDate: (meta?.deliveryDate as string) ?? doc.date.toISOString(),
    total: doc.total.toNumber(),
    invoiceId: (meta?.invoiceId as string) ?? "",
    invoiceNumber: (meta?.invoiceNumber as string) ?? "",
    notes: doc.notes,
    lines: (meta?.lines as DeliveryNoteLine[]) ?? [],
    client: doc.client,
    user: doc.user,
    createdAt: doc.createdAt.toISOString(),
  };
}

// ─── Action : créer un bon de livraison ─────────────────────────────────────

export async function createDeliveryNote(data: CreateDeliveryNoteInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }
  const userId = session.user.id;

  // Validation côté serveur
  let parsed: CreateDeliveryNoteInput;
  try {
    parsed = createDeliveryNoteSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // 1. Récupérer la facture avec ses lignes pour construire les lignes du BL
    const invoice = await prisma.document.findFirst({
      where: { id: parsed.invoiceId, userId, type: "INVOICE" },
      select: {
        id: true,
        number: true,
        total: true,
        clientId: true,
        lineItems: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unit: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!invoice) {
      return { success: false, error: "Facture introuvable ou non autorisée" } as const;
    }

    // 2. Transformer les lignes de la facture en lignes de BL
    const deliveryLines: DeliveryNoteLine[] = invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      delivered: true,
    }));

    // 3. Numérotation atomique : BL-YYYY-XXXX
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextDeliveryNumber: { increment: 1 } },
      select: {
        nextDeliveryNumber: true,
        deliveryNotePrefix: true,
      },
    });

    const year = new Date().getFullYear();
    const usedNumber = (updatedUser.nextDeliveryNumber ?? 2) - 1;
    const prefix = updatedUser.deliveryNotePrefix ?? "BL";
    const deliveryNoteNumber = `${prefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

    // 4. Créer le document DELIVERY_NOTE
    const doc = await prisma.document.create({
      data: {
        userId,
        clientId: invoice.clientId,
        type: "DELIVERY_NOTE",
        number: deliveryNoteNumber,
        date: new Date(),
        status: "SENT", // Un BL est considéré comme émis directement
        // Pas de TVA sur un bon de livraison — on stocke le total de la facture à titre indicatif
        subtotal: Number(invoice.total),
        taxTotal: 0,
        total: Number(invoice.total),
        notes: parsed.notes ?? null,
        // Stocker les métadonnées : référence facture + date livraison + lignes
        // Cast explicite nécessaire car Prisma attend InputJsonValue pour les champs Json
        businessMetadata: JSON.parse(
          JSON.stringify({
            invoiceId: parsed.invoiceId,
            invoiceNumber: invoice.number,
            deliveryDate: parsed.deliveryDate,
            lines: deliveryLines,
          }),
        ),
      },
      include: deliveryNoteInclude,
    });

    revalidatePath("/dashboard/livraisons");

    return {
      success: true,
      data: mapToSavedDeliveryNote(doc as unknown as PrismaDeliveryNoteWithRelations),
    } as const;
  } catch (error) {
    console.error("[createDeliveryNote] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du bon de livraison" } as const;
  }
}

// ─── Action : liste des bons de livraison ────────────────────────────────────

export async function getDeliveryNotes() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: [] } as const;
  }

  try {
    const documents = await prisma.document.findMany({
      where: { userId: session.user.id, type: "DELIVERY_NOTE" },
      include: deliveryNoteInclude,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: documents.map((d) =>
        mapToSavedDeliveryNote(d as unknown as PrismaDeliveryNoteWithRelations),
      ),
    } as const;
  } catch (error) {
    console.error("[getDeliveryNotes] Erreur:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des bons de livraison",
      data: [],
    } as const;
  }
}

// ─── Action : supprimer un bon de livraison ──────────────────────────────────

export async function deleteDeliveryNote(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    await prisma.document.deleteMany({
      where: { id, userId: session.user.id, type: "DELIVERY_NOTE" },
    });

    revalidatePath("/dashboard/livraisons");
    return { success: true } as const;
  } catch (error) {
    console.error("[deleteDeliveryNote] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression du bon de livraison" } as const;
  }
}
