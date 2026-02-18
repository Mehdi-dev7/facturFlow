"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";
import type { InvoiceFormData, VatRate } from "@/lib/validations/invoice";

// ─── Type exporté (utilisé par les hooks et les modals) ──────────────────────

export interface SavedInvoice {
  id: string;
  number: string;
  status: string;
  date: string;
  dueDate: string | null;
  invoiceType: string | null;
  discountType: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  discount: number | null;
  depositAmount: number | null;
  notes: string | null;
  businessMetadata: Record<string, unknown> | null;
  // Facture électronique SuperPDP
  einvoiceRef: string | null;
  einvoiceStatus: string | null;
  einvoiceSentAt: string | null;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    subtotal: number;
    taxAmount: number;
    total: number;
    category: string | null;
    order: number;
  }[];
  client: {
    id: string;
    companyName: string | null;
    companySiret: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    city: string | null;
    address: string | null;
    postalCode: string | null;
  };
  user: {
    companyName: string | null;
    companySiret: string | null;
    companyAddress: string | null;
    companyPostalCode: string | null;
    companyCity: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
  };
}

// ─── Schéma de validation local ──────────────────────────────────────────────

const saveSchema = z
  .object({
    clientId: z.string().optional(),
    newClient: z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        address: z.string().min(5),
        zipCode: z.string().optional(),
        city: z.string().min(2),
        siret: z.string().optional(),
      })
      .optional(),
    date: z.string().min(1, "La date est requise"),
    dueDate: z.string().min(1, "La date d'échéance est requise"),
    lines: z
      .array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().min(0.01),
          unitPrice: z.number().min(0),
          category: z.enum(["main_oeuvre", "materiel"]).optional(),
        })
      )
      .min(1, "Au moins une ligne est requise"),
    vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
    invoiceType: z.string().optional(),
    discountType: z.enum(["pourcentage", "montant"]).optional(),
    discountValue: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    notes: z.string().optional(),
    paymentLinks: z
      .object({
        stripe: z.string().optional(),
        paypal: z.string().optional(),
        gocardless: z.string().optional(),
      })
      .optional(),
  })
  .refine((d) => d.clientId || d.newClient, {
    message: "Veuillez sélectionner ou créer un client",
    path: ["clientId"],
  });

// ─── Helper : calcul des lignes ───────────────────────────────────────────────

function calcLineItems(
  lines: InvoiceFormData["lines"],
  vatRate: number
) {
  return (lines ?? []).map((line, idx) => {
    const qty = line.quantity ?? 1;
    const up = line.unitPrice ?? 0;
    const subtotal = qty * up;
    const taxAmount = subtotal * (vatRate / 100);
    const total = subtotal + taxAmount;
    return {
      description: line.description,
      quantity: qty,
      unit: "unité",
      unitPrice: up,
      vatRate,
      subtotal,
      taxAmount,
      total,
      category: line.category ?? null,
      order: idx,
    };
  });
}

// ─── Helper : résoudre le client ─────────────────────────────────────────────

async function resolveClient(data: InvoiceFormData, userId: string) {
  if (data.newClient) {
    // Chercher un client existant par email + userId pour éviter les doublons
    const existing = await prisma.client.findFirst({
      where: { email: data.newClient.email, userId },
    });

    const hasSiret = !!data.newClient.siret?.trim();

    // Si un client avec cet email existe déjà : mettre à jour le SIRET si fourni, sinon retourner tel quel
    if (existing) {
      if (hasSiret && !existing.companySiret) {
        return prisma.client.update({
          where: { id: existing.id },
          data: {
            type: "COMPANY",
            companyName: data.newClient.name,
            companySiret: data.newClient.siret!,
            companySiren: data.newClient.siret!.substring(0, 9),
          },
        });
      }
      return existing;
    }

    // Créer un nouveau client : COMPANY si SIRET fourni, sinon INDIVIDUAL
    const client = await prisma.client.create({
      data: {
        userId,
        type: hasSiret ? "COMPANY" : "INDIVIDUAL",
        companyName: hasSiret ? data.newClient.name : null,
        companySiret: hasSiret ? data.newClient.siret! : null,
        companySiren: hasSiret ? data.newClient.siret!.substring(0, 9) : null,
        firstName: hasSiret ? null : (data.newClient.name.split(" ")[0] ?? data.newClient.name),
        lastName: hasSiret ? null : (data.newClient.name.split(" ").slice(1).join(" ") || null),
        email: data.newClient.email,
        address: data.newClient.address,
        postalCode: data.newClient.zipCode ?? null,
        city: data.newClient.city,
      },
    });
    return client;
  }

  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId },
    });
    return client ?? null;
  }

  return null;
}

