// src/app/api/cron/send-accounting-emails/route.ts
// Envoi mensuel du FEC + journal au comptable — s'exécute uniquement le 1er du mois.
// En janvier : ajoute le rapport annuel PDF de l'année précédente.
// Appelé par le cron nightly orchestrateur.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/feature-gate";
import { sendAccountingEmail } from "@/lib/email/send-accounting-email";
import { renderToBuffer } from "@react-pdf/renderer";
import RapportAnnuelPdfDocument from "@/lib/pdf/accounting/rapport-annuel-pdf-document";
import type { AnnualReportPdfData } from "@/lib/actions/accounting";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Helpers (reproduits depuis accounting.ts pour éviter l'import de Server Actions) ──

const BOM = "\uFEFF";

function fmtNum(val: number): string {
  return val.toFixed(2).replace(".", ",");
}

function fecDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function frDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", SENT: "Envoyée", VIEWED: "Vue", PAID: "Payée",
  OVERDUE: "En retard", REMINDED: "Relancée", CANCELLED: "Annulée", SEPA_PENDING: "SEPA en cours",
};

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Virement", STRIPE: "Carte bancaire",
  PAYPAL: "PayPal", GOCARDLESS: "Prélèvement SEPA",
};

// ─── Génère les données du rapport annuel (sans auth — usage interne cron) ───

async function buildAnnualReportData(
  userId: string,
  companyName: string | null,
  companySiren: string | null,
  year: number
): Promise<AnnualReportPdfData> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const docs = await prisma.document.findMany({
    where: {
      userId,
      type: { in: ["INVOICE", "CREDIT_NOTE"] },
      status: { not: "DRAFT" },
      date: { gte: startDate, lte: endDate },
    },
    include: {
      client: { select: { companyName: true, firstName: true, lastName: true, id: true } },
    },
  });

  const invoices = docs.filter((d) => d.type === "INVOICE");
  const creditNotes = docs.filter((d) => d.type === "CREDIT_NOTE");
  const paidInvoices = invoices.filter((d) => d.status === "PAID");

  const caHT = paidInvoices.reduce((s, d) => s + Number(d.subtotal), 0);
  const caTTC = paidInvoices.reduce((s, d) => s + Number(d.total), 0);
  const tvaCollectee = paidInvoices.reduce((s, d) => s + Number(d.taxTotal), 0);
  const avoirsTotal = creditNotes.reduce((s, d) => s + Number(d.total), 0);
  const tauxEncaissement = invoices.length > 0
    ? Math.round((paidInvoices.length / invoices.length) * 100)
    : 0;

  const clientMap = new Map<string, { name: string; total: number }>();
  for (const inv of paidInvoices) {
    if (!inv.client) continue;
    const name = inv.client.companyName
      || [inv.client.firstName, inv.client.lastName].filter(Boolean).join(" ")
      || "Inconnu";
    const existing = clientMap.get(inv.clientId);
    if (existing) existing.total += Number(inv.total);
    else clientMap.set(inv.clientId, { name, total: Number(inv.total) });
  }

  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const mInvoices = paidInvoices.filter((inv) => new Date(inv.date).getMonth() === i);
    return {
      month: format(new Date(year, i, 1), "MMM yyyy", { locale: fr }),
      caHT: mInvoices.reduce((s, d) => s + Number(d.subtotal), 0),
      caTTC: mInvoices.reduce((s, d) => s + Number(d.total), 0),
      count: mInvoices.length,
    };
  });

  return {
    year,
    companyName,
    companySiren,
    caHT,
    caTTC,
    tvaCollectee,
    invoiceCount: invoices.length,
    paidCount: paidInvoices.length,
    creditNoteCount: creditNotes.length,
    avoirsTotal,
    caNet: caTTC - avoirsTotal,
    tauxEncaissement,
    topClient: [...clientMap.values()].sort((a, b) => b.total - a.total)[0] ?? null,
    monthlyBreakdown,
    generatedAt: frDate(new Date()),
  };
}

// ─── Logique principale ──────────────────────────────────────────────────────

