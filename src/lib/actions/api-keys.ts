"use server";

// src/lib/actions/api-keys.ts
// Server Actions pour la gestion des clés API (plan BUSINESS uniquement).
//
// La clé brute (fnk_xxx) n'est JAMAIS stockée — uniquement son SHA-256.
// Elle est retournée en clair UNE SEULE FOIS à la création.

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/feature-gate";
import { hashToken } from "@/lib/api-auth";

// ─── Type retourné (sans keyHash) ────────────────────────────────────────────

export interface SavedApiKey {
  id: string;
  name: string;
  keyPrefix: string;       // "fnk_xxxx" — 8 chars pour affichage
  lastUsedAt: string | null;
  createdAt: string;
}

// ─── Helper : vérifier session + plan BUSINESS ───────────────────────────────

async function getBusinessSession() {
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

// ─── Action : lister les clés ────────────────────────────────────────────────

export async function listApiKeys(): Promise<{
  success: boolean;
  data: SavedApiKey[];
  error?: string;
}> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, data: [], error: "Accès réservé au plan Business" };
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, data: [], error: "Erreur lors de la récupération" };
  }
}

// ─── Action : créer une clé ───────────────────────────────────────────────────

export async function createApiKey(name: string): Promise<{
  success: boolean;
  // token n'est présent qu'à la création — après il est perdu
  token?: string;
  data?: SavedApiKey;
  error?: string;
}> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, error: "Accès réservé au plan Business" };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Le nom est obligatoire" };
  }

  // Limiter à 10 clés par utilisateur
  const count = await prisma.apiKey.count({ where: { userId } });
  if (count >= 10) {
    return { success: false, error: "Limite de 10 clés API atteinte" };
  }

  try {
    // Générer le token brut : préfixe + 32 bytes hex
    const rawToken = "fnk_" + randomBytes(32).toString("hex");

    // Les 8 premiers chars = préfixe d'affichage
    const keyPrefix = rawToken.slice(0, 8);

    // Hash SHA-256 pour le stockage
    const keyHash = hashToken(rawToken);

    const key = await prisma.apiKey.create({
      data: { userId, name: trimmedName, keyHash, keyPrefix },
    });

    revalidatePath("/dashboard/api");

    return {
      success: true,
      token: rawToken,  // Retourné UNE SEULE FOIS
      data: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        lastUsedAt: null,
        createdAt: key.createdAt.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Erreur lors de la création de la clé" };
  }
}

// ─── Action : supprimer une clé ───────────────────────────────────────────────

export async function deleteApiKey(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await getBusinessSession();
  if (!userId) {
    return { success: false, error: "Accès réservé au plan Business" };
  }

  try {
    // Vérifier ownership avant suppression
    const key = await prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) return { success: false, error: "Clé introuvable" };

    await prisma.apiKey.delete({ where: { id } });

    revalidatePath("/dashboard/api");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
