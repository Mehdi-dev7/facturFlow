// src/lib/email/email-base.ts
// Helper partagé : styles responsives + wrappers communs à tous les emails FacturNow.
// Principe : classes CSS via <style> + !important pour surcharger les inline styles sur mobile.

/** Bloc <style> injecté en tête de chaque email — compatible Gmail mobile, Apple Mail, Outlook iOS. */
const EMAIL_STYLES = `
<style>
  @media only screen and (max-width: 480px) {
    /* Réduction du padding extérieur sur petits écrans */
    .ew { padding: 8px !important; }
    /* Header : padding et radius réduits */
    .eh { padding: 16px !important; border-radius: 8px !important; }
    /* Titre (n° facture) : taille réduite + pas de retour à la ligne */
    .eh1 { font-size: 15px !important; }
    /* Boutons de paiement : pleine largeur, empilés */
    .ebtn {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      text-align: center !important;
      margin: 8px 0 !important;
    }
  }
</style>
`

/**
 * Enveloppe le contenu HTML d'un email dans le wrapper responsive.
 * Ajoute le <style>, le max-width 600px et le padding adaptatif.
 */
export function wrapEmail(content: string): string {
  return `${EMAIL_STYLES}
<div class="ew" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:16px;">
  ${content}
</div>`
}

/**
 * Génère le header coloré commun (gradient + titre).
 * @param gradient  Valeur CSS du background (ex: "linear-gradient(135deg, #7c3aed, #4f46e5)")
 * @param label     Petit label au-dessus du titre (peut être "")
 * @param title     Titre principal (ex: "Facture FAC-2025-0001")
 */
export function emailHeader(gradient: string, label: string, title: string): string {
  return `
<div class="eh" style="background:${gradient};padding:24px;border-radius:12px;margin-bottom:24px;">
  ${label ? `<p style="color:rgba(255,255,255,0.75);margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">${label}</p>` : ""}
  <h1 class="eh1" style="color:white;margin:0;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</h1>
</div>`
}

/** Footer standard en bas de chaque email. */
export const EMAIL_FOOTER = `
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
<p style="color:#94a3b8;font-size:12px;text-align:center;">Email envoyé via FacturNow</p>
`
