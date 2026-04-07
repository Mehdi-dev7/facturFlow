"use server";

// Server action : envoie un bon de livraison par email au client avec le PDF en pièce jointe
// Pattern identique à send-credit-note-email.ts

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base";
import type { SavedDeliveryNote } from "@/lib/types/delivery-notes";

// ─── Action principale ───────────────────────────────────────────────────────

export async function sendDeliveryNoteEmail(deliveryNoteId: string) {
  // 1. Vérifier la session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 2. Récupérer le BL depuis la DB avec toutes les relations
    const doc = await prisma.document.findFirst({
      where: { id: deliveryNoteId, userId: session.user.id, type: "DELIVERY_NOTE" },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            address: true,
            postalCode: true,
            city: true,
            companySiret: true,
          },
        },
        user: {
          select: {
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
            invoiceFooter: true,
          },
        },
        lineItems: {
          select: {
            id: true,
            description: true,
            quantity: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!doc) {
      return { success: false, error: "Bon de livraison introuvable" };
    }

    // 3. Construire les données de base
    const clientName =
      doc.client.companyName ??
      (`${doc.client.firstName ?? ""} ${doc.client.lastName ?? ""}`.trim() || doc.client.email);

    const emitterName = doc.user.companyName ?? "Votre prestataire";

    // Extraire la facture d'origine depuis businessMetadata
    const meta = doc.businessMetadata as Record<string, unknown> | null;
    const invoiceNumber = (meta?.invoiceNumber as string) ?? "N/A";

    // 4. Générer le PDF en buffer
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { DeliveryNotePdfDocument } = await import("@/lib/pdf/delivery-note-pdf-document");

    // Construire l'objet SavedDeliveryNote pour le PDF
    const deliveryNoteForPdf: SavedDeliveryNote = {
      id: doc.id,
      number: doc.number,
      status: doc.status,
      date: doc.date.toISOString(),
      deliveryDate: doc.validUntil?.toISOString() ?? doc.date.toISOString(),
      total: Number(doc.total),
      invoiceId: (meta?.invoiceId as string) ?? "",
      invoiceNumber,
      notes: doc.notes,
      lines: doc.lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit: "unité",
        delivered: true,
      })),
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
        companySiret: doc.client.companySiret,
      },
      user: {
        name: doc.user.name,
        companyName: doc.user.companyName,
        companySiret: doc.user.companySiret,
        companyAddress: doc.user.companyAddress,
        companyPostalCode: doc.user.companyPostalCode,
        companyCity: doc.user.companyCity,
        companyEmail: doc.user.companyEmail,
        companyPhone: doc.user.companyPhone,
        themeColor: doc.user.themeColor,
        companyFont: doc.user.companyFont,
        invoiceFooter: doc.user.invoiceFooter,
        companyLogo: doc.user.companyLogo,
      },
      createdAt: doc.createdAt.toISOString(),
    };

    const pdfBuffer = await renderToBuffer(DeliveryNotePdfDocument({ deliveryNote: deliveryNoteForPdf }));

    // 5. Construire l'email HTML
    const deliveryDateFormatted = new Date(deliveryNoteForPdf.deliveryDate).toLocaleDateString("fr-FR");

    const html = wrapEmail(`
      ${emailHeader(
        "linear-gradient(135deg, #0d9488, #0f766e)",
        "BON DE LIVRAISON",
        `${doc.number} — Facture ${invoiceNumber}`,
      )}

      <p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Veuillez trouver ci-joint votre bon de livraison N° <strong>${doc.number}</strong>
        pour la facture <strong>${invoiceNumber}</strong>.
      </p>

      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr>
            <td style="padding:4px 0;">Date de livraison</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e293b;">
              ${deliveryDateFormatted}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">Facture d&apos;origine</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e293b;">
              ${invoiceNumber}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">Nombre d&apos;articles</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e293b;">
              ${deliveryNoteForPdf.lines.length}
            </td>
          </tr>
        </table>
      </div>

      ${doc.notes ? `<p style="color:#334155;font-size:15px;line-height:1.6;"><em>${doc.notes}</em></p>` : ""}

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        N&apos;hésitez pas à nous contacter si vous avez des questions concernant cette livraison.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Bien cordialement,<br/><strong>${emitterName}</strong>
      </p>

      ${EMAIL_FOOTER}
    `);

    // 6. Envoyer via Resend avec le PDF en pièce jointe
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? `${emitterName} <noreply@facturnow.fr>`,
      to: [doc.client.email],
      subject: `Bon de livraison ${doc.number} — ${emitterName}`,
      html,
      attachments: [
        {
          filename: `${doc.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[sendDeliveryNoteEmail] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendDeliveryNoteEmail] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi de l'email" };
  }
}
