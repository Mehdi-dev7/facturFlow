"use server";

// Server Action : envoie le message de contact via Resend
// → 1 email à support@facturnow.fr avec le message du user
// → 1 email de confirmation au user

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";

// ─── Schema de validation ─────────────────────────────────────────────────────

const contactSchema = z.object({
  subject: z.enum(["question", "bug", "billing", "suggestion", "other"], {
    error: "Veuillez choisir un sujet",
  }),
  message: z.string().min(20, "Le message doit faire au moins 20 caractères").max(2000),
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Nom requis").max(100),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Labels lisibles pour l'email
const SUBJECT_LABELS: Record<ContactFormData["subject"], string> = {
  question: "Question générale",
  bug: "Bug technique",
  billing: "Facturation / Abonnement",
  suggestion: "Suggestion d'amélioration",
  other: "Autre",
};

// ─── Server Action ────────────────────────────────────────────────────────────

export async function sendContactEmail(data: ContactFormData) {
  // Vérification session (optionnel mais recommandé pour éviter le spam)
  const session = await auth.api.getSession({ headers: await headers() });

  // Validation Zod
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", details: parsed.error.issues };
  }

  const { subject, message, email, name } = parsed.data;
  const subjectLabel = SUBJECT_LABELS[subject];
  const userId = session?.user?.id ?? "non connecté";

  try {
    // ── Email interne → support FacturNow ──────────────────────────────────
    await resend.emails.send({
      from: "FacturNow Support <noreply@facturnow.fr>",
      to: ["support@facturnow.fr"],
      replyTo: email,
      subject: `[Support] ${subjectLabel} — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-bottom: 4px;">Nouveau message de support</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 0;">FacturNow — Formulaire de contact</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

          <table style="width: 100%; font-size: 14px; color: #374151; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; width: 120px;">Nom</td>
              <td style="padding: 6px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${email}" style="color: #7c3aed;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Sujet</td>
              <td style="padding: 6px 0;">${subjectLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">User ID</td>
              <td style="padding: 6px 0; color: #9ca3af; font-size: 12px;">${userId}</td>
            </tr>
          </table>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
            <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 8px 0;">Message :</p>
            <p style="font-size: 15px; color: #111827; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
        </div>
      `,
    });

    // ── Email de confirmation → utilisateur ──────────────────────────────────
    await resend.emails.send({
      from: "FacturNow Support <noreply@facturnow.fr>",
      to: [email],
      subject: "Votre message a bien été reçu — FacturNow",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-bottom: 4px;">Message reçu !</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 0;">Merci de nous avoir contacté, ${name}.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

          <p style="font-size: 15px; color: #374151;">
            Nous avons bien reçu votre message concernant <strong>${subjectLabel}</strong>.
            Notre équipe vous répondra dans les <strong>24h ouvrées</strong>.
          </p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 8px 0;">Votre message :</p>
            <p style="font-size: 14px; color: #6b7280; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>

          <p style="font-size: 13px; color: #9ca3af;">
            Si votre question est urgente, vous pouvez aussi nous écrire directement à
            <a href="mailto:support@facturnow.fr" style="color: #7c3aed;">support@facturnow.fr</a>.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("[sendContactEmail]", error);
    return { success: false, error: "Échec de l'envoi du message. Réessayez plus tard." };
  }
}
