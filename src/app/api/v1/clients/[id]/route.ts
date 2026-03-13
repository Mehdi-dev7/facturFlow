// src/app/api/v1/clients/[id]/route.ts
// GET /api/v1/clients/:id — Récupérer un client

import { prisma } from "@/lib/prisma";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { apiV1RateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { limited } = apiV1RateLimit(request);
  if (limited) return apiError("RATE_LIMITED", "Trop de requêtes, réessayez dans une minute", 429);

  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  const { id } = await params;

  try {
    const client = await prisma.client.findFirst({
      where: { id, userId: authResult.userId },
      include: {
        _count: { select: { documents: true } },
      },
    });

    if (!client) return apiError("NOT_FOUND", "Client introuvable", 404);

    return Response.json({
      data: {
        id: client.id,
        type: client.type,
        name: client.companyName ?? [client.firstName, client.lastName].filter(Boolean).join(" "),
        company_name: client.companyName,
        first_name: client.firstName,
        last_name: client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        postal_code: client.postalCode,
        city: client.city,
        country: client.country,
        siret: client.companySiret,
        siren: client.companySiren,
        vat_number: client.companyVatNumber,
        total_invoiced: client.totalInvoiced.toNumber(),
        total_paid: client.totalPaid.toNumber(),
        document_count: client._count.documents,
        created_at: client.createdAt.toISOString(),
        updated_at: client.updatedAt.toISOString(),
      },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur interne", 500);
  }
}
