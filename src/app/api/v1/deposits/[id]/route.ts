// src/app/api/v1/deposits/[id]/route.ts
// GET /api/v1/deposits/:id — Récupérer un acompte

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
    const deposit = await prisma.document.findFirst({
      where: { id, userId: authResult.userId, type: "DEPOSIT" },
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
      },
    });

    if (!deposit) return apiError("NOT_FOUND", "Acompte introuvable", 404);

    const meta = (deposit.businessMetadata ?? {}) as Record<string, unknown>;

    return Response.json({
      data: {
        id: deposit.id,
        number: deposit.number,
        status: deposit.status,
        date: deposit.date.toISOString(),
        due_date: deposit.dueDate?.toISOString() ?? null,
        description: (meta.description as string) ?? null,
        notes: deposit.notes,
        subtotal: deposit.subtotal.toNumber(),
        tax_total: deposit.taxTotal.toNumber(),
        total: deposit.total.toNumber(),
        paid_at: deposit.paidAt?.toISOString() ?? null,
        related_document_id: deposit.relatedDocumentId ?? null,
        created_at: deposit.createdAt.toISOString(),
        updated_at: deposit.updatedAt.toISOString(),
        client: {
          id: deposit.client.id,
          name: deposit.client.companyName ?? [deposit.client.firstName, deposit.client.lastName].filter(Boolean).join(" "),
          email: deposit.client.email,
          phone: deposit.client.phone,
          address: deposit.client.address,
          postal_code: deposit.client.postalCode,
          city: deposit.client.city,
        },
      },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur interne", 500);
  }
}
