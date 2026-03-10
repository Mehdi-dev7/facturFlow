"use server";

// src/lib/actions/webhook-endpoints.ts
// Server Actions pour la gestion des endpoints webhooks (plan BUSINESS uniquement).

import { randomBytes } from "crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/feature-gate";
import { WEBHOOK_EVENTS } from "@/lib/webhook-dispatcher";

// ─── Schéma de validation ────────────────────────────────────────────────────

const createEndpointSchema = z.object({
  url: z.string().url("URL invalide"),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "Sélectionnez au moins un événement"),
});

// ─── Types exportés ───────────────────────────────────────────────────────────

export interface SavedDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  createdAt: string;
}

export interface SavedWebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
  recentDeliveries: SavedDelivery[];
}

// ─── Helper : vérifier session + plan BUSINESS ───────────────────────────────

async function getBusinessSession(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, trialEndsAt: true, email: true, grantedPlan: true },
  });
  if (!user) return null;

  const effectivePlan = getEffectivePlan(user);
  if (effectivePlan !== "BUSINESS") return null;

  return session.user.id;
}

// ─── Action : lister les endpoints ───────────────────────────────────────────

export async function listWebhookEndpoints(): Promise<{
  success: boolean;
  data: SavedWebhookEndpoint[];
  error?: string;
}> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, data: [], error: "Accès réservé au plan Business" };
  }

  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            event: true,
            statusCode: true,
            success: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      success: true,
      data: endpoints.map((ep) => ({
        id: ep.id,
        url: ep.url,
        secret: ep.secret,
        events: ep.events,
        active: ep.active,
        createdAt: ep.createdAt.toISOString(),
        recentDeliveries: ep.deliveries.map((d) => ({
          id: d.id,
          event: d.event,
          statusCode: d.statusCode,
          success: d.success,
          createdAt: d.createdAt.toISOString(),
        })),
      })),
    };
  } catch {
    return { success: false, data: [], error: "Erreur lors de la récupération" };
  }
}

// ─── Action : créer un endpoint ──────────────────────────────────────────────

export async function createWebhookEndpoint(input: {
  url: string;
  events: string[];
}): Promise<{ success: boolean; data?: SavedWebhookEndpoint; error?: string }> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, error: "Accès réservé au plan Business" };
  }

  // Validation Zod
  const parsed = createEndpointSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  // Max 10 endpoints
  const count = await prisma.webhookEndpoint.count({ where: { userId } });
  if (count >= 10) {
    return { success: false, error: "Limite de 10 endpoints atteinte" };
  }

  try {
    // Générer un secret HMAC aléatoire (32 bytes hex)
    const secret = randomBytes(32).toString("hex");

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        userId,
        url: parsed.data.url,
        secret,
        events: parsed.data.events,
      },
    });

    revalidatePath("/dashboard/api");

    return {
      success: true,
      data: {
        id: endpoint.id,
        url: endpoint.url,
        secret: endpoint.secret,
        events: endpoint.events,
        active: endpoint.active,
        createdAt: endpoint.createdAt.toISOString(),
        recentDeliveries: [],
      },
    };
  } catch {
    return { success: false, error: "Erreur lors de la création" };
  }
}

// ─── Action : activer / désactiver un endpoint ───────────────────────────────

export async function toggleWebhookEndpoint(
  id: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, error: "Accès réservé au plan Business" };
  }

  try {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, userId },
    });
    if (!endpoint) return { success: false, error: "Endpoint introuvable" };

    await prisma.webhookEndpoint.update({ where: { id }, data: { active } });

    revalidatePath("/dashboard/api");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ─── Action : supprimer un endpoint ──────────────────────────────────────────

export async function deleteWebhookEndpoint(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, error: "Accès réservé au plan Business" };
  }

  try {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, userId },
    });
    if (!endpoint) return { success: false, error: "Endpoint introuvable" };

    await prisma.webhookEndpoint.delete({ where: { id } });

    revalidatePath("/dashboard/api");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

// ─── Action : récupérer les 20 dernières livraisons (pour le tableau de logs) ─

export async function getRecentDeliveries(): Promise<{
  success: boolean;
  data: (SavedDelivery & { endpointUrl: string })[];
  error?: string;
}> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, data: [], error: "Accès réservé au plan Business" };
  }

  try {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { endpoint: { userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        endpoint: { select: { url: true } },
      },
    });

    return {
      success: true,
      data: deliveries.map((d) => ({
        id: d.id,
        event: d.event,
        statusCode: d.statusCode,
        success: d.success,
        createdAt: d.createdAt.toISOString(),
        endpointUrl: d.endpoint.url,
      })),
    };
  } catch {
    return { success: false, data: [], error: "Erreur lors de la récupération" };
  }
}
