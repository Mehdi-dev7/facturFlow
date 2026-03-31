// src/lib/email/send-trial-reminder-email.ts
// Emails liés au cycle de vie du trial Pro :
//  - sendTrialReminderEmail : rappel J-1 avant expiration
//  - sendTrialExpiredEmail  : notification immédiate à l'expiration (mentionne déco paiements J+7)

import { resend } from "@/lib/email/resend"
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>"

// ─── CTA bouton partagé ───────────────────────────────────────────────────────

function ctaButton(label: string, url: string): string {
  return `
  <div style="text-align:center;margin:28px 0;">
    <a
      href="${url}"
      class="ebtn"
      style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;cursor:pointer;"
    >
      ${label}
    </a>
  </div>`
}

// ─── 1. Rappel avant expiration du trial (J-2 ou J-1) ────────────────────────

export interface SendTrialReminderOptions {
  to: string
  userName: string
  daysLeft: number // 1 ou 2
}

export async function sendTrialReminderEmail(opts: SendTrialReminderOptions): Promise<void> {
  const { to, userName, daysLeft } = opts
  const firstName = userName.split(" ")[0]
  const upgradeUrl = `${BASE_URL}/dashboard/subscription`

  const content = `
    ${emailHeader("linear-gradient(135deg, #7c3aed, #4f46e5)", "FacturNow", `Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai Pro`)}

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:12px;">
      Bonjour ${firstName},
    </p>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:12px;">
      Votre essai gratuit Pro se termine dans <strong>${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>.
      Profitez-en pour explorer les dernières fonctionnalités avant la fin de votre période d'essai.
    </p>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:24px;">
      Pour continuer à utiliser <strong>les paiements en ligne</strong> (Stripe, PayPal, GoCardless),
      les <strong>relances automatiques</strong>, les <strong>factures récurrentes</strong>
      et l'apparence personnalisée, passez au plan Pro dès maintenant.
    </p>

    ${ctaButton("Continuer avec Pro — 9,99 €/mois", upgradeUrl)}

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-top:12px;">
      À très bientôt,<br/>
      <strong>L'équipe FacturNow</strong>
    </p>

    ${EMAIL_FOOTER}
  `

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `Votre essai Pro expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — FacturNow`,
    html: wrapEmail(content),
  })

  if (error) {
    throw new Error(`[trial-reminder-email] Resend error: ${error.message}`)
  }
}

// ─── 2. Notification d'expiration du trial ────────────────────────────────────

export interface SendTrialExpiredOptions {
  to: string
  userName: string
}

export async function sendTrialExpiredEmail(opts: SendTrialExpiredOptions): Promise<void> {
  const { to, userName } = opts
  const firstName = userName.split(" ")[0]
  const upgradeUrl = `${BASE_URL}/dashboard/subscription`

  const content = `
    ${emailHeader("linear-gradient(135deg, #dc2626, #7c3aed)", "FacturNow", "Votre essai Pro est terminé")}

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:12px;">
      Bonjour ${firstName},
    </p>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:12px;">
      Votre période d'essai Pro est maintenant terminée. Votre compte est repassé sur le plan <strong>Gratuit</strong>.
    </p>

    <!-- Résumé des restrictions -->
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="color:#991b1b;font-size:14px;font-weight:600;margin:0 0 8px;">Ce qui change :</p>
      <ul style="color:#7f1d1d;font-size:14px;line-height:1.7;margin:0;padding-left:20px;">
        <li>Vos <strong>5 premiers clients</strong> restent accessibles, les autres sont gelés</li>
        <li>Limite de <strong>10 documents par mois</strong></li>
        <li>Vos <strong>paiements en ligne</strong> (Stripe, PayPal, GoCardless) seront déconnectés dans 7 jours si vous ne passez pas au Pro</li>
      </ul>
    </div>

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:24px;">
      Passez au plan Pro pour retrouver immédiatement l'accès à tous vos clients et fonctionnalités sans interruption.
    </p>

    ${ctaButton("Passer au Pro — 9,99 €/mois", upgradeUrl)}

    <p style="color:#334155;font-size:15px;line-height:1.6;margin-top:12px;">
      Merci pour votre confiance,<br/>
      <strong>L'équipe FacturNow</strong>
    </p>

    ${EMAIL_FOOTER}
  `

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Votre essai Pro FacturNow est terminé",
    html: wrapEmail(content),
  })

  if (error) {
    throw new Error(`[trial-expired-email] Resend error: ${error.message}`)
  }
}

