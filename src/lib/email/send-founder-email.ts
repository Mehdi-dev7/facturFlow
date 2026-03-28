// src/lib/email/send-founder-email.ts
// Email envoyé automatiquement aux utilisateurs qui souscrivent avec le coupon Fondateur.
// Design premium amber/violet cohérent avec la charte FacturNow.

import { resend } from "@/lib/email/resend";
import { wrapEmail } from "@/lib/email/email-base";

interface SendFounderEmailParams {
  to: string;
  name: string;
  founderNumber?: number; // Numéro de fondateur (1-50), optionnel
}

export async function sendFounderEmail({ to, name, founderNumber }: SendFounderEmailParams) {
  const firstName = name.split(" ")[0];
  const founderBadge = founderNumber ? `#${founderNumber}` : "";

  // Fonctionnalités listées dans l'email de confirmation
  const features = [
    "Documents & clients illimités",
    "Stripe · PayPal · GoCardless SEPA",
    "Relances automatiques (3 niveaux)",
    "Factures récurrentes",
    "Statistiques & export CSV",
  ];

  const html = wrapEmail(`
    <!-- Header premium violet -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#1d4ed8 100%);border-radius:12px;padding:32px 24px;text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">⭐</div>
      ${founderBadge ? `<div style="display:inline-block;background:#f59e0b;color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:12px;">Fondateur ${founderBadge}</div><br/>` : ""}
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">Bienvenue parmi les Fondateurs FacturNow</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Vous faites partie des premiers à nous faire confiance.</p>
    </div>

    <!-- Corps -->
    <p style="font-size:16px;color:#374151;margin:0 0 16px;">Bonjour ${firstName},</p>

    <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 24px;">
      Votre abonnement Fondateur est actif. En tant que membre fondateur, vous bénéficiez du tarif
      <strong style="color:#7c3aed;">6,99€/mois à vie</strong>,
      quelles que soient les évolutions tarifaires futures de FacturNow.
    </p>

    <!-- Card tarif amber -->
    <div style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border:1px solid #f59e0b;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Votre tarif Fondateur</p>
      <p style="font-size:32px;font-weight:800;color:#7c3aed;margin:0 0 4px;">6,99€<span style="font-size:16px;font-weight:400;color:#6b7280;">/mois</span></p>
      <p style="font-size:12px;color:#92400e;margin:0;">À vie · Valable sur le plan Pro</p>
    </div>

    <!-- Ce qui est inclus -->
    <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 12px;">Ce qui est inclus dans votre plan Pro :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${features
        .map(
          (f) => `
        <tr>
          <td style="padding:5px 0;font-size:13px;color:#4b5563;">
            <span style="color:#10b981;font-weight:bold;margin-right:8px;">✓</span>${f}
          </td>
        </tr>`
        )
        .join("")}
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr"}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
        Accéder à mon dashboard →
      </a>
    </div>

    <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
      Merci de votre confiance. Une question ?
      <a href="mailto:support@facturnow.fr" style="color:#7c3aed;">support@facturnow.fr</a>
    </p>
  `);

  return resend.emails.send({
    from: "FacturNow <noreply@facturnow.fr>",
    to,
    subject: `⭐ Bienvenue Fondateur${founderBadge ? ` ${founderBadge}` : ""} — votre tarif 6,99€/mois à vie est activé`,
    html,
  });
}
