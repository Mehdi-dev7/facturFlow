// src/lib/api-auth.ts
// Authentification des requêtes API externes via clé Bearer (plan BUSINESS).
//
// Usage dans une route :
//   const auth = await authenticateApiRequest(request)
//   if (!auth) return apiError("UNAUTHORIZED", "Clé API invalide ou manquante", 401)

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/feature-gate";

// ─── Type retourné par l'authentification ────────────────────────────────────

export interface ApiAuthResult {
  userId: string;
  effectivePlan: string;
}

// ─── Helpers réponses d'erreur JSON ──────────────────────────────────────────

export function apiError(
  code: string,
  message: string,
  status: number
): Response {
  return Response.json({ error: message, code }, { status });
}

// ─── Hash SHA-256 d'un token ─────────────────────────────────────────────────

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── Authentification principale ─────────────────────────────────────────────

/**
 * Extrait et vérifie la clé API depuis le header Authorization.
 * Vérifie aussi que l'utilisateur est sur le plan BUSINESS.
 *
 * Retourne null si la clé est absente, invalide ou si le plan est insuffisant.
 */
export async function authenticateApiRequest(
  request: Request
): Promise<ApiAuthResult | null> {
  // Extraire le Bearer token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // Hash du token reçu pour comparaison en DB
  const tokenHash = hashToken(token);

  try {
    // Chercher la clé en base (join user pour vérifier le plan)
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            plan: true,
            trialEndsAt: true,
            email: true,
            grantedPlan: true,
          },
        },
      },
    });

    if (!apiKey) return null;

    // Vérifier le plan effectif — l'API est réservée BUSINESS
    const effectivePlan = getEffectivePlan(apiKey.user);
    if (effectivePlan !== "BUSINESS") return null;

    // Mettre à jour lastUsedAt de façon asynchrone (ne bloque pas la réponse)
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // Erreur silencieuse — non critique
      });

    return { userId: apiKey.user.id, effectivePlan };
  } catch {
    return null;
  }
}
