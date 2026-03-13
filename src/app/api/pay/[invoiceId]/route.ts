// src/app/api/pay/[invoiceId]/route.ts
// Redirect propre vers le lien de paiement Stripe.
// L'email contient une URL courte (facturnow.com/api/pay/xxx) au lieu de l'URL Stripe immense.
// Un nouveau Checkout Session est créé à chaque clic → pas de problème d'expiration.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getStripeClient } from "@/lib/stripe";
import type { StripeCredential } from "@/lib/actions/payments";
import { paymentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  // Rate limiting : 20 req/min par IP (anti-abus sur les liens de paiement publics)
  const { limited } = paymentRateLimit(_req);
  if (limited) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { invoiceId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Récupérer la facture + user
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: {
      client: { select: { email: true } },
      user: { select: { id: true } },
    },
  });

  if (!invoice) {
    return NextResponse.redirect(`${appUrl}/404`);
  }

  // Récupérer les credentials Stripe du user
  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId: invoice.user.id, provider: "STRIPE" } },
    select: { credential: true, isActive: true },
  });

  if (!account || !account.isActive) {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }

  let credential: StripeCredential;
  try {
    credential = JSON.parse(decrypt(account.credential)) as StripeCredential;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }

  // Vérifier le montant minimum Stripe (50 centimes)
  const amountInCents = Math.round(Number(invoice.total) * 100);
  if (amountInCents < 50) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/invoices?payment=error&reason=amount_too_low`
    );
  }

  // Créer un nouveau Checkout Session Stripe (frais, sans expiration immédiate)
  try {
    const stripe = getStripeClient(credential.secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: amountInCents,
          product_data: { name: `Facture ${invoice.number}` },
        },
        quantity: 1,
      }],
      customer_email: invoice.client.email,
      success_url: `${appUrl}/public/paiement-confirme?invoice=${invoiceId}&provider=stripe`,
      cancel_url: `${appUrl}/public/paiement-confirme?invoice=${invoiceId}&provider=stripe&status=cancelled`,
      metadata: { invoiceId, userId: invoice.user.id },
    });

    if (session.url) {
      return NextResponse.redirect(session.url);
    }
  } catch (err) {
    console.error("[pay redirect] Stripe error:", err);
  }

  return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
}
