// src/app/api/v1/deposits/route.ts
// GET /api/v1/deposits — Liste paginée des acomptes
//
// Auth : Bearer fnk_xxx (plan BUSINESS uniquement)

import { prisma } from "@/lib/prisma";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { apiV1RateLimit } from "@/lib/rate-limit";

function formatDeposit(doc: {
  id: string;
  number: string;
  status: string;
  date: Date;
  dueDate: Date | null;
  total: { toNumber: () => number };
  subtotal: { toNumber: () => number };
  taxTotal: { toNumber: () => number };
  businessMetadata: unknown;
  createdAt: Date;
  client: { id: string; companyName: string | null; firstName: string | null; lastName: string | null; email: string };
}) {
  const meta = (doc.businessMetadata ?? {}) as Record<string, unknown>;
  return {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    date: doc.date.toISOString(),
    due_date: doc.dueDate?.toISOString() ?? null,
    description: (meta.description as string) ?? null,
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

export async function GET(request: Request) {
  const { limited } = apiV1RateLimit(request);
  if (limited) return apiError("RATE_LIMITED", "Trop de requêtes, réessayez dans une minute", 429);

  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);
  const status = searchParams.get("status") ?? undefined;

  try {
    const [deposits, total] = await Promise.all([
      prisma.document.findMany({
        where: {
          userId: authResult.userId,
          type: "DEPOSIT",
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
        where: { userId: authResult.userId, type: "DEPOSIT", ...(status ? { status: status as never } : {}) },
      }),
    ]);

    return Response.json({
      data: deposits.map(formatDeposit),
      meta: { total, limit, offset },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur interne", 500);
  }
}
