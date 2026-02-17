"use server";

// Server action : envoie un email de demande d'acompte via Resend (pas de PDF)

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

export async function sendDepositEmail(depositId: string) {
  // 1. Vérifier la session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 2. Récupérer l'acompte depuis la DB avec client + user
    const doc = await prisma.document.findFirst({
      where: { id: depositId, userId: session.user.id, type: "DEPOSIT" },
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
          },
        },
      },
    });

    if (!doc) {
      return { success: false, error: "Acompte introuvable" };
    }

    // 3. Construire les données pour l'email
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

    // 4. Envoyer l'email HTML simple via Resend
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Demande d'acompte ${doc.number}</h1>
        </div>

        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Bonjour ${clientName},
        </p>

        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          ${emitterName} vous adresse une demande d'acompte d'un montant de <strong>${amount}</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; color: #475569;">
            <tr>
              <td style="padding: 4px 0;">Montant TTC</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #7c3aed;">${amount}</td>
            </tr>
            ${
              dueDate
                ? `<tr>
              <td style="padding: 4px 0;">Date d'échéance</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600;">${dueDate}</td>
            </tr>`
                : ""
            }
          </table>
        </div>

        ${doc.notes ? `<p style="color: #334155; font-size: 15px; line-height: 1.6;"><em>${doc.notes}</em></p>` : ""}

        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          N'hésitez pas à revenir vers nous si vous avez la moindre question.
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
    `;

    const { error } = await resend.emails.send({
      from: `${emitterName} <noreply@resend.dev>`,
      to: [doc.client.email],
      subject: `Demande d'acompte ${doc.number} - ${amount}`,
      html,
    });

    if (error) {
      console.error("[sendDepositEmail] Resend error:", error);
      return { success: false, error: "Erreur d'envoi : " + error.message };
    }

    // 5. Passer le statut à SENT après envoi réussi
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
