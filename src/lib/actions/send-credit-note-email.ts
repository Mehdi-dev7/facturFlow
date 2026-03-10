"use server";

// Server action : envoie un avoir par email au client avec le PDF en pièce jointe
// Pattern identique à send-deposit-email.ts

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base";
import { CREDIT_NOTE_REASONS } from "@/lib/types/credit-notes";
import type { SavedCreditNote } from "@/lib/types/credit-notes";

// ─── Helper : traduit la valeur du motif en libellé lisible ─────────────────

function getReasonLabel(value: string): string {
  return CREDIT_NOTE_REASONS.find((r) => r.value === value)?.label ?? value;
}

// ─── Action principale ───────────────────────────────────────────────────────

export async function sendCreditNoteEmail(creditNoteId: string) {
  // 1. Vérifier la session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 2. Récupérer l'avoir depuis la DB avec toutes les relations nécessaires
    const doc = await prisma.document.findFirst({
      where: { id: creditNoteId, userId: session.user.id, type: "CREDIT_NOTE" },
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
            iban: true,
            bic: true,
          },
        },
      },
    });

    if (!doc) {
      return { success: false, error: "Avoir introuvable" };
    }

    // 3. Construire les données de base
    const clientName =
      doc.client.companyName ??
      (`${doc.client.firstName ?? ""} ${doc.client.lastName ?? ""}`.trim() ||
        doc.client.email);

    const emitterName = doc.user.companyName ?? "Votre prestataire";

    const amountFormatted =
      Number(doc.total).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €";

    // Extraire les métadonnées de l'avoir
    const meta = doc.businessMetadata as Record<string, unknown> | null;
    const invoiceNumber = (meta?.invoiceNumber as string) ?? "N/A";
    const reason = (meta?.reason as string) ?? "autre";
    const reasonLabel = getReasonLabel(reason);

    // 4. Générer le PDF en buffer
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { CreditNotePdfDocument } = await import("@/lib/pdf/credit-note-pdf-document");

    // Construire l'objet SavedCreditNote pour le PDF
    const creditNoteForPdf: SavedCreditNote = {
      id: doc.id,
      number: doc.number,
      status: doc.status,
      date: doc.date.toISOString(),
      total: Number(doc.total),
      type: (meta?.type as "full" | "partial") ?? "full",
      reason: reason,
      invoiceId: (meta?.invoiceId as string) ?? "",
      invoiceNumber: invoiceNumber,
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
        companyLogo: doc.user.companyLogo,
        iban: doc.user.iban,
        bic: doc.user.bic,
      },
      createdAt: doc.createdAt.toISOString(),
    };

    // Appel direct comme fonction (pattern identique à send-receipt-email.ts)
    const pdfBuffer = await renderToBuffer(CreditNotePdfDocument({ creditNote: creditNoteForPdf }));

    // 5. Construire l'email HTML (sans boutons de paiement — c'est un avoir, pas une facture)
    const html = wrapEmail(`
      ${emailHeader(
        "linear-gradient(135deg, #dc2626, #9f1239)",
        "AVOIR",
        `${doc.number} — Facture ${invoiceNumber}`,
      )}

      <p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Veuillez trouver ci-joint votre avoir N° <strong>${doc.number}</strong>
        pour la facture <strong>${invoiceNumber}</strong>.
      </p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr>
            <td style="padding:4px 0;">Montant du crédit</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;color:#dc2626;">
              − ${amountFormatted}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">Motif</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e293b;">
              ${reasonLabel}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">Facture d&apos;origine</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e293b;">
              ${invoiceNumber}
            </td>
          </tr>
        </table>
      </div>

      ${doc.notes ? `<p style="color:#334155;font-size:15px;line-height:1.6;"><em>${doc.notes}</em></p>` : ""}

      ${doc.user.iban ? `
      <div style="margin:20px 0;padding:16px;background:#f8f7ff;border-left:4px solid #7c3aed;border-radius:4px;">
        <p style="margin:0 0 8px;font-weight:600;color:#7c3aed;">Remboursement par virement bancaire</p>
        <p style="margin:0;font-size:14px;color:#374151;">IBAN : ${doc.user.iban}</p>
        ${doc.user.bic ? `<p style="margin:4px 0 0;font-size:14px;color:#374151;">BIC : ${doc.user.bic}</p>` : ""}
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Référence : ${doc.number}</p>
      </div>
      ` : ""}

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        N&apos;hésitez pas à nous contacter si vous avez des questions concernant cet avoir.
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
      subject: `Avoir ${doc.number} — ${emitterName}`,
      html,
      attachments: [
        {
          filename: `${doc.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[sendCreditNoteEmail] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendCreditNoteEmail] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi de l'email" };
  }
}
