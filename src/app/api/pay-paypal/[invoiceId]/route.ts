// src/app/api/pay-paypal/[invoiceId]/route.ts
//
// Deux comportements selon la query string :
//   GET /api/pay-paypal/{id}               → crée un Order PayPal → redirige vers PayPal
//   GET /api/pay-paypal/{id}?token={order} → capture l'Order → marque PAID → redirige dashboard
//
// L'email facture contient l'URL courte (facturnow.fr/api/pay-paypal/{id}).
// PayPal redirige vers la même URL avec ?token=ORDER_ID après approbation.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  getPaypalAccessToken,
  createPaypalOrder,
  capturePaypalOrder,
} from "@/lib/paypal";
import type { PaypalCredential } from "@/lib/actions/payments";
import { paymentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  // Rate limiting : 20 req/min par IP
  const { limited } = paymentRateLimit(req);
  if (limited) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { invoiceId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr";
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token"); // orderId PayPal après retour

  // ── Récupérer la facture ──────────────────────────────────────────────────
  const invoice = await prisma.document.findFirst({
    where: { id: invoiceId, type: "INVOICE" },
    include: {
      client: { select: { email: true } },
      user:   { select: { id: true } },
    },
  });

  if (!invoice) {
    return NextResponse.redirect(`${appUrl}/404`);
  }

  // ── Récupérer les credentials PayPal du user ──────────────────────────────
  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId: invoice.user.id, provider: "PAYPAL" } },
    select: { credential: true, isActive: true },
  });

  if (!account || !account.isActive) {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }

  let cred: PaypalCredential;
  try {
    cred = JSON.parse(decrypt(account.credential)) as PaypalCredential;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }

  const isSandbox = cred.isSandbox !== false; // true par défaut

  // ── CAS 1 : retour PayPal avec ?token=ORDER_ID → capture ─────────────────
  if (token) {
    try {
      const accessToken = await getPaypalAccessToken(
        cred.clientId,
        cred.clientSecret,
        isSandbox,
      );

      const { status } = await capturePaypalOrder(accessToken, token, isSandbox);

      if (status === "COMPLETED" && invoice.status !== "PAID") {
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
    } catch (err) {
      console.error("[PayPal capture]", err);
    }

    // Redirection vers le dashboard dans tous les cas
    return NextResponse.redirect(
      `${appUrl}/public/paiement-confirme?invoice=${invoiceId}&provider=paypal`,
    );
  }

  // ── CAS 2 : premier clic → créer l'Order et rediriger vers PayPal ─────────
  try {
    const accessToken = await getPaypalAccessToken(
      cred.clientId,
      cred.clientSecret,
      isSandbox,
    );

    const returnUrl = `${appUrl}/api/pay-paypal/${invoiceId}`;
    const cancelUrl = `${appUrl}/public/paiement-confirme?invoice=${invoiceId}&provider=paypal&status=cancelled`;

    const { approvalUrl } = await createPaypalOrder(accessToken, {
      amount:        Number(invoice.total),
      invoiceNumber: invoice.number,
      invoiceId,
      returnUrl,
      cancelUrl,
      isSandbox,
    });

    return NextResponse.redirect(approvalUrl);
  } catch (err) {
    console.error("[PayPal create order]", err);
    return NextResponse.redirect(`${appUrl}/dashboard/invoices`);
  }
}
