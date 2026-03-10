// src/app/api/v1/invoices/[id]/route.ts
// GET /api/v1/invoices/:id — Récupérer une facture avec ses lignes

import { prisma } from "@/lib/prisma";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  const { id } = await params;

  try {
    const invoice = await prisma.document.findFirst({
      where: { id, userId: authResult.userId, type: "INVOICE" },
      include: {
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
        lineItems: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            vatRate: true,
            subtotal: true,
            taxAmount: true,
            total: true,
          },
        },
      },
    });

    if (!invoice) return apiError("NOT_FOUND", "Facture introuvable", 404);

    return Response.json({
      data: {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        date: invoice.date.toISOString(),
        due_date: invoice.dueDate?.toISOString() ?? null,
        notes: invoice.notes,
        subtotal: invoice.subtotal.toNumber(),
        tax_total: invoice.taxTotal.toNumber(),
        total: invoice.total.toNumber(),
        paid_amount: invoice.paidAmount.toNumber(),
        paid_at: invoice.paidAt?.toISOString() ?? null,
        created_at: invoice.createdAt.toISOString(),
        updated_at: invoice.updatedAt.toISOString(),
        client: {
          id: invoice.client.id,
          name: invoice.client.companyName ?? [invoice.client.firstName, invoice.client.lastName].filter(Boolean).join(" "),
          email: invoice.client.email,
          phone: invoice.client.phone,
          address: invoice.client.address,
          postal_code: invoice.client.postalCode,
          city: invoice.client.city,
        },
        line_items: invoice.lineItems.map((li) => ({
          id: li.id,
          description: li.description,
          quantity: li.quantity.toNumber(),
          unit: li.unit,
          unit_price: li.unitPrice.toNumber(),
          vat_rate: li.vatRate.toNumber(),
          subtotal: li.subtotal.toNumber(),
          tax_amount: li.taxAmount.toNumber(),
          total: li.total.toNumber(),
        })),
      },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur interne", 500);
  }
}