// ─── Helper : mapper un Document Prisma vers SavedInvoice ────────────────────

type PrismaDocumentWithRelations = {
  id: string;
  number: string;
  status: string;
  date: Date;
  dueDate: Date | null;
  invoiceType: string | null;
  discountType: string | null;
  subtotal: { toNumber: () => number };
  taxTotal: { toNumber: () => number };
  total: { toNumber: () => number };
  discount: { toNumber: () => number } | null;
  depositAmount: { toNumber: () => number } | null;
  notes: string | null;
  businessMetadata: unknown;
  einvoiceRef: string | null;
  einvoiceStatus: string | null;
  einvoiceSentAt: Date | null;
  lineItems: {
    id: string;
    description: string;
    quantity: { toNumber: () => number };
    unitPrice: { toNumber: () => number };
    vatRate: { toNumber: () => number };
    subtotal: { toNumber: () => number };
    taxAmount: { toNumber: () => number };
    total: { toNumber: () => number };
    category: string | null;
    order: number;
  }[];
  client: {
    id: string;
    companyName: string | null;
    companySiret: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    city: string | null;
    address: string | null;
    postalCode: string | null;
  };
  user: {
    companyName: string | null;
    companySiret: string | null;
    companyAddress: string | null;
    companyPostalCode: string | null;
    companyCity: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
  };
};

function mapToSavedInvoice(doc: PrismaDocumentWithRelations): SavedInvoice {
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    invoiceType: doc.invoiceType,
    discountType: doc.discountType,
    subtotal: doc.subtotal.toNumber(),
    taxTotal: doc.taxTotal.toNumber(),
    total: doc.total.toNumber(),
    discount: doc.discount ? doc.discount.toNumber() : null,
    depositAmount: doc.depositAmount ? doc.depositAmount.toNumber() : null,
    notes: doc.notes,
    businessMetadata:
      doc.businessMetadata != null
        ? (doc.businessMetadata as Record<string, unknown>)
        : null,
    einvoiceRef: doc.einvoiceRef,
    einvoiceStatus: doc.einvoiceStatus,
    einvoiceSentAt: doc.einvoiceSentAt ? doc.einvoiceSentAt.toISOString() : null,
    lineItems: doc.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity.toNumber(),
      unitPrice: li.unitPrice.toNumber(),
      vatRate: li.vatRate.toNumber(),
      subtotal: li.subtotal.toNumber(),
      taxAmount: li.taxAmount.toNumber(),
      total: li.total.toNumber(),
      category: li.category,
      order: li.order,
    })),
    client: doc.client,
    user: doc.user,
  };
}

// ─── Sélect réutilisable pour include ────────────────────────────────────────

const documentInclude = {
  client: {
    select: {
      id: true,
      companyName: true,
      companySiret: true,
      firstName: true,
      lastName: true,
      email: true,
      city: true,
      address: true,
      postalCode: true,
    },
  },
  lineItems: {
    orderBy: { order: "asc" as const },
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

// ─── Action : prochain numéro de facture ─────────────────────────────────────

export async function getNextInvoiceNumber() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { invoicePrefix: true, nextInvoiceNumber: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" } as const;
    }

    const year = new Date().getFullYear();
    const padded = String(user.nextInvoiceNumber).padStart(4, "0");
    const number = `${user.invoicePrefix}-${year}-${padded}`;

    return { success: true, data: { number } } as const;
  } catch (error) {
    console.error("[getNextInvoiceNumber] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération du numéro" } as const;
  }
}

