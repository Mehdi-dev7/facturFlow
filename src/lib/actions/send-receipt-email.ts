"use server";

// Server actions : envoyer un reçu par email avec PDF en pièce jointe via Resend.
// Deux cas : reçu généré depuis une facture PAID (virtuel) ou reçu manuel enregistré en DB.

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPdfDocument } from "@/lib/pdf/receipt-pdf-document";
import type { SavedReceipt, ReceiptPaymentMethod } from "@/lib/types/receipts";
import { RECEIPT_PAYMENT_METHODS } from "@/lib/types/receipts";

// ─── Sélecteurs Prisma réutilisables ──────────────────────────────────────────

const receiptClientSelect = {
  id: true,
  companyName: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  postalCode: true,
  city: true,
} as const;

const receiptUserSelect = {
  name: true,
  companyName: true,
  companySiret: true,
  companyAddress: true,
  companyPostalCode: true,
  companyCity: true,
  companyEmail: true,
  companyPhone: true,
  themeColor: true,
  companyFont: true,
  companyLogo: true,
} as const;

// ─── Helper : label de mode de paiement ──────────────────────────────────────

function getPaymentLabel(method: string): string {
  return RECEIPT_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

// ─── Helper : nom du client ───────────────────────────────────────────────────

function resolveClientName(client: {
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (client.companyName) return client.companyName;
  const full = [client.firstName, client.lastName].filter(Boolean).join(" ");
  return full || client.email;
}

// ─── Helper : HTML de l'email reçu ───────────────────────────────────────────

function buildReceiptEmailHtml(opts: {
  receiptNumber: string;
  clientName: string;
  emitterName: string;
  amountFormatted: string;
  dateFormatted: string;
  description: string;
  paymentMethod: string;
}): string {
  const { receiptNumber, clientName, emitterName, amountFormatted, dateFormatted, description, paymentMethod } = opts;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Reçu ${receiptNumber}</h1>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Bonjour ${clientName},
      </p>

      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Votre reçu est en pièce jointe. Nous confirmons avoir bien reçu votre paiement.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; color: #475569;">
          <tr>
            <td style="padding: 4px 0;">Montant encaissé</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #7c3aed;">${amountFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Date du paiement</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Objet</td>
            <td style="padding: 4px 0; text-align: right;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Mode de paiement</td>
            <td style="padding: 4px 0; text-align: right;">${paymentMethod}</td>
          </tr>
        </table>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        N'hésitez pas à nous contacter si vous avez la moindre question.
      </p>

      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Bien cordialement,<br/>
        <strong>${emitterName}</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Email envoyé via FacturNow
      </p>
    </div>
  `;
}

// ─── Action 1 : reçu virtuel depuis une facture PAID ─────────────────────────
// Reconstruit un SavedReceipt à partir de la facture, génère le PDF et l'envoie.

export async function sendReceiptFromInvoice(
  invoiceId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 2. Récupérer la facture PAID en DB
    const doc = await prisma.document.findFirst({
      where: { id: invoiceId, userId: session.user.id, type: "INVOICE", status: "PAID" },
      include: {
        client: { select: receiptClientSelect },
        user: { select: receiptUserSelect },
      },
    });

    if (!doc) {
      return { success: false, error: "Facture introuvable ou non payée" };
    }

    if (!doc.client.email) {
      return { success: false, error: "Le client n'a pas d'adresse email" };
    }

    // 3. Construire le SavedReceipt virtuel (pas stocké en DB, uniquement pour le PDF)
    const receipt: SavedReceipt = {
      id: doc.id,
      number: `REC-${doc.number}`,
      status: "PAID",
      date: doc.date.toISOString(),
      total: doc.total.toNumber(),
      description: `Paiement de la facture ${doc.number}`,
      paymentMethod: "CARD" as ReceiptPaymentMethod,
      notes: doc.notes,
      client: {
        id: doc.client.id,
        companyName: doc.client.companyName,
        firstName: doc.client.firstName,
        lastName: doc.client.lastName,
        email: doc.client.email,
        phone: doc.client.phone,
        address: doc.client.address,
        postalCode: doc.client.postalCode,
        city: doc.client.city,
      },
      user: {
        name: doc.user.companyName ?? doc.user.name,
        companyName: doc.user.companyName,
        companySiret: doc.user.companySiret,
        companyAddress: doc.user.companyAddress,
        companyPostalCode: doc.user.companyPostalCode,
        companyCity: doc.user.companyCity,
        companyEmail: doc.user.companyEmail,
        companyPhone: doc.user.companyPhone,
      },
      createdAt: new Date().toISOString(),
    };

    // 4. Générer le PDF en buffer
    const pdfBuffer = await renderToBuffer(ReceiptPdfDocument({ receipt }));

    // 5. Préparer les valeurs d'affichage pour l'email
    const clientName = resolveClientName(doc.client);
    const emitterName = doc.user.companyName ?? "FacturNow";
    const amountFormatted =
      doc.total.toNumber().toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €";
    const dateFormatted = doc.date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // 6. Envoyer via Resend
    const { error } = await resend.emails.send({
      from: `${emitterName} <noreply@resend.dev>`,
      to: [doc.client.email],
      subject: `Reçu REC-${doc.number} – Paiement confirmé`,
      html: buildReceiptEmailHtml({
        receiptNumber: `REC-${doc.number}`,
        clientName,
        emitterName,
        amountFormatted,
        dateFormatted,
        description: `Paiement de la facture ${doc.number}`,
        paymentMethod: "Virement",
      }),
      attachments: [
        {
          filename: `REC-${doc.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[sendReceiptFromInvoice] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendReceiptFromInvoice] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi du reçu" };
  }
}

// ─── Action 2 : reçu manuel enregistré en DB (type RECEIPT) ──────────────────
// Fetch le document depuis la DB, construit le SavedReceipt et envoie le PDF.

export async function sendSavedReceiptEmail(
  receiptId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 2. Récupérer le reçu DB
    const doc = await prisma.document.findFirst({
      where: { id: receiptId, userId: session.user.id, type: "RECEIPT" },
      include: {
        client: { select: receiptClientSelect },
        user: { select: receiptUserSelect },
      },
    });

    if (!doc) {
      return { success: false, error: "Reçu introuvable" };
    }

    if (!doc.client.email) {
      return { success: false, error: "Le client n'a pas d'adresse email" };
    }

    // 3. Extraire description et paymentMethod depuis businessMetadata (stockés lors de la création)
    const meta = doc.businessMetadata as Record<string, unknown> | null;
    const description = (meta?.description as string | undefined) ?? doc.notes ?? "Paiement";
    const paymentMethodRaw = (meta?.paymentMethod as string | undefined) ?? "CASH";
    const paymentMethod = paymentMethodRaw as ReceiptPaymentMethod;

    // 4. Construire le SavedReceipt
    const receipt: SavedReceipt = {
      id: doc.id,
      number: doc.number,
      status: doc.status,
      date: doc.date.toISOString(),
      total: doc.total.toNumber(),
      description,
      paymentMethod,
      notes: doc.notes,
      client: {
        id: doc.client.id,
        companyName: doc.client.companyName,
        firstName: doc.client.firstName,
        lastName: doc.client.lastName,
        email: doc.client.email,
        phone: doc.client.phone,
        address: doc.client.address,
        postalCode: doc.client.postalCode,
        city: doc.client.city,
      },
      user: {
        name: doc.user.companyName ?? doc.user.name,
        companyName: doc.user.companyName,
        companySiret: doc.user.companySiret,
        companyAddress: doc.user.companyAddress,
        companyPostalCode: doc.user.companyPostalCode,
        companyCity: doc.user.companyCity,
        companyEmail: doc.user.companyEmail,
        companyPhone: doc.user.companyPhone,
      },
      createdAt: doc.createdAt.toISOString(),
    };

    // 5. Générer le PDF en buffer
    const pdfBuffer = await renderToBuffer(ReceiptPdfDocument({ receipt }));

    // 6. Préparer les valeurs d'affichage
    const clientName = resolveClientName(doc.client);
    const emitterName = doc.user.companyName ?? "FacturNow";
    const amountFormatted =
      doc.total.toNumber().toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €";
    const dateFormatted = doc.date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // 7. Envoyer via Resend
    const { error } = await resend.emails.send({
      from: `${emitterName} <noreply@resend.dev>`,
      to: [doc.client.email],
      subject: `Reçu ${doc.number} – Paiement confirmé`,
      html: buildReceiptEmailHtml({
        receiptNumber: doc.number,
        clientName,
        emitterName,
        amountFormatted,
        dateFormatted,
        description,
        paymentMethod: getPaymentLabel(paymentMethod),
      }),
      attachments: [
        {
          filename: `${doc.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[sendSavedReceiptEmail] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendSavedReceiptEmail] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi du reçu" };
  }
}
