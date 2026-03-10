// src/app/api/webhooks/paypal/route.ts
// Webhook PayPal : PAYMENT.CAPTURE.COMPLETED → marque la facture PAID.
//
// Sécurité :
//  - Si webhookId stocké → vérification de signature via l'API PayPal (recommandé)
//  - Sinon            → on traite sans vérification en dev, on rejette en prod
//
// L'invoiceId est dans purchase_units[0].custom_id (custom_id qu'on passe à la création).

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getPaypalAccessToken, verifyPaypalWebhook } from "@/lib/paypal";
import type { PaypalCredential } from "@/lib/actions/payments";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── Parser l'événement ────────────────────────────────────────────────────
  let event: {
    event_type?: string;
    resource?: {
      custom_id?: string;        // invoiceId
      supplementary_data?: { related_ids?: { order_id?: string } };
    };
  };

  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  // On n'agit que sur PAYMENT.CAPTURE.COMPLETED
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
    return NextResponse.json({ received: true });
  }

  const invoiceId = event.resource?.custom_id;
  if (!invoiceId) {
    return NextResponse.json({ received: true });
  }

  // ── Récupérer la facture pour trouver le user ─────────────────────────────
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: { user: { select: { id: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ received: true });
  }

  // ── Vérifier la signature PayPal (si webhookId disponible) ───────────────
  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId: invoice.user.id, provider: "PAYPAL" } },
    select: { credential: true, isActive: true },
  });

  if (account?.isActive) {
    try {
      const cred = JSON.parse(decrypt(account.credential)) as PaypalCredential;
      const isSandbox = cred.isSandbox !== false;

      if (cred.webhookId) {
        const accessToken = await getPaypalAccessToken(
          cred.clientId,
          cred.clientSecret,
          isSandbox,
        );

        const valid = await verifyPaypalWebhook(accessToken, {
          headers: {
            authAlgo:        req.headers.get("paypal-auth-algo")          ?? "",
            certUrl:         req.headers.get("paypal-cert-url")           ?? "",
            transmissionId:  req.headers.get("paypal-transmission-id")    ?? "",
            transmissionSig: req.headers.get("paypal-transmission-sig")   ?? "",
            transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
          },
          rawBody,
          webhookId: cred.webhookId,
          isSandbox,
        });

        if (!valid) {
          console.error("[PayPal webhook] Signature invalide");
          return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
        }
      } else {
        // Pas de webhookId → rejeté en prod
        if (process.env.NODE_ENV === "production") {
          console.warn("[PayPal webhook] Aucun webhookId — rejeté en production");
          return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
        }
        console.warn("[PayPal webhook] Signature non vérifiée (dev — ajoutez un webhookId)");
      }
    } catch (err) {
      console.error("[PayPal webhook] Erreur vérification :", err);
    }
  }

  // ── Mettre à jour la facture ──────────────────────────────────────────────
  try {
    if (invoice.status !== "PAID") {
      await prisma.document.update({
        where: { id: invoiceId },
        data: {
          status:        "PAID",
          paidAt:        new Date(),
          paidAmount:    invoice.total,
          paymentMethod: "paypal",
        },
      });

      revalidatePath("/dashboard/invoices");
      console.log(`[PayPal webhook] Facture ${invoiceId} marquée PAID`);
      dispatchWebhook(invoice.user.id, "invoice.paid", { id: invoiceId, provider: "paypal" }).catch(() => {});
    }
  } catch (err) {
    console.error("[PayPal webhook] Erreur DB :", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