// ─── Action : sauvegarder un brouillon ───────────────────────────────────────

export async function saveDraft(data: InvoiceFormData, draftId?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  const userId = session.user.id;

  try {
    saveSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // Résoudre le client
    const client = await resolveClient(data, userId);
    if (!client) {
      return { success: false, error: "Client introuvable" } as const;
    }

    // Calculer les totaux
    const totals = calcInvoiceTotals({
      lines: data.lines,
      vatRate: data.vatRate as VatRate,
      discountType: data.discountType,
      discountValue: data.discountValue,
      depositAmount: data.depositAmount,
    });

    const computedLines = calcLineItems(data.lines, data.vatRate);

    const docData = {
      clientId: client.id,
      type: "INVOICE" as const,
      date: new Date(data.date),
      dueDate: new Date(data.dueDate),
      status: "DRAFT" as const,
      subtotal: totals.netHT,
      taxTotal: totals.taxTotal,
      total: totals.totalTTC,
      discount: data.discountValue ?? 0,
      depositAmount: data.depositAmount ?? 0,
      discountType: data.discountType ?? null,
      invoiceType: data.invoiceType ?? null,
      notes: data.notes ?? null,
      businessMetadata: {
        vatRate: data.vatRate,
        paymentLinks: data.paymentLinks ?? {},
      },
    };

    if (draftId) {
      // Mettre à jour le document existant + recréer les lignes
      await prisma.$transaction([
        prisma.document.update({
          where: { id: draftId },
          data: docData,
        }),
        prisma.documentLineItem.deleteMany({
          where: { documentId: draftId },
        }),
        prisma.documentLineItem.createMany({
          data: computedLines.map((line) => ({ ...line, documentId: draftId })),
        }),
      ]);

      return { success: true, data: { id: draftId } } as const;
    } else {
      // Créer un nouveau brouillon avec un numéro temporaire
      const draft = await prisma.document.create({
        data: {
          ...docData,
          userId,
          number: `BROUILLON-${Date.now()}`,
          lineItems: {
            create: computedLines,
          },
        },
        select: { id: true },
      });

      return { success: true, data: { id: draft.id } } as const;
    }
  } catch (error) {
    console.error("[saveDraft] Erreur:", error);
    return { success: false, error: "Erreur lors de la sauvegarde du brouillon" } as const;
  }
}

// ─── Action : créer une facture (avec numéro officiel) ───────────────────────

