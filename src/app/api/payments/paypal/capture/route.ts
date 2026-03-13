// src/app/api/payments/paypal/capture/route.ts
// Capture le paiement PayPal après approbation du client.
//
// PayPal redirige vers cette URL avec :
//   ?token=ORDER_ID&PayerID=PAYER_ID&invoiceId=xxx
//
// On capture l'order puis on redirige vers le dashboard.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getPaypalAccessToken, capturePaypalOrder } from "@/lib/paypal";
import type { PaypalCredential } from "@/lib/actions/payments";
import { paymentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Rate limiting : 20 req/min par IP
  const { limited } = paymentRateLimit(req);
  if (limited) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const orderId   = searchParams.get("token");      // PayPal injecte "token"
  const invoiceId = searchParams.get("invoiceId");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!orderId || !invoiceId) {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices?payment=error`);
  }

  // ── Récupérer la facture + credentials PayPal du user ────────────────────
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: { user: { select: { id: true } } },
  });

  if (!invoice) {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices?payment=error`);
  }

  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId: invoice.user.id, provider: "PAYPAL" } },
    select: { credential: true, isActive: true },
  });

  if (!account?.isActive) {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices?payment=error`);
  }

  let credential: PaypalCredential;
  try {
    credential = JSON.parse(decrypt(account.credential)) as PaypalCredential;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices?payment=error`);
  }

  // ── Capturer le paiement ─────────────────────────────────────────────────
  try {
    const isSandbox = credential.isSandbox !== false;

    const accessToken = await getPaypalAccessToken(
      credential.clientId,
      credential.clientSecret,
      isSandbox,
    );

    const { status } = await capturePaypalOrder(accessToken, orderId, isSandbox);

    if (status === "COMPLETED") {
      // Marquer la facture PAID (le webhook fait pareil, mais on le fait ici aussi
      // pour une mise à jour immédiate côté dashboard)
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
      }

      return NextResponse.redirect(
        `${appUrl}/dashboard/invoices?payment=success&invoice=${invoiceId}`
      );
    }

    // Statut inattendu (APPROVED, VOIDED…)
    return NextResponse.redirect(
      `${appUrl}/dashboard/invoices?payment=pending&invoice=${invoiceId}`
    );
  } catch (error) {
    console.error("[PayPal capture]", error);
    return NextResponse.redirect(`${appUrl}/dashboard/invoices?payment=error`);
  }
}
