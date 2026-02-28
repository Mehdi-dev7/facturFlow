import type { ReminderLevel } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReminderEmailData {
  level: ReminderLevel
  clientName: string
  invoiceNumber: string
  amount: string   // déjà formaté "1 250,00"
  dueDate: string  // déjà formaté "15 janvier 2026"
  emitterName: string
  stripePaymentUrl?: string | null
  paypalPaymentUrl?: string | null
}

// ─── Sujet ────────────────────────────────────────────────────────────────────

export function getReminderSubject(level: ReminderLevel, invoiceNumber: string): string {
  switch (level) {
    case "FRIENDLY": return `Rappel de paiement – Facture ${invoiceNumber}`
    case "FIRM":     return `Relance – Facture ${invoiceNumber} impayée`
    case "FORMAL":   return `Mise en demeure – Facture ${invoiceNumber}`
  }
}

// ─── Boutons de paiement (commun aux 3 niveaux) ───────────────────────────────

function buildPaymentButtons(
  stripeUrl: string | null | undefined,
  paypalUrl: string | null | undefined,
  amount: string,
): string {
  if (!stripeUrl && !paypalUrl) return ""
  return `
    <div style="text-align: center; margin: 28px 0;">
      ${stripeUrl ? `
      <a href="${stripeUrl}"
         style="display: inline-block; background-color: #635BFF; color: #ffffff; text-decoration: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 6px; margin: 6px;">
        Payer ${amount} € par carte
      </a>` : ""}
      ${paypalUrl ? `
      <a href="${paypalUrl}"
         style="display: inline-block; background-color: #003087; color: #ffffff; text-decoration: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 6px; margin: 6px;">
        Payer via PayPal
      </a>` : ""}
    </div>
  `
}

// ─── Corps de l'email par niveau ──────────────────────────────────────────────

function buildBody(data: ReminderEmailData, paymentButtons: string): string {
  const { level, clientName, invoiceNumber, amount, dueDate, emitterName } = data

  if (level === "FRIENDLY") {
    // J+2 : ton doux, bienveillant — "peut-être avez-vous oublié"
    return `
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">Bonjour ${clientName},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Nous espérons que vous allez bien. Nous nous permettons de vous rappeler que la facture
        <strong>${invoiceNumber}</strong> d'un montant de <strong>${amount} €</strong>,
        dont la date d'échéance était le <strong>${dueDate}</strong>, n'a pas encore été réglée à ce jour.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Il est possible que ce paiement soit simplement passé entre les mailles du filet.
        Nous vous invitons à en effectuer le règlement dès que possible.
      </p>
      ${paymentButtons}
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Si vous avez déjà procédé au paiement, veuillez ignorer ce message.
        N'hésitez pas à nous contacter si vous avez la moindre question.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Bien cordialement,<br/><strong>${emitterName}</strong>
      </p>
    `
  }

  if (level === "FIRM") {
    // J+7 : ton ferme — demande de règlement sous 48h
    return `
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">Bonjour ${clientName},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Sauf erreur de notre part, la facture <strong>${invoiceNumber}</strong>
        d'un montant de <strong>${amount} €</strong>, échue le <strong>${dueDate}</strong>,
        demeure impayée malgré notre précédent rappel.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Nous vous demandons de bien vouloir régulariser cette situation dans les meilleurs délais,
        et au plus tard sous <strong>48 heures</strong>.
      </p>
      ${paymentButtons}
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Si une difficulté particulière retarde ce règlement, nous vous invitons à nous contacter
        afin de trouver une solution adaptée ensemble.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Dans l'attente de votre règlement,<br/><strong>${emitterName}</strong>
      </p>
    `
  }

  // FORMAL — J+15 : mise en demeure officielle
  return `
    <p style="color: #334155; font-size: 15px; line-height: 1.6;">Madame, Monsieur,</p>
    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
      Malgré nos relances des jours précédents, la facture <strong>${invoiceNumber}</strong>
      d'un montant de <strong>${amount} €</strong>, dont l'échéance était fixée au <strong>${dueDate}</strong>,
      n'a toujours pas été réglée.
    </p>
    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
      Par la présente, nous vous mettons formellement en demeure de procéder au règlement
      de la somme de <strong>${amount} €</strong> dans un délai de <strong>8 jours calendaires</strong>
      à compter de la réception de ce message.
    </p>
    ${paymentButtons}
    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
      À défaut de règlement dans ce délai, nous nous verrons dans l'obligation d'engager
      les procédures de recouvrement appropriées.
    </p>
    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
      Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.<br/>
      <strong>${emitterName}</strong>
    </p>
  `
}

// ─── Génération HTML complète ─────────────────────────────────────────────────

export function getReminderHtml(data: ReminderEmailData): string {
  const { level, invoiceNumber, amount, dueDate } = data

  // Couleur du header selon l'urgence
  const headerGradient: Record<ReminderLevel, string> = {
    FRIENDLY: "linear-gradient(135deg, #7c3aed, #4f46e5)", // violet — neutre
    FIRM:     "linear-gradient(135deg, #d97706, #b45309)", // orange — attentif
    FORMAL:   "linear-gradient(135deg, #dc2626, #991b1b)", // rouge — urgent
  }

  const headerLabel: Record<ReminderLevel, string> = {
    FRIENDLY: "Rappel de paiement",
    FIRM:     "2ème relance",
    FORMAL:   "Mise en demeure",
  }

  const paymentButtons = buildPaymentButtons(data.stripePaymentUrl, data.paypalPaymentUrl, amount)
  const body = buildBody(data, paymentButtons)

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 600px; margin: 0 auto; padding: 24px;">

      <!-- Header coloré selon le niveau -->
      <div style="background: ${headerGradient[level]}; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <p style="color: rgba(255,255,255,0.75); margin: 0 0 4px; font-size: 11px;
                  text-transform: uppercase; letter-spacing: 1px;">
          ${headerLabel[level]}
        </p>
        <h1 style="color: white; margin: 0; font-size: 20px;">Facture ${invoiceNumber}</h1>
      </div>

      <!-- Récap montant / échéance -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
                  padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px; color: #475569;">
          <tr>
            <td style="padding: 4px 0;">Montant TTC</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #dc2626;">
              ${amount} €
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Échéance dépassée depuis le</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${dueDate}</td>
          </tr>
        </table>
      </div>

      <!-- Corps -->
      ${body}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Email envoyé via FacturNow
      </p>
    </div>
  `
}
