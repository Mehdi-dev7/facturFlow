// src/app/api/v1/invoices/route.ts
// GET  /api/v1/invoices — Liste paginée des factures
// POST /api/v1/invoices — Créer une facture
//
// Auth : Bearer fnk_xxx (plan BUSINESS uniquement)

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";

// ─── Schéma de création ────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  vat_rate: z.number().min(0).max(100).default(20),
  unit: z.string().default("unité"),
});

const createInvoiceSchema = z.object({
  client_id: z.string().min(1, "client_id est requis"),
  date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, "Au moins une ligne est requise"),
});

// ─── Helpers format de réponse ────────────────────────────────────────────────

function formatInvoice(doc: {
  id: string;
  number: string;
  status: string;
  date: Date;
  dueDate: Date | null;
  total: { toNumber: () => number };
  subtotal: { toNumber: () => number };
  taxTotal: { toNumber: () => number };
  createdAt: Date;
  client: { id: string; companyName: string | null; firstName: string | null; lastName: string | null; email: string };
}) {
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    due_date: doc.dueDate?.toISOString() ?? null,
    subtotal: doc.subtotal.toNumber(),
    tax_total: doc.taxTotal.toNumber(),
    total: doc.total.toNumber(),
    created_at: doc.createdAt.toISOString(),
    client: {
      id: doc.client.id,
      name: doc.client.companyName ?? [doc.client.firstName, doc.client.lastName].filter(Boolean).join(" "),
      email: doc.client.email,
    },
  };
}

// ─── GET /api/v1/invoices ────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);
  const status = searchParams.get("status") ?? undefined;

  try {
    const [invoices, total] = await Promise.all([
      prisma.document.findMany({
        where: {
          userId: authResult.userId,
          type: "INVOICE",
          ...(status ? { status: status as never } : {}),
        },
        include: {
          client: {
            select: { id: true, companyName: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.document.count({
        where: { userId: authResult.userId, type: "INVOICE", ...(status ? { status: status as never } : {}) },
      }),
    ]);

    return Response.json({
      data: invoices.map(formatInvoice),
      meta: { total, limit, offset },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur interne", 500);
  }
}

// ─── POST /api/v1/invoices ────────────────────────────────────────────────────

export async function POST(request: Request) {
  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body JSON invalide", 400);
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Données invalides", 422);
  }

  const { client_id, date, due_date, notes, line_items } = parsed.data;

  try {
    // Vérifier ownership du client
    const client = await prisma.client.findFirst({
      where: { id: client_id, userId: authResult.userId },
    });
    if (!client) return apiError("NOT_FOUND", "Client introuvable", 404);

    // Récupérer l'user pour le numérotage
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { nextInvoiceNumber: true, invoicePrefix: true },
    });
    if (!user) return apiError("NOT_FOUND", "Utilisateur introuvable", 404);

    // Calculer les totaux
    const lines = line_items.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unit_price,
      vatRate: li.vat_rate,
      unit: li.unit,
    }));

    const totals = calcInvoiceTotals({
      lines,
      vatRate: 20,
      discountType: "montant",
      discountValue: 0,
    });

    // Créer la facture + incrémenter le compteur (transaction atomique)
    const year = new Date().getFullYear();
    const docNumber = `${user.invoicePrefix}-${year}-${String(user.nextInvoiceNumber).padStart(4, "0")}`;

    const [invoice] = await prisma.$transaction([
      prisma.document.create({
        data: {
          userId: authResult.userId,
          type: "INVOICE",
          number: docNumber,
          clientId: client_id,
          status: "DRAFT",
          date: date ? new Date(date) : new Date(),
          dueDate: due_date ? new Date(due_date) : null,
          notes: notes ?? null,
          subtotal: totals.netHT,
          taxTotal: totals.taxTotal,
          total: totals.totalTTC,
          lineItems: {
            create: lines.map((li, idx) => {
              const sub = li.quantity * li.unitPrice;
              const tax = sub * (li.vatRate / 100);
              return {
                description: li.description,
                quantity: li.quantity,
                unit: li.unit,
                unitPrice: li.unitPrice,
                vatRate: li.vatRate,
                subtotal: sub,
                taxAmount: tax,
                total: sub + tax,
                order: idx,
              };
            }),
          },
        },
        include: {
          client: {
            select: { id: true, companyName: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.user.update({
        where: { id: authResult.userId },
        data: { nextInvoiceNumber: { increment: 1 } },
      }),
    ]);

    return Response.json({ data: formatInvoice(invoice) }, { status: 201 });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur lors de la création", 500);
  }
}
