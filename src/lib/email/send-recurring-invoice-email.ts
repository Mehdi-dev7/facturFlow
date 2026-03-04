// Envoi d'email de facture récurrente depuis le cron — pas de session requise.
// Contrairement à sendInvoiceEmail (Server Action), cette fonction prend
// directement userId + invoiceId sans vérifier la session.

import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/email/resend"
import { renderToBuffer } from "@react-pdf/renderer"
import InvoicePdfDocument from "@/lib/pdf/invoice-pdf-document"
import type { SavedInvoice } from "@/lib/actions/invoices"

// ─── Options ─────────────────────────────────────────────────────────────────

export interface SendRecurringEmailOptions {
  invoiceId: string
  userId: string
  /** Prélèvement SEPA déclenché automatiquement (mandat existant) */
  sepaAutoTriggered?: boolean
  /** URL GoCardless pour signer le mandat (premier prélèvement) */
  sepaUrl?: string
  /** URL Stripe CB */
  stripeUrl?: string
  /** URL PayPal */
  paypalUrl?: string
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function sendRecurringInvoiceEmail(opts: SendRecurringEmailOptions): Promise<void> {
  const { invoiceId, userId, sepaAutoTriggered, sepaUrl, stripeUrl, paypalUrl } = opts

  // 1. Récupérer la facture avec toutes les relations nécessaires
  const doc = await prisma.document.findFirst({
    where: { id: invoiceId, userId },
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
          themeColor: true,
          companyFont: true,
          companyLogo: true,
          iban: true,
          bic: true,
        },
      },
    },
  })

  if (!doc) throw new Error(`[recurring-email] Facture introuvable: ${invoiceId}`)

  // 2. Construire l'objet SavedInvoice pour le template PDF
  const invoice: SavedInvoice = {
    id: doc.id,
    number: doc.number,
    status: doc.status,
    updatedAt: doc.updatedAt.toISOString(),
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
    einvoiceRef: doc.einvoiceRef ?? null,
    einvoiceStatus: doc.einvoiceStatus ?? null,
    einvoiceSentAt: doc.einvoiceSentAt?.toISOString() ?? null,
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
      companySiret: doc.client.companySiret,
      firstName: doc.client.firstName,
      lastName: doc.client.lastName,
      email: doc.client.email,
      city: doc.client.city,
      address: doc.client.address,
      postalCode: doc.client.postalCode,
    },
    user: {
      companyName: doc.user.companyName ?? null,
      companySiret: doc.user.companySiret ?? null,
      companyAddress: doc.user.companyAddress ?? null,
      companyPostalCode: doc.user.companyPostalCode ?? null,
      companyCity: doc.user.companyCity ?? null,
      companyEmail: doc.user.companyEmail ?? null,
      companyPhone: doc.user.companyPhone ?? null,
      themeColor: doc.user.themeColor ?? null,
      companyFont: doc.user.companyFont ?? null,
      companyLogo: doc.user.companyLogo ?? null,
      iban: doc.user.iban ?? null,
      bic: doc.user.bic ?? null,
    },
  }

  // 3. Générer le PDF
  const pdfBuffer = await renderToBuffer(InvoicePdfDocument({ invoice }))

  // 4. Données d'affichage
  const clientName =
    (doc.client.companyName ??
    [doc.client.firstName, doc.client.lastName].filter(Boolean).join(" ")) ||
    doc.client.email

  const amount = invoice.total.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dueDate = doc.dueDate
    ? new Date(doc.dueDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—"

  const emitterName = invoice.user.companyName ?? "FacturNow"
  const invoiceNumber = doc.number ?? ""

  // 5. Blocs HTML
  const paymentBlock = buildPaymentBlock({ sepaAutoTriggered, sepaUrl, stripeUrl, paypalUrl, amount })
  const ibanBlock = doc.user.iban
    ? buildIbanBlock(doc.user.iban, doc.user.bic ?? null, invoiceNumber)
    : ""

  // 6. Envoyer via Resend
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>"
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [doc.client.email],
    subject: `Facture ${invoiceNumber} – ${emitterName}`,
    html: buildEmailHtml({ clientName, amount, dueDate, emitterName, invoiceNumber, paymentBlock, ibanBlock }),
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }],
  })

  if (error) throw new Error(`[recurring-email] Resend error: ${error.message}`)
}