export async function runSendAccountingEmails(): Promise<{ sent: number; skipped: string }> {
  const now = new Date();

  // Ne s'exécute que le 1er du mois
  if (now.getDate() !== 1) {
    return { sent: 0, skipped: "Pas le 1er du mois" };
  }

  // Mois précédent
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const monthLabel = format(new Date(prevYear, prevMonth, 1), "MMMM yyyy", { locale: fr });

  // En janvier : on joint aussi le rapport annuel de l'année précédente
  const isJanuary = now.getMonth() === 0;

  // Trouver tous les users BUSINESS avec un accountantEmail
  const users = await prisma.user.findMany({
    where: {
      accountantEmail: { not: null },
    },
    select: {
      id: true,
      plan: true,
      trialEndsAt: true,
      email: true,
      grantedPlan: true,
      companyName: true,
      companySiren: true,
      companySiret: true,
      accountantEmail: true,
    },
  });

  let sent = 0;

  for (const user of users) {
    // Vérifier que le user est bien BUSINESS
    const effectivePlan = getEffectivePlan(user);
    if (effectivePlan !== "BUSINESS") continue;
    if (!user.accountantEmail) continue;

    try {
      const startDate = new Date(prevYear, prevMonth, 1);
      const endDate = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59);

      // ─── Générer le FEC du mois ──────────────────────────────────────────

      const fecDocs = await prisma.document.findMany({
        where: {
          userId: user.id,
          type: { in: ["INVOICE", "CREDIT_NOTE"] },
          status: { not: "DRAFT" },
          date: { gte: startDate, lte: endDate },
        },
        include: {
          client: {
            select: { companyName: true, companySiret: true, firstName: true, lastName: true, id: true },
          },
        },
        orderBy: { date: "asc" },
      });

      const fecColumns = [
        "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
        "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
        "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
        "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
      ];
      const fecRows: string[] = [fecColumns.join("\t")];

      for (const doc of fecDocs) {
        const clientName = doc.client?.companyName
          || [doc.client?.firstName, doc.client?.lastName].filter(Boolean).join(" ")
          || "Client inconnu";
        const clientRef = doc.client?.companySiret || doc.client?.id || "";
        const docNumber = doc.number ?? "";
        const docDate = fecDate(new Date(doc.date));
        const isCredit = doc.type === "CREDIT_NOTE";
        const label = isCredit ? `Avoir ${docNumber} - ${clientName}` : `Facture ${docNumber} - ${clientName}`;
        const ht = Number(doc.subtotal);
        const tva = Number(doc.taxTotal);
        const ttc = Number(doc.total);

        // Débit client
        fecRows.push(["VE", "Journal des ventes", docNumber, docDate, "411000", "Clients",
          clientRef, clientName, docNumber, docDate, label,
          isCredit ? "" : fmtNum(ttc), isCredit ? fmtNum(ttc) : "",
          "", "", docDate, fmtNum(ttc), "EUR"].join("\t"));

        // Crédit ventes
        fecRows.push(["VE", "Journal des ventes", docNumber, docDate, "701000", "Ventes de services",
          "", "", docNumber, docDate, label,
          isCredit ? fmtNum(ht) : "", isCredit ? "" : fmtNum(ht),
          "", "", docDate, fmtNum(ht), "EUR"].join("\t"));

        // Crédit TVA
        if (tva > 0) {
          fecRows.push(["VE", "Journal des ventes", docNumber, docDate, "445710", "TVA collectée",
            "", "", docNumber, docDate, label,
            isCredit ? fmtNum(tva) : "", isCredit ? "" : fmtNum(tva),
            "", "", docDate, fmtNum(tva), "EUR"].join("\t"));
        }
      }

      const siren = user.companySiren || user.companySiret?.slice(0, 9) || "000000000";
      const fecFilename = `FEC_${siren}_${fecDate(startDate)}.txt`;
      const fecContent = BOM + fecRows.join("\n");

      // ─── Générer le journal mensuel ───────────────────────────────────────

      const journalDocs = await prisma.document.findMany({
        where: {
          userId: user.id,
          type: "INVOICE",
          status: { not: "DRAFT" },
          date: { gte: startDate, lte: endDate },
        },
        include: {
          client: { select: { companyName: true, firstName: true, lastName: true } },
        },
        orderBy: { date: "asc" },
      });

      const journalHeader = "Date;N° Facture;Client;Montant HT;TVA;Total TTC;Statut;Mode de paiement";
      const journalRows = journalDocs.map((inv) => {
        const clientName = inv.client?.companyName
          || [inv.client?.firstName, inv.client?.lastName].filter(Boolean).join(" ") || "—";
        const status = STATUS_LABELS[inv.status] ?? inv.status;
        const payment = inv.paymentMethod ? (PAYMENT_LABELS[inv.paymentMethod] ?? inv.paymentMethod) : "—";
        return [
          frDate(new Date(inv.date)), inv.number ?? "—", clientName,
          fmtNum(Number(inv.subtotal)), fmtNum(Number(inv.taxTotal)), fmtNum(Number(inv.total)),
          status, payment,
        ].join(";");
      });

      const mName = format(new Date(prevYear, prevMonth, 1), "MMMM-yyyy", { locale: fr });
      const journalFilename = `journal-${mName}.csv`;
      const journalContent = BOM + [journalHeader, ...journalRows].join("\n");

      // ─── Rapport annuel PDF (janvier uniquement) ──────────────────────────

      let annualReportPdf: Buffer | undefined;
      if (isJanuary) {
        try {
          const siren = user.companySiren || user.companySiret?.slice(0, 9) || null;
          const reportData = await buildAnnualReportData(
            user.id,
            user.companyName,
            siren,
            prevYear // = année précédente complète
          );
          annualReportPdf = await renderToBuffer(
            RapportAnnuelPdfDocument({ data: reportData })
          ) as Buffer;
        } catch (pdfErr) {
          console.error(`[accounting-email] Rapport annuel PDF échoué pour user ${user.id}:`, pdfErr);
          // On continue sans le PDF plutôt que de bloquer l'email
        }
      }

      // ─── Envoyer l'email ──────────────────────────────────────────────────

      await sendAccountingEmail({
        accountantEmail: user.accountantEmail,
        companyName: user.companyName ?? "Mon entreprise",
        monthLabel,
        fecContent,
        fecFilename,
        journalContent,
        journalFilename,
        annualReportPdf,
        annualReportYear: isJanuary ? prevYear : undefined,
      });

      sent++;
      console.log(`[accounting-email] Envoyé pour user ${user.id} → ${user.accountantEmail}`);
    } catch (err) {
      console.error(`[accounting-email] Erreur pour user ${user.id}:`, err);
    }
  }

  return { sent, skipped: "" };
}

// ─── Route GET pour test manuel ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSendAccountingEmails();
  return NextResponse.json({ success: true, ...result });
}
