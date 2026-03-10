// src/lib/webhook-dispatcher.ts
// Dispatch d'un event webhook vers tous les endpoints actifs de l'utilisateur.
//
// Signature HMAC-SHA256 : header X-FacturNow-Signature: sha256=<hex>
// Chaque livraison est tracée dans WebhookDelivery.

import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

// Events disponibles (utilisés aussi dans la page UI pour les checkboxes)
export const WEBHOOK_EVENTS = [
  "invoice.created",
  "invoice.paid",
  "invoice.overdue",
  "invoice.sent",
  "client.created",
  "quote.accepted",
  "quote.refused",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ─── Signature HMAC ───────────────────────────────────────────────────────────

function signPayload(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────

/**
 * Envoie un événement à tous les endpoints webhooks actifs de l'utilisateur
 * qui écoutent cet event.
 *
 * Non-bloquant par design — les erreurs sont loggées mais n'interrompent pas
 * le flux principal de l'application.
 */
export async function dispatchWebhook(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    // Récupérer les endpoints actifs pour cet utilisateur qui écoutent l'event
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        userId,
        active: true,
        events: { has: event },
      },
    });

    if (endpoints.length === 0) return;

    // Construire le body JSON une seule fois
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    // Envoyer en parallèle à tous les endpoints
    await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const signature = signPayload(endpoint.secret, body);
        let statusCode: number | null = null;
        let success = false;
        let errorMsg: string | null = null;

        try {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-FacturNow-Signature": signature,
              "X-FacturNow-Event": event,
              "User-Agent": "FacturNow-Webhook/1.0",
            },
            body,
            // Timeout de 10 secondes via AbortController
            signal: AbortSignal.timeout(10_000),
          });

          statusCode = response.status;
          success = response.ok;
        } catch (err) {
          errorMsg = err instanceof Error ? err.message : "Erreur réseau";
        }

        // Tracer la livraison en base
        await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            event,
            // Prisma attend InputJsonValue — on re-parse le JSON pour un objet propre
            payload: JSON.parse(body) as Parameters<typeof prisma.webhookDelivery.create>[0]["data"]["payload"],
            statusCode,
            success,
            error: errorMsg,
          },
        });
      })
    );
  } catch (err) {
    // Ne jamais lever d'erreur depuis le dispatcher — log uniquement
    console.error("[WebhookDispatcher] Erreur:", err);
  }
}
