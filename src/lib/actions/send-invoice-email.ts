"use server";

// Server action : envoie la facture par email avec le PDF en pièce jointe via Resend

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument from "@/lib/pdf/invoice-pdf-document";
import type { SavedInvoice } from "@/lib/actions/invoices";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmitterFallback {
  companyName?: string;
  companySiret?: string;
  companyAddress?: string;
  companyPostalCode?: string;
  companyCity?: string;
  companyEmail?: string;
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function sendInvoiceEmail(
  invoiceId: string,
  emitterFallback?: EmitterFallback,
) {
  // 1. Vérifier la session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 2. Récupérer la facture depuis la DB
    const doc = await prisma.document.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: {
        lineItems: { orderBy: { order: "asc" } },
        client: true,
        user: {
          select: {
            companyName: true,
            companySiret: true,
            companyAddress: true,
            companyPostalCode: true,
            companyCity: true,
            companyEmail: true,
            companyPhone: true,
          },
        },
      },
    });

    if (!doc) {
      return { success: false, error: "Facture introuvable" };
    }

    // 3. Construire l'objet SavedInvoice pour le template PDF
    const invoice: SavedInvoice = {
      id: doc.id,
      number: doc.number,
      status: doc.status,
      date: doc.date.toISOString(),
      dueDate: doc.dueDate?.toISOString() ?? null,
      invoiceType: doc.invoiceType,
      discountType: doc.discountType,
      subtotal: doc.subtotal.toNumber(),
      taxTotal: doc.taxTotal.toNumber(),
      total: doc.total.toNumber(),
      discount: doc.discount?.toNumber() ?? null,
      depositAmount: doc.depositAmount?.toNumber() ?? null,
      notes: doc.notes,
      businessMetadata: doc.businessMetadata as Record<string, unknown> | null,
      lineItems: doc.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity.toNumber(),
        unitPrice: li.unitPrice.toNumber(),
        vatRate: li.vatRate.toNumber(),
        subtotal: li.subtotal.toNumber(),
        taxAmount: li.taxAmount.toNumber(),
        total: li.total.toNumber(),
        category: li.category,
        order: li.order,
      })),
      client: {
        id: doc.client.id,
        companyName: doc.client.companyName,
        firstName: doc.client.firstName,
        lastName: doc.client.lastName,
        email: doc.client.email,
        city: doc.client.city,
        address: doc.client.address,
        postalCode: doc.client.postalCode,
      },
      user: {
        companyName: doc.user.companyName || emitterFallback?.companyName || null,
        companySiret: doc.user.companySiret || emitterFallback?.companySiret || null,
        companyAddress: doc.user.companyAddress || emitterFallback?.companyAddress || null,
        companyPostalCode: doc.user.companyPostalCode || emitterFallback?.companyPostalCode || null,
        companyCity: doc.user.companyCity || emitterFallback?.companyCity || null,
        companyEmail: doc.user.companyEmail || emitterFallback?.companyEmail || null,
        companyPhone: doc.user.companyPhone ?? null,
      },
    };

    // 4. Générer le PDF en buffer (renderToBuffer = API serveur de @react-pdf/renderer)
    const pdfBuffer = await renderToBuffer(InvoicePdfDocument({ invoice }));

    // 5. Construire le nom du client pour le mail
    const clientName = doc.client.companyName
      ?? ([doc.client.firstName, doc.client.lastName].filter(Boolean).join(" ") || doc.client.email);

    const amount = invoice.total.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const dueDate = doc.dueDate
      ? new Date(doc.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
      : "—";

    const emitterName = invoice.user.companyName ?? "FacturFlow";

    // 6. Envoyer l'email via Resend
    const { error } = await resend.emails.send({
      from: `${emitterName} <noreply@resend.dev>`,
      to: [doc.client.email],
      subject: `Facture ${doc.number} – PDF ci-joint`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Facture ${doc.number}</h1>
          </div>

          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Bonjour ${clientName},
          </p>

          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Veuillez trouver ci-joint la facture <strong>n°${doc.number}</strong> d'un montant total de <strong>${amount} €</strong>.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px; color: #475569;">
              <tr>
                <td style="padding: 4px 0;">Montant TTC</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #7c3aed;">${amount} €</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;">Date d'échéance</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600;">${dueDate}</td>
              </tr>
            </table>
          </div>

          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            N'hésitez pas à revenir vers nous si vous avez la moindre question concernant cette facture.
          </p>

          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Nous vous remercions par avance pour votre règlement.
          </p>

          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Bien cordialement,<br/>
            <strong>${emitterName}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Email envoyé via FacturFlow
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${doc.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[sendInvoiceEmail] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendInvoiceEmail] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi de l'email" };
  }
}