// ─── Blocs HTML ───────────────────────────────────────────────────────────────

function buildPaymentBlock(opts: {
  sepaAutoTriggered?: boolean
  sepaUrl?: string
  stripeUrl?: string
  paypalUrl?: string
  amount: string
}): string {
  const { sepaAutoTriggered, sepaUrl, stripeUrl, paypalUrl, amount } = opts
  const parts: string[] = []

  // SEPA : prélèvement auto (mandat existant)
  if (sepaAutoTriggered) {
    parts.push(`
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 6px;font-weight:700;color:#16a34a;font-size:15px;">Prélèvement SEPA automatique</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          Un prélèvement de <strong>${amount} €</strong> a été déclenché automatiquement sur votre compte.
          <br/><span style="color:#6b7280;font-size:12px;">Délai de traitement : 2–5 jours ouvrés</span>
        </p>
      </div>
    `)
  }

  // SEPA : premier mandat (pas encore signé)
  if (sepaUrl) {
    parts.push(`
      <div style="text-align:center;margin:28px 0;">
        <a href="${sepaUrl}"
           style="display:inline-block;background-color:#0854b3;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:13px 28px;border-radius:6px;cursor:pointer;">
          Autoriser le prélèvement SEPA
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          Signature unique via <strong style="color:#0854b3;">GoCardless</strong> &nbsp;·&nbsp; Les prochains prélèvements seront automatiques
        </p>
      </div>
    `)
  }

  // Stripe CB
  if (stripeUrl) {
    parts.push(`
      <div style="text-align:center;margin:16px 0;">
        <a href="${stripeUrl}"
           style="display:inline-block;background-color:#635BFF;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:13px 28px;border-radius:6px;cursor:pointer;">
          Payer ${amount} € par CB
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          Paiement sécurisé par <strong style="color:#635BFF;">Stripe</strong> &nbsp;·&nbsp; CB, Apple Pay, Google Pay
        </p>
      </div>
    `)
  }

  // PayPal
  if (paypalUrl) {
    parts.push(`
      <div style="text-align:center;margin:16px 0;">
        <a href="${paypalUrl}"
           style="display:inline-block;background-color:#003087;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:13px 28px;border-radius:6px;cursor:pointer;">
          Payer ${amount} € via PayPal
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          Paiement sécurisé par <strong style="color:#003087;">PayPal</strong>
        </p>
      </div>
    `)
  }

  return parts.join("")
}

function buildIbanBlock(iban: string, bic: string | null, reference: string): string {
  return `
    <div style="margin:20px 0;padding:16px;background:#f8f7ff;border-left:4px solid #7c3aed;border-radius:4px;">
      <p style="margin:0 0 8px;font-weight:600;color:#7c3aed;">Paiement par virement bancaire</p>
      <p style="margin:0;font-size:14px;color:#374151;">IBAN : ${iban}</p>
      ${bic ? `<p style="margin:4px 0 0;font-size:14px;color:#374151;">BIC : ${bic}</p>` : ""}
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Référence : ${reference}</p>
    </div>
  `
}

function buildEmailHtml(opts: {
  clientName: string
  amount: string
  dueDate: string
  emitterName: string
  invoiceNumber: string
  paymentBlock: string
  ibanBlock: string
}): string {
  const { clientName, amount, dueDate, emitterName, invoiceNumber, paymentBlock, ibanBlock } = opts
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:24px;border-radius:12px;margin-bottom:24px;">
        <h1 style="color:white;margin:0;font-size:20px;">Facture ${invoiceNumber}</h1>
      </div>

      <p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Veuillez trouver ci-joint la facture <strong>n°${invoiceNumber}</strong>
        d'un montant total de <strong>${amount} €</strong>.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr>
            <td style="padding:4px 0;">Montant TTC</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#7c3aed;">${amount} €</td>
          </tr>
          <tr>
            <td style="padding:4px 0;">Date d'échéance</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;">${dueDate}</td>
          </tr>
        </table>
      </div>

      ${paymentBlock}
      ${ibanBlock}

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        N'hésitez pas à nous contacter si vous avez la moindre question concernant cette facture.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Bien cordialement,<br/><strong>${emitterName}</strong>
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Email envoyé via FacturNow</p>
    </div>
  `
}
