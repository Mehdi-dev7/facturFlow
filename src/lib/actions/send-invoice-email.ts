"use server";

// Server action : envoie la facture par email avec le PDF en pièce jointe via Resend

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument from "@/lib/pdf/invoice-pdf-document";
import type { SavedInvoice } from "@/lib/actions/invoices";
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base";
import { getStripeCredential } from "@/lib/actions/payments";
import { getStripeClient } from "@/lib/stripe";

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
            themeColor: true,
            companyFont: true,
            companyLogo: true,
            // Pour afficher le bloc virement dans l'email
            iban: true,
            bic: true,
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
        companyName: doc.user.companyName || emitterFallback?.companyName || null,
        companySiret: doc.user.companySiret || emitterFallback?.companySiret || null,
        companyAddress: doc.user.companyAddress || emitterFallback?.companyAddress || null,
        companyPostalCode: doc.user.companyPostalCode || emitterFallback?.companyPostalCode || null,
        companyCity: doc.user.companyCity || emitterFallback?.companyCity || null,
        companyEmail: doc.user.companyEmail || emitterFallback?.companyEmail || null,
        companyPhone: doc.user.companyPhone ?? null,
        themeColor: doc.user.themeColor ?? null,
        companyFont: doc.user.companyFont ?? null,
        companyLogo: doc.user.companyLogo ?? null,
        iban: doc.user.iban ?? null,
        bic: doc.user.bic ?? null,
      },
    };

    // 4. Construire les URLs de paiement : uniquement si le provider est connecté
    //    ET si l'utilisateur a activé ce bouton lors de la création de la facture.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr";
    // En dev (localhost), on n'inclut pas les boutons de paiement :
    // les URLs localhost sont un signal spam massif pour Gmail.
    const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

    // Lire les choix de l'utilisateur stockés dans businessMetadata
    const savedPaymentLinks = (invoice.businessMetadata?.paymentLinks ?? {}) as {
      stripe?: boolean;
      paypal?: boolean;
      gocardless?: boolean;
    };

    let stripePaymentUrl: string | null = null;
    let paypalPaymentUrl: string | null = null;
    let sepaPaymentUrl:   string | null = null;

    if (!isLocalhost) {
      // Stripe : uniquement si activé par l'user ET provider connecté
      if (savedPaymentLinks.stripe === true) {
        try {
          const stripeCred = await getStripeCredential(session.user.id);
          if (stripeCred) {
            stripePaymentUrl = `${appUrl}/api/pay/${invoiceId}`;
          }
        } catch (err) {
          console.warn("[sendInvoiceEmail] Stripe check failed:", err);
        }
      }

      // PayPal : uniquement si activé par l'user ET provider connecté
      if (savedPaymentLinks.paypal === true) {
        try {
          const { getPaypalCredential } = await import("@/lib/actions/payments");
          const paypalCred = await getPaypalCredential(session.user.id);
          if (paypalCred) {
            paypalPaymentUrl = `${appUrl}/api/pay-paypal/${invoiceId}`;
          }
        } catch (err) {
          console.warn("[sendInvoiceEmail] PayPal check failed:", err);
        }
      }

      // GoCardless : uniquement si activé par l'user ET provider connecté
      if (savedPaymentLinks.gocardless === true) {
        try {
          const gcAccount = await import("@/lib/prisma").then(({ prisma }) =>
            prisma.paymentAccount.findUnique({
              where: { userId_provider: { userId: session.user.id, provider: "GOCARDLESS" } },
              select: { isActive: true },
            })
          );
          if (gcAccount?.isActive) {
            sepaPaymentUrl = `${appUrl}/api/pay-sepa/${invoiceId}`;
          }
        } catch (err) {
          console.warn("[sendInvoiceEmail] GoCardless check failed:", err);
        }
      }
    }

    // 5. Générer le PDF en buffer (renderToBuffer = API serveur de @react-pdf/renderer)
    const pdfBuffer = await renderToBuffer(InvoicePdfDocument({ invoice }));

    // 6. Construire le nom du client pour le mail
    const clientName = doc.client.companyName
      ?? ([doc.client.firstName, doc.client.lastName].filter(Boolean).join(" ") || doc.client.email);

    const amount = invoice.total.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const dueDate = doc.dueDate
      ? new Date(doc.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
      : "—";

    const emitterName = invoice.user.companyName ?? "FacturNow";

    // 7. Envoyer l'email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>"
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [doc.client.email],
      subject: `Facture ${doc.number} – PDF ci-joint`,
      html: wrapEmail(`
        ${emailHeader("linear-gradient(135deg, #7c3aed, #4f46e5)", "", `Facture ${doc.number}`)}

        <p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>

        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Veuillez trouver ci-joint la facture <strong>n°${doc.number}</strong> d'un montant total de <strong>${amount} €</strong>.
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

        ${stripePaymentUrl || paypalPaymentUrl || sepaPaymentUrl ? `
        <div style="text-align:center;margin:32px 0;">
          ${stripePaymentUrl ? `
          <a href="${stripePaymentUrl}" class="ebtn"
             style="display:inline-block;background-color:#635BFF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;margin:6px;">
            Payer ${amount} € par CB
          </a>
          <p style="color:#6b7280;font-size:12px;margin-top:6px;">
            Paiement sécurisé par <strong style="color:#635BFF;">Stripe</strong> &nbsp;·&nbsp; CB, Apple Pay, Google Pay
          </p>
          ` : ""}
          ${paypalPaymentUrl ? `
          <a href="${paypalPaymentUrl}" class="ebtn"
             style="display:inline-block;background-color:#003087;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;margin:6px;">
            Payer ${amount} € via PayPal
          </a>
          <p style="color:#6b7280;font-size:12px;margin-top:6px;">
            Paiement sécurisé par <strong style="color:#003087;">PayPal</strong>
          </p>
          ` : ""}
          ${sepaPaymentUrl ? `
          <a href="${sepaPaymentUrl}" class="ebtn"
             style="display:inline-block;background-color:#0854b3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;margin:6px;">
            Autoriser le prélèvement SEPA
          </a>
          <p style="color:#6b7280;font-size:12px;margin-top:6px;">
            Prélèvement sécurisé via <strong style="color:#0854b3;">GoCardless</strong> &nbsp;·&nbsp; Délai 2–5 jours ouvrés
          </p>
          ` : ""}
        </div>
        ` : ""}

        ${invoice.user.iban ? `
        <div style="margin:20px 0;padding:16px;background:#f8f7ff;border-left:4px solid #7c3aed;border-radius:4px;">
          <p style="margin:0 0 8px;font-weight:600;color:#7c3aed;">Paiement par virement bancaire</p>
          <p style="margin:0;font-size:14px;color:#374151;">IBAN : ${invoice.user.iban}</p>
          ${invoice.user.bic ? `<p style="margin:4px 0 0;font-size:14px;color:#374151;">BIC : ${invoice.user.bic}</p>` : ""}
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Référence : ${invoice.number ?? ""}</p>
        </div>
        ` : ""}

        <p style="color:#334155;font-size:15px;line-height:1.6;">
          N'hésitez pas à revenir vers nous si vous avez la moindre question concernant cette facture.
        </p>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Nous vous remercions par avance pour votre règlement.
        </p>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Bien cordialement,<br/><strong>${emitterName}</strong>
        </p>

        ${EMAIL_FOOTER}
      `),
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

    // 8. Passer le statut à SENT après envoi réussi (si pas déjà PAID)
    if (doc.status !== "PAID") {
      await prisma.document.update({
        where: { id: invoiceId },
        data: { status: "SENT" },
      });
      revalidatePath("/dashboard/invoices");
    }

    return { success: true };
  } catch (err) {
    console.error("[sendInvoiceEmail] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi de l'email" };
  }
}
