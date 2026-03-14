"use server";

// Server action : envoie un email de demande d'acompte via Resend
// Inclut les boutons de paiement selon les choix faits à la création (businessMetadata.paymentLinks)

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base";
import { getStripeCredential } from "@/lib/actions/payments";

// sendDepositEmail accepte un userId optionnel pour les appels internes (route token publique)
// Si userId n'est pas fourni, on vérifie la session (appel depuis le dashboard)
export async function sendDepositEmail(depositId: string, userId?: string) {
  // 1. Résoudre l'userId — session OU paramètre direct (appels internes)
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    resolvedUserId = session.user.id;
  }

  try {
    // 2. Récupérer l'acompte depuis la DB avec client + user + infos bancaires
    const doc = await prisma.document.findFirst({
      where: { id: depositId, userId: resolvedUserId, type: "DEPOSIT" },
      include: {
        client: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        user: {
          select: {
            companyName: true,
            companyEmail: true,
            iban: true,
            bic: true,
          },
        },
      },
    });

    if (!doc) {
      return { success: false, error: "Acompte introuvable" };
    }

    // Récupérer le numéro du devis source (si acompte lié à un devis)
    let relatedQuoteNumber: string | null = null;
    if (doc.relatedDocumentId) {
      const relatedDoc = await prisma.document.findFirst({
        where: { id: doc.relatedDocumentId, type: "QUOTE" },
        select: { number: true },
      });
      relatedQuoteNumber = relatedDoc?.number ?? null;
    }

    // 3. Construire les données de base
    const clientName =
      doc.client.companyName ??
      (`${doc.client.firstName ?? ""} ${doc.client.lastName ?? ""}`.trim() ||
      doc.client.email);

    const emitterName = doc.user.companyName ?? "Votre prestataire";

    const amount =
      Number(doc.total).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €";

    const dueDate = doc.dueDate
      ? new Date(doc.dueDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

    // 4. Boutons de paiement : lire les choix stockés dans businessMetadata
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr";
    const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

    const metadata = doc.businessMetadata as Record<string, unknown> | null;
    const savedPaymentLinks = (metadata?.paymentLinks ?? {}) as {
      stripe?: boolean;
      paypal?: boolean;
      gocardless?: boolean;
    };

    let stripePaymentUrl: string | null = null;
    let paypalPaymentUrl: string | null = null;
    let sepaPaymentUrl: string | null = null;

    if (!isLocalhost) {
      if (savedPaymentLinks.stripe === true) {
        try {
          const stripeCred = await getStripeCredential(resolvedUserId);
          if (stripeCred) {
            stripePaymentUrl = `${appUrl}/api/pay/${depositId}`;
          }
        } catch (err) {
          console.warn("[sendDepositEmail] Stripe check failed:", err);
        }
      }

      if (savedPaymentLinks.paypal === true) {
        try {
          const { getPaypalCredential } = await import("@/lib/actions/payments");
          const paypalCred = await getPaypalCredential(resolvedUserId);
          if (paypalCred) {
            paypalPaymentUrl = `${appUrl}/api/pay-paypal/${depositId}`;
          }
        } catch (err) {
          console.warn("[sendDepositEmail] PayPal check failed:", err);
        }
      }

      if (savedPaymentLinks.gocardless === true) {
        try {
          const gcAccount = await prisma.paymentAccount.findUnique({
            where: { userId_provider: { userId: resolvedUserId, provider: "GOCARDLESS" } },
            select: { isActive: true },
          });
          if (gcAccount?.isActive) {
            sepaPaymentUrl = `${appUrl}/api/pay-sepa/${depositId}`;
          }
        } catch (err) {
          console.warn("[sendDepositEmail] GoCardless check failed:", err);
        }
      }
    }

    // 5. Construire et envoyer l'email
    const html = wrapEmail(`
      ${emailHeader("linear-gradient(135deg, #7c3aed, #4f46e5)", "", `Demande d'acompte ${doc.number}`)}

      <p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        ${emitterName} vous adresse une demande d'acompte d'un montant de <strong>${amount}</strong>${relatedQuoteNumber ? `, suite à l'acceptation du devis <strong>${relatedQuoteNumber}</strong>` : ""}.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr>
            <td style="padding:4px 0;">Référence acompte</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;">${doc.number}</td>
          </tr>
          ${relatedQuoteNumber ? `<tr>
            <td style="padding:4px 0;">Devis associé</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;">${relatedQuoteNumber}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:4px 0;">Montant TTC</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#7c3aed;">${amount}</td>
          </tr>
          ${dueDate ? `<tr>
            <td style="padding:4px 0;">Date d'échéance</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;">${dueDate}</td>
          </tr>` : ""}
        </table>
      </div>

      ${doc.notes ? `<p style="color:#334155;font-size:15px;line-height:1.6;"><em>${doc.notes}</em></p>` : ""}

      ${stripePaymentUrl || paypalPaymentUrl || sepaPaymentUrl ? `
      <div style="text-align:center;margin:32px 0;">
        ${stripePaymentUrl ? `
        <a href="${stripePaymentUrl}" class="ebtn"
           style="display:inline-block;background-color:#635BFF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;margin:6px;">
          Payer ${amount} par CB
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:6px;">
          Paiement sécurisé par <strong style="color:#635BFF;">Stripe</strong> &nbsp;·&nbsp; CB, Apple Pay, Google Pay
        </p>
        ` : ""}
        ${paypalPaymentUrl ? `
        <a href="${paypalPaymentUrl}" class="ebtn"
           style="display:inline-block;background-color:#003087;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;margin:6px;">
          Payer ${amount} via PayPal
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

      ${doc.user.iban ? `
      <div style="margin:20px 0;padding:16px;background:#f8f7ff;border-left:4px solid #7c3aed;border-radius:4px;">
        <p style="margin:0 0 8px;font-weight:600;color:#7c3aed;">Paiement par virement bancaire</p>
        <p style="margin:0;font-size:14px;color:#374151;">IBAN : ${doc.user.iban}</p>
        ${doc.user.bic ? `<p style="margin:4px 0 0;font-size:14px;color:#374151;">BIC : ${doc.user.bic}</p>` : ""}
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Référence : ${doc.number}</p>
      </div>
      ` : ""}

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        N'hésitez pas à revenir vers nous si vous avez la moindre question.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Bien cordialement,<br/><strong>${emitterName}</strong>
      </p>

      ${EMAIL_FOOTER}
    `);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? `${emitterName} <noreply@facturnow.fr>`,
      to: [doc.client.email],
      subject: `Demande d'acompte ${doc.number} - ${amount}`,
      html,
    });

    if (error) {
      console.error("[sendDepositEmail] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    // 6. Passer le statut à SENT après envoi réussi
    if (doc.status !== "PAID") {
      await prisma.document.update({
        where: { id: depositId },
        data: { status: "SENT" },
      });
      revalidatePath("/dashboard/acomptes");
    }

    return { success: true };
  } catch (err) {
    console.error("[sendDepositEmail] Exception:", err);
    return { success: false, error: "Erreur lors de l'envoi de l'email" };
  }
}
