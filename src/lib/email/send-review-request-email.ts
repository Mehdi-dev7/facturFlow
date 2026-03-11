// src/lib/email/send-review-request-email.ts
// Envoie l'email de demande d'avis client 7 jours après l'inscription.

import { resend } from "@/lib/email/resend"
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>"

export interface SendReviewRequestOptions {
  to: string           // email de l'utilisateur
  userName: string     // prénom ou nom complet
  token: string        // token unique lié au Review en DB
}

/**
 * Envoie l'email de demande d'avis avec un lien unique.
 * Le lien pointe vers /avis/{token} (page publique).
 */
export async function sendReviewRequestEmail(opts: SendReviewRequestOptions): Promise<void> {
  const { to, userName, token } = opts

  const reviewUrl = `${BASE_URL}/avis/${token}`
  const firstName = userName.split(" ")[0] // on utilise juste le prénom

  const content = `
    ${emailHeader("linear-gradient(135deg, #7c3aed, #4f46e5)", "FacturNow", "Votre avis compte pour nous")}

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:12px;">
      Bonjour ${firstName},
    </p>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:12px;">
      Cela fait maintenant une semaine que vous utilisez FacturNow. Nous espérons que votre expérience est à la hauteur de vos attentes !
    </p>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:24px;">
      Votre avis est précieux pour nous aider à améliorer l'application et à aider d'autres freelances et entrepreneurs à se décider. Cela ne prend que 30 secondes.
    </p>

    <!-- Bouton principal -->
    <div style="text-align:center;margin:28px 0;">
      <a
        href="${reviewUrl}"
        class="ebtn"
        style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;cursor:pointer;"
      >
        ⭐ Donner mon avis
      </a>
      <p style="color:#94a3b8;font-size:12px;margin-top:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        Lien unique — 30 secondes suffisent
      </p>
    </div>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-top:12px;">
      Merci pour votre confiance,<br/>
      <strong>L'équipe FacturNow</strong>
    </p>

    ${EMAIL_FOOTER}
  `

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Comment s'est passé votre expérience avec FacturNow ?",
    html: wrapEmail(content),
  })

  if (error) {
    throw new Error(`[review-email] Resend error: ${error.message}`)
  }
}