export async function createInvoice(data: InvoiceFormData, draftId?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  const userId = session.user.id;

  try {
    saveSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // Résoudre le client
    const client = await resolveClient(data, userId);
    if (!client) {
      return { success: false, error: "Client introuvable" } as const;
    }

    // Calculer les totaux
    const totals = calcInvoiceTotals({
      lines: data.lines,
      vatRate: data.vatRate as VatRate,
      discountType: data.discountType,
      discountValue: data.discountValue,
      depositAmount: data.depositAmount,
    });

    const computedLines = calcLineItems(data.lines, data.vatRate);

    // Incrémenter le compteur de factures et générer le numéro officiel
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextInvoiceNumber: { increment: 1 } },
      select: { nextInvoiceNumber: true, invoicePrefix: true },
    });

    const year = new Date().getFullYear();
    // nextInvoiceNumber a déjà été incrémenté, donc -1 pour avoir le numéro utilisé
    const usedNumber = updatedUser.nextInvoiceNumber - 1;
    const invoiceNumber = `${updatedUser.invoicePrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

    const docData = {
      userId,
      clientId: client.id,
      type: "INVOICE" as const,
      number: invoiceNumber,
      date: new Date(data.date),
      dueDate: new Date(data.dueDate),
      status: "DRAFT" as const,
      subtotal: totals.netHT,
      taxTotal: totals.taxTotal,
      total: totals.totalTTC,
      discount: data.discountValue ?? 0,
      depositAmount: data.depositAmount ?? 0,
      discountType: data.discountType ?? null,
      invoiceType: data.invoiceType ?? null,
      notes: data.notes ?? null,
      businessMetadata: {
        vatRate: data.vatRate,
        paymentLinks: data.paymentLinks ?? {},
      },
    };

    let documentId: string;

    if (draftId) {
      // Mettre à jour le brouillon existant avec le numéro officiel
      await prisma.document.update({
        where: { id: draftId },
        data: docData,
      });
      await prisma.documentLineItem.deleteMany({ where: { documentId: draftId } });
      await prisma.documentLineItem.createMany({
        data: computedLines.map((line) => ({ ...line, documentId: draftId })),
      });
      documentId = draftId;
    } else {
      // Créer un nouveau document
      const doc = await prisma.document.create({
        data: {
          ...docData,
          lineItems: { create: computedLines },
        },
        select: { id: true },
      });
      documentId = doc.id;
    }

    revalidatePath("/dashboard/invoices");

    return { success: true, data: { id: documentId, number: invoiceNumber } } as const;
  } catch (error) {
    console.error("[createInvoice] Erreur:", error);
    return { success: false, error: "Erreur lors de la création de la facture" } as const;
  }
}

// ─── Action : mettre à jour une facture ──────────────────────────────────────

export async function updateInvoice(id: string, data: InvoiceFormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  const userId = session.user.id;

  try {
    // Vérifier que la facture existe et appartient à l'utilisateur
    const existing = await prisma.document.findFirst({
      where: { id, userId, type: "INVOICE" },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Facture introuvable" } as const;
    }

    // Résoudre le client
    const client = await resolveClient(data, userId);
    if (!client) {
      return { success: false, error: "Client introuvable" } as const;
    }

    // Calculer les totaux
    const totals = calcInvoiceTotals({
      lines: data.lines,
      vatRate: data.vatRate as VatRate,
      discountType: data.discountType,
      discountValue: data.discountValue,
      depositAmount: data.depositAmount,
    });

    const computedLines = calcLineItems(data.lines, data.vatRate);

    // Mise à jour dans une transaction : update doc + delete+recreate lignes
    await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: {
          clientId: client.id,
          date: new Date(data.date),
          dueDate: new Date(data.dueDate),
          subtotal: totals.netHT,
          taxTotal: totals.taxTotal,
          total: totals.totalTTC,
          discount: data.discountValue ?? 0,
          depositAmount: data.depositAmount ?? 0,
          discountType: data.discountType ?? null,
          invoiceType: data.invoiceType ?? null,
          notes: data.notes ?? null,
          businessMetadata: {
            vatRate: data.vatRate,
            paymentLinks: data.paymentLinks ?? {},
          },
        },
      }),
      prisma.documentLineItem.deleteMany({ where: { documentId: id } }),
      prisma.documentLineItem.createMany({
        data: computedLines.map((line) => ({ ...line, documentId: id })),
      }),
    ]);

    revalidatePath("/dashboard/invoices");

    return { success: true, data: { id } } as const;
  } catch (error) {
    console.error("[updateInvoice] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la facture" } as const;
  }
}

// ─── Action : supprimer une facture ──────────────────────────────────────────

export async function deleteInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    // deleteMany pour éviter une erreur si la facture n'existe pas
    await prisma.document.deleteMany({
      where: { id, userId: session.user.id, type: "INVOICE" },
    });

    revalidatePath("/dashboard/invoices");

    return { success: true } as const;
  } catch (error) {
    console.error("[deleteInvoice] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression de la facture" } as const;
  }
}

// ─── Action : dupliquer une facture ──────────────────────────────────────────

export async function duplicateInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  const userId = session.user.id;

  try {
    // Récupérer la facture originale avec ses lignes
    const original = await prisma.document.findFirst({
      where: { id, userId, type: "INVOICE" },
      include: { lineItems: { orderBy: { order: "asc" } } },
    });

    if (!original) {
      return { success: false, error: "Facture introuvable" } as const;
    }

    // Incrémenter le compteur et générer un numéro officiel pour le duplicata
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nextInvoiceNumber: { increment: 1 } },
      select: { nextInvoiceNumber: true, invoicePrefix: true },
    });

    const year = new Date().getFullYear();
    const usedNumber = updatedUser.nextInvoiceNumber - 1;
    const newNumber = `${updatedUser.invoicePrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

    // Créer le duplicata en DRAFT
    const newDoc = await prisma.document.create({
      data: {
        userId,
        clientId: original.clientId,
        type: "INVOICE",
        number: newNumber,
        date: new Date(),
        dueDate: original.dueDate,
        status: "DRAFT",
        subtotal: original.subtotal,
        taxTotal: original.taxTotal,
        total: original.total,
        discount: original.discount,
        depositAmount: original.depositAmount,
        discountType: original.discountType,
        invoiceType: original.invoiceType,
        notes: original.notes,
        businessMetadata: original.businessMetadata ?? undefined,
        lineItems: {
          create: original.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            vatRate: li.vatRate,
            subtotal: li.subtotal,
            taxAmount: li.taxAmount,
            total: li.total,
            category: li.category,
            order: li.order,
          })),
        },
      },
      select: { id: true, number: true },
    });

    revalidatePath("/dashboard/invoices");

    return { success: true, data: { id: newDoc.id, number: newDoc.number } } as const;
  } catch (error) {
    console.error("[duplicateInvoice] Erreur:", error);
    return { success: false, error: "Erreur lors de la duplication de la facture" } as const;
  }
}

