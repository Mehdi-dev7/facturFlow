// src/app/api/v1/clients/route.ts
// GET  /api/v1/clients — Liste paginée des clients
// POST /api/v1/clients — Créer un client

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { apiV1RateLimit } from "@/lib/rate-limit";

// ─── Schéma création ──────────────────────────────────────────────────────────

const createClientSchema = z.object({
  type: z.enum(["COMPANY", "INDIVIDUAL"]).default("COMPANY"),
  company_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("France"),
  siret: z.string().optional(),
  vat_number: z.string().optional(),
});

// ─── Helper format ────────────────────────────────────────────────────────────

function formatClient(c: {
  id: string;
  type: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  companySiret: string | null;
  companyVatNumber: string | null;
  totalInvoiced: { toNumber: () => number };
  totalPaid: { toNumber: () => number };
  createdAt: Date;
}) {
  return {
    id: c.id,
    type: c.type,
    name: c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" "),
    email: c.email,
    phone: c.phone,
    address: c.address,
    postal_code: c.postalCode,
    city: c.city,
    country: c.country,
    siret: c.companySiret,
    vat_number: c.companyVatNumber,
    total_invoiced: c.totalInvoiced.toNumber(),
    total_paid: c.totalPaid.toNumber(),
    created_at: c.createdAt.toISOString(),
  };
}

// ─── GET /api/v1/clients ──────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { limited } = apiV1RateLimit(request);
  if (limited) return apiError("RATE_LIMITED", "Trop de requêtes, réessayez dans une minute", 429);

  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);
  const search = searchParams.get("search") ?? undefined;

  const searchFilter = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  try {
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId: authResult.userId, ...searchFilter },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.client.count({ where: { userId: authResult.userId, ...searchFilter } }),
    ]);

    return Response.json({
      data: clients.map(formatClient),
      meta: { total, limit, offset },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur interne", 500);
  }
}

// ─── POST /api/v1/clients ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { limited } = apiV1RateLimit(request);
  if (limited) return apiError("RATE_LIMITED", "Trop de requêtes, réessayez dans une minute", 429);

  const authResult = await authenticateApiRequest(request);
  if (!authResult) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body JSON invalide", 400);
  }

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Données invalides", 422);
  }

  const d = parsed.data;

  try {
    // Vérifier unicité email pour cet user
    const existing = await prisma.client.findFirst({
      where: { email: d.email, userId: authResult.userId },
    });
    if (existing) return apiError("VALIDATION_ERROR", "Un client avec cet email existe déjà", 409);

    const client = await prisma.client.create({
      data: {
        userId: authResult.userId,
        type: d.type,
        companyName: d.company_name ?? null,
        firstName: d.first_name ?? null,
        lastName: d.last_name ?? null,
        email: d.email,
        phone: d.phone ?? null,
        address: d.address ?? null,
        postalCode: d.postal_code ?? null,
        city: d.city ?? null,
        country: d.country,
        companySiret: d.siret ?? null,
        companyVatNumber: d.vat_number ?? null,
      },
    });

    return Response.json({ data: formatClient(client) }, { status: 201 });
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur lors de la création", 500);
  }
}
