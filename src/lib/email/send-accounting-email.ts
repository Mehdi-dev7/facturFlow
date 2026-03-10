// src/lib/email/send-accounting-email.ts
// Envoi mensuel des exports comptables (FEC + journal) au comptable de l'utilisateur.
// Appelé par le cron nightly le 1er de chaque mois.

import { resend } from "@/lib/email/resend";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SendAccountingEmailOptions {
  accountantEmail: string;
  companyName: string;
  monthLabel: string; // ex: "février 2026"
  fecContent: string;
  fecFilename: string;
  journalContent: string;
  journalFilename: string;
  // Optionnel — joint uniquement en janvier
  annualReportPdf?: Buffer;
  annualReportYear?: number;
}

export async function sendAccountingEmail(opts: SendAccountingEmailOptions): Promise<void> {
  const {
    accountantEmail,
    companyName,
    monthLabel,
    fecContent,
    fecFilename,
    journalContent,
    journalFilename,
    annualReportPdf,
    annualReportYear,
  } = opts;

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>";

  const attachments: Array<{ filename: string; content: Buffer }> = [
    { filename: fecFilename, content: Buffer.from(fecContent, "utf-8") },
    { filename: journalFilename, content: Buffer.from(journalContent, "utf-8") },
  ];

  // Rapport annuel PDF en janvier
  if (annualReportPdf && annualReportYear) {
    attachments.push({
      filename: `rapport-annuel-${annualReportYear}.pdf`,
      content: annualReportPdf,
    });
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [accountantEmail],
    subject: `Exports comptables ${monthLabel} — ${companyName}`,
    html: buildHtml({ companyName, monthLabel, includesAnnualReport: !!annualReportPdf }),
    attachments,
  });

  if (error) {
    throw new Error(`[accounting-email] Resend error: ${error.message}`);
  }
}

// ─── Template HTML ───────────────────────────────────────────────────────────

function buildHtml(opts: {
  companyName: string;
  monthLabel: string;
  includesAnnualReport: boolean;
}): string {
  const { companyName, monthLabel, includesAnnualReport } = opts;

  const annualReportLine = includesAnnualReport
    ? `<li><strong>Rapport Annuel PDF</strong> — Synthèse d'activité de l'année écoulée</li>`
    : "";

  const annualReportBanner = includesAnnualReport
    ? `<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="margin:0;color:#5b21b6;font-size:14px;">
          <strong>Bonne année !</strong> Ce mois-ci, vous recevez également le rapport annuel complet en PDF.
        </p>
       </div>`
    : "";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:24px;border-radius:12px;margin-bottom:24px;">
        <h1 style="color:white;margin:0;font-size:20px;">Exports comptables — ${monthLabel}</h1>
      </div>

      <p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour,</p>

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Veuillez trouver ci-joints les exports comptables de <strong>${companyName}</strong>
        pour le mois de <strong>${monthLabel}</strong> :
      </p>

      ${annualReportBanner}

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0;">
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
          <li><strong>FEC</strong> — Fichier des Écritures Comptables (format DGFiP)</li>
          <li><strong>Journal des ventes</strong> — Détail des factures du mois</li>
          ${annualReportLine}
        </ul>
      </div>

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Ces fichiers sont générés automatiquement par FacturNow.
        En cas de question, n'hésitez pas à contacter votre client.
      </p>

      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Cordialement,<br/><strong>FacturNow</strong>
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
      <p style="color:#94a3b8;font-size:12px;text-align:center;">
        Email envoyé automatiquement via FacturNow — exports comptables mensuels
      </p>
    </div>
  `;
}
