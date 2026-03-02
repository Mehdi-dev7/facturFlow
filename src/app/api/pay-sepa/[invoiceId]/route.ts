// src/app/api/pay-sepa/[invoiceId]/route.ts
//
// Route publique (clic depuis email du client) pour initier un mandat SEPA GoCardless.
// Flow :
//   GET /api/pay-sepa/{id}           → crée un Billing Request + Flow → redirige vers GoCardless
//   GET /api/pay-sepa/{id}?status=ok → retour après signature du mandat (affiche page de confirmation)
//
// Après la signature, GoCardless envoie un webhook mandates.active → on stocke le mandate_id
// sur le Client et on déclenche le paiement automatiquement.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  createBillingRequest,
  createBillingRequestFlow,
} from "@/lib/gocardless";
import type { GocardlessCredential } from "@/lib/actions/payments";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const { invoiceId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr";
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  // ── Retour après signature : rediriger vers la page de confirmation ───────
  if (status === "ok") {
    return NextResponse.redirect(
      `${appUrl}/public/paiement-confirme?invoice=${invoiceId}&provider=sepa`,
    );
  }

  // ── Récupérer la facture ──────────────────────────────────────────────────
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: {
      client: { select: { id: true, email: true, companyName: true, firstName: true, lastName: true } },
      user:   { select: { id: true } },
    },
  });

  if (!invoice) {
    return NextResponse.redirect(`${appUrl}/404`);
  }

  // ── Récupérer les credentials GoCardless du user ─────────────────────────
  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId: invoice.user.id, provider: "GOCARDLESS" } },
    select: { credential: true, isActive: true },
  });

  if (!account || !account.isActive) {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }

  let cred: GocardlessCredential;
  try {
    cred = JSON.parse(decrypt(account.credential)) as GocardlessCredential;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }

  // Détecter sandbox (token sandbox commence par "sandbox_")
  const isSandbox = cred.accessToken.startsWith("sandbox_");

  // ── Nom du client ─────────────────────────────────────────────────────────
  const clientName =
    invoice.client.companyName ||
    [invoice.client.firstName, invoice.client.lastName].filter(Boolean).join(" ") ||
    invoice.client.email;

  // ── Créer le Billing Request + Flow ──────────────────────────────────────
  try {
    const billingRequestId = await createBillingRequest(
      cred.accessToken,
      isSandbox,
      {
        clientEmail: invoice.client.email,
        clientName,
        description: `Facture ${invoice.number}`,
        invoiceId,
      },
    );

    const successUrl = `${appUrl}/api/pay-sepa/${invoiceId}?status=ok`;
    const authorisationUrl = await createBillingRequestFlow(
      cred.accessToken,
      isSandbox,
      billingRequestId,
      successUrl,
    );

    return NextResponse.redirect(authorisationUrl);
  } catch (err) {
    console.error("[pay-sepa] GoCardless error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }
}