// ─── Action : récupérer la liste des factures ────────────────────────────────

export async function getInvoices(filters?: { month?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: [] } as const;
  }

  try {
    // Construire le filtre de date si un mois est fourni (format "YYYY-MM")
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
        type: "INVOICE",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: documentInclude,
      orderBy: { createdAt: "desc" },
    });

    const invoices = documents.map((doc) =>
      mapToSavedInvoice(doc as unknown as PrismaDocumentWithRelations)
    );

    return { success: true, data: invoices } as const;
  } catch (error) {
    console.error("[getInvoices] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des factures", data: [] } as const;
  }
}

// ─── Action : changer le statut d'une facture ────────────────────────────────

// Transitions autorisées (statut actuel → statuts possibles)
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT:    ["SENT", "PAID"],
  SENT:     ["PAID", "OVERDUE"],
  OVERDUE:  ["PAID", "REMINDED"],
  REMINDED: ["PAID"],
  PAID:     ["SENT", "OVERDUE"], // Retour arrière en cas d'erreur
};

export async function updateInvoiceStatus(id: string, newStatus: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    // Récupérer la facture (vérification ownership incluse)
    const doc = await prisma.document.findFirst({
      where: { id, userId: session.user.id, type: "INVOICE" },
      select: { status: true },
    });

    if (!doc) {
      return { success: false, error: "Facture introuvable" } as const;
    }

    // Vérifier que la transition est autorisée
    const allowed = ALLOWED_TRANSITIONS[doc.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Transition non autorisée : ${doc.status} → ${newStatus}`,
      } as const;
    }

    await prisma.document.update({
      where: { id },
      data: { status: newStatus as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "REMINDED" },
    });

    revalidatePath("/dashboard/invoices");

    return { success: true } as const;
  } catch (error) {
    console.error("[updateInvoiceStatus] Erreur:", error);
    return { success: false, error: "Erreur lors du changement de statut" } as const;
  }
}

// ─── Action : récupérer une facture par ID ───────────────────────────────────

export async function getInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: null } as const;
  }

  try {
    const doc = await prisma.document.findFirst({
      where: { id, userId: session.user.id, type: "INVOICE" },
      include: documentInclude,
    });

    if (!doc) {
      return { success: false, error: "Facture introuvable", data: null } as const;
    }

    const invoice = mapToSavedInvoice(doc as unknown as PrismaDocumentWithRelations);

    return { success: true, data: invoice } as const;
  } catch (error) {
    console.error("[getInvoice] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération de la facture", data: null } as const;
  }
}
