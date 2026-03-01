// src/app/api/payments/create-link/route.ts
// Crée un lien de paiement pour une facture via le provider demandé.
// Actuellement supporté : Stripe (Checkout Session)

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encrypt";
import { getStripeClient } from "@/lib/stripe";
import { getPaypalAccessToken, createPaypalOrder } from "@/lib/paypal";
import type { StripeCredential, PaypalCredential } from "@/lib/actions/payments";

export const runtime = "nodejs";

// ─── POST /api/payments/create-link ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Body
  let body: { invoiceId?: string; provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { invoiceId, provider } = body;
  if (!invoiceId || !provider) {
    return NextResponse.json({ error: "invoiceId et provider requis" }, { status: 400 });
  }

  // Récupérer la facture (vérification ownership incluse)
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, userId: session.user.id, type: "INVOICE" },
    include: {
      client: { select: { email: true, companyName: true, firstName: true, lastName: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  if (provider === "STRIPE") {
    // Récupérer le compte Stripe du user
    const account = await prisma.paymentAccount.findUnique({
      where: { userId_provider: { userId: session.user.id, provider: "STRIPE" } },
      select: { credential: true, isActive: true },
    });

    if (!account || !account.isActive) {
      return NextResponse.json(
        { error: "Stripe non connecté. Allez dans Paramètres → Paiements." },
        { status: 400 }
      );
    }

    // Déchiffrer la clé secrète
    let credential: StripeCredential;
    try {
      credential = JSON.parse(decrypt(account.credential)) as StripeCredential;
    } catch {
      return NextResponse.json({ error: "Erreur de déchiffrement de la clé Stripe" }, { status: 500 });
    }

    // Créer la Checkout Session avec la clé du user
    try {
      const stripe = getStripeClient(credential.secretKey);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      // Montant en centimes (Stripe exige des entiers)
      const unitAmount = Math.round(Number(invoice.total) * 100);

      // Nom du client pour l'email Stripe
      const clientEmail = invoice.client.email;

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: unitAmount,
              product_data: {
                name: `Facture ${invoice.number}`,
                description: invoice.title ?? `Règlement de la facture ${invoice.number}`,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: clientEmail,
        success_url: `${appUrl}/dashboard/invoices?payment=success&invoice=${invoiceId}`,
        cancel_url: `${appUrl}/dashboard/invoices?payment=cancelled&invoice=${invoiceId}`,
        metadata: {
          invoiceId,
          userId: session.user.id,
        },
        // Lien valable 24h
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      });

      if (!checkoutSession.url) {
        return NextResponse.json({ error: "Erreur Stripe : URL manquante" }, { status: 500 });
      }

      return NextResponse.json({ url: checkoutSession.url });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      return NextResponse.json({ error: `Stripe : ${msg}` }, { status: 500 });
    }
  }

  // ── PayPal ────────────────────────────────────────────────────────────────

  if (provider === "PAYPAL") {
    const account = await prisma.paymentAccount.findUnique({
      where: { userId_provider: { userId: session.user.id, provider: "PAYPAL" } },
      select: { credential: true, isActive: true },
    });

    if (!account || !account.isActive) {
      return NextResponse.json(
        { error: "PayPal non connecté. Allez dans Paramètres → Paiements." },
        { status: 400 }
      );
    }

    let credential: PaypalCredential;
    try {
      credential = JSON.parse(decrypt(account.credential)) as PaypalCredential;
    } catch {
      return NextResponse.json({ error: "Erreur de déchiffrement des credentials PayPal" }, { status: 500 });
    }

    try {
      const isSandbox = credential.isSandbox !== false;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const accessToken = await getPaypalAccessToken(
        credential.clientId,
        credential.clientSecret,
        isSandbox,
      );

      const { approvalUrl } = await createPaypalOrder(accessToken, {
        amount: Number(invoice.total),
        invoiceNumber: invoice.number ?? invoice.id,
        invoiceId: invoice.id,
        // PayPal ajoute automatiquement ?token=ORDER_ID&PayerID=xxx à cette URL
        returnUrl: `${appUrl}/api/payments/paypal/capture?invoiceId=${invoice.id}`,
        cancelUrl:  `${appUrl}/dashboard/invoices?payment=cancelled&invoice=${invoice.id}`,
        isSandbox,
      });

      return NextResponse.json({ url: approvalUrl });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      return NextResponse.json({ error: `PayPal : ${msg}` }, { status: 500 });
    }
  }

  // ── GoCardless (phase 3) ──────────────────────────────────────────────────

  return NextResponse.json(
    { error: `Provider "${provider}" non encore supporté` },
    { status: 501 }
  );
}
