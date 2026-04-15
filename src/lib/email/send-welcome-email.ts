// src/lib/email/send-welcome-email.ts
// Email de bienvenue envoyé automatiquement à la première inscription.
// Ton chaleureux et humain : app fraîche, appel aux beta-testeurs, offre Fondateur.

import { resend } from "@/lib/email/resend"
import { wrapEmail, EMAIL_FOOTER } from "@/lib/email/email-base"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>"

export interface SendWelcomeEmailParams {
  to: string
  name: string
}

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams): Promise<void> {
  const firstName = name.split(" ")[0]
  const dashboardUrl = `${BASE_URL}/dashboard`
  const feedbackEmail = "mehdi@facturnow.fr"

  const html = wrapEmail(`
    <!-- ── Header avec rocket ──────────────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 50%,#4f46e5 100%);border-radius:14px;padding:36px 28px;text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">🚀</div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;line-height:1.3;">
        Bienvenue sur FacturNow, ${firstName} !
      </h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;line-height:1.5;">
        Votre essai Pro de 7 jours est activé — tout est inclus, rien à configurer.
      </p>
    </div>

    <!-- ── Message d'intro ──────────────────────────────────────────────── -->
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Hey ${firstName} 👋<br/><br/>
      Je suis Mehdi, le créateur de FacturNow. Merci d'avoir créé votre compte —
      vous faites partie des tout premiers utilisateurs de l'app et ça compte beaucoup pour moi.
    </p>

    <!-- ── Bloc "app fraîche" ─────────────────────────────────────────── -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <p style="font-size:14px;font-weight:700;color:#15803d;margin:0 0 6px;">
        🌱 FacturNow est tout frais !
      </p>
      <p style="font-size:13px;color:#166534;line-height:1.6;margin:0;">
        L'app est récente, elle fonctionnel et pleinement opérationnelle — mais comme tout produit
        en démarrage, elle peut avoir quelques aspérités. Vous avez une vision unique
        pour m'aider à l'améliorer.
      </p>
    </div>

    <!-- ── Appel aux beta-testeurs ───────────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border:1px solid #c4b5fd;border-radius:10px;padding:20px;margin-bottom:20px;">
      <p style="font-size:14px;font-weight:700;color:#5b21b6;margin:0 0 10px;">
        🐛 Vous trouvez un bug ? Dites-le moi directement
      </p>
      <p style="font-size:13px;color:#6b21a8;line-height:1.6;margin:0 0 14px;">
        Pas de formulaire compliqué — envoyez-moi un email, une capture d'écran, ou même
        juste deux lignes. Chaque retour est précieux et je réponds personnellement.
      </p>
      <a href="mailto:${feedbackEmail}?subject=Bug%20FacturNow&body=Bonjour%20Mehdi%2C%0A%0AJ'ai%20remarqu%C3%A9%20un%20probl%C3%A8me%20..."
         style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">
        Signaler un bug ou une idée →
      </a>
    </div>

    <!-- ── Offre Fondateur ────────────────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #f59e0b;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
        Offre Fondateur — 30 premiers inscrits
      </p>
      <p style="font-size:28px;font-weight:800;color:#7c3aed;margin:0 0 4px;">
        6,99€<span style="font-size:15px;font-weight:400;color:#6b7280;">/mois</span>
      </p>
      <p style="font-size:12px;color:#92400e;margin:0 0 12px;">
        À vie · Prix bloqué quelles que soient les évolutions futures
      </p>
      <p style="font-size:13px;color:#78350f;line-height:1.5;margin:0 0 14px;">
        En tant qu'early adopter, vous pouvez bénéficier du tarif Fondateur à <strong>6,99€/mois à vie</strong>
        au lieu de 9,99€/mois. C'est ma façon de remercier ceux qui font confiance au projet dès le début.
      </p>
      <a href="${BASE_URL}/dashboard/subscription?coupon=FONDATEUR"
         style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">
        Activer l'offre Fondateur →
      </a>
    </div>

    <!-- ── Ce que vous pouvez faire maintenant ───────────────────────── -->
    <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 10px;">Que faire avec vos 7 jours Pro ?</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ["📄", "Créez votre première facture en moins de 2 minutes"],
        ["💳", "Connectez Stripe, PayPal ou GoCardless (SEPA)"],
        ["🔁", "Configurez une facture récurrente automatique"],
        ["📊", "Visualisez votre CA dans les statistiques"],
        ["⚡", "Testez les relances automatiques (3 niveaux)"],
      ]
        .map(
          ([icon, text]) => `
        <tr>
          <td width="28" style="padding:5px 0;vertical-align:top;">
            <span style="font-size:15px;">${icon}</span>
          </td>
          <td style="padding:5px 0;font-size:13px;color:#4b5563;line-height:1.5;">
            ${text}
          </td>
        </tr>`
        )
        .join("")}
    </table>

    <!-- ── CTA principal ─────────────────────────────────────────────── -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${dashboardUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
        Accéder à mon dashboard →
      </a>
    </div>

    <!-- ── Signature ─────────────────────────────────────────────────── -->
    <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0;">
      À très vite,<br/>
      <strong style="color:#374151;">Mehdi</strong><br/>
      <span style="font-size:12px;color:#9ca3af;">Créateur de FacturNow</span>
    </p>

    ${EMAIL_FOOTER}
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `Bienvenue sur FacturNow, ${firstName} ! 🚀 Votre essai Pro est activé`,
    html,
  })

  if (error) {
    // Ne jamais bloquer l'inscription si l'email échoue
    console.error("[welcome-email] Resend error:", error)
  }
}
