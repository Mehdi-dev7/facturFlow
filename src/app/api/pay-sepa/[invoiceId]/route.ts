// src/app/api/pay-sepa/[invoiceId]/route.ts
//
// Route publique (clic depuis email du client) pour initier un paiement SEPA GoCardless.
// 2 cas :
//   A) Client avec mandat actif → prélèvement direct (pas de formulaire)
//   B) Nouveau client → crée un Billing Request + Flow → formulaire IBAN GoCardless
//
// GET /api/pay-sepa/{id}           → cas A ou B selon le mandat
// GET /api/pay-sepa/{id}?status=ok → retour après signature du mandat

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  createBillingRequest,
  createBillingRequestFlow,
  createSepaPayment,
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

  // ── Récupérer la facture + infos client (dont mandat SEPA) ────────────────
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: {
      client: {
        select: {
          id: true, email: true, companyName: true,
          firstName: true, lastName: true,
          gcMandateId: true, gcMandateStatus: true,
        },
      },
      user: { select: { id: true } },
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

  const isSandbox = cred.accessToken.startsWith("sandbox_");

  // ── CAS A : Client avec mandat actif → prélèvement direct ──────────────
  // Pas de formulaire IBAN, le paiement est créé immédiatement.
  if (invoice.client.gcMandateId && invoice.client.gcMandateStatus === "active") {
    try {
      const amountCents = Math.round(Number(invoice.total) * 100);

      if (amountCents < 1) {
        console.warn("[pay-sepa] Montant trop faible:", amountCents);
        return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
      }

      await createSepaPayment(cred.accessToken, isSandbox, {
        mandateId: invoice.client.gcMandateId,
        amountCents,
        description: `Facture ${invoice.number}`,
        invoiceId,
      });

      // Passer en SEPA_PENDING (le webhook payments.confirmed passera en PAID)
      await prisma.document.update({
        where: { id: invoice.id },
        data: { status: "SEPA_PENDING" },
      });

      console.log(`[pay-sepa] Prélèvement direct créé pour ${invoice.number} (mandat existant)`);

      // Rediriger vers la page de confirmation
      return NextResponse.redirect(
        `${appUrl}/public/paiement-confirme?invoice=${invoiceId}&provider=sepa`,
      );
    } catch (err) {
      console.error("[pay-sepa] Erreur prélèvement direct:", err);
      // Si le mandat a expiré/échoué côté GoCardless, on tombe dans le cas B
    }
  }

  // ── CAS B : Nouveau client → formulaire IBAN GoCardless ────────────────
  const clientName =
    invoice.client.companyName ||
    [invoice.client.firstName, invoice.client.lastName].filter(Boolean).join(" ") ||
    invoice.client.email;

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
