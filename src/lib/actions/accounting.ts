"use server";

// src/lib/actions/accounting.ts
// Exports comptables Business : FEC, URSSAF, rapport annuel, journal mensuel

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePlan, canUseFeature } from "@/lib/feature-gate";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types pour les PDF ───────────────────────────────────────────────────────

export interface UrssafPdfData {
  year: number;
  companyName: string | null;
  companySiren: string | null;
  quarters: Array<{ label: string; caHT: number; caTTC: number; count: number }>;
  totalHT: number;
  totalTTC: number;
  totalCount: number;
  generatedAt: string;
}

export interface AnnualReportPdfData {
  year: number;
  companyName: string | null;
  companySiren: string | null;
  caHT: number;
  caTTC: number;
  tvaCollectee: number;
  invoiceCount: number;
  paidCount: number;
  creditNoteCount: number;
  avoirsTotal: number;
  caNet: number;
  tauxEncaissement: number;
  topClient: { name: string; total: number } | null;
  monthlyBreakdown: Array<{ month: string; caHT: number; caTTC: number; count: number }>;
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// BOM UTF-8 pour Excel FR
const BOM = "\uFEFF";

// Formatte un nombre au format FR (virgule décimale)
function fmtNum(val: number): string {
  return val.toFixed(2).replace(".", ",");
}

// Date au format YYYYMMDD (norme FEC)
function fecDate(date: Date): string {
  return format(date, "yyyyMMdd");
}

// Date au format dd/MM/yyyy
function frDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

// Nom du mois en français
function monthName(month: number, year: number): string {
  return format(new Date(year, month, 1), "MMMM yyyy", { locale: fr });
}

// Statut facture lisible
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  VIEWED: "Vue",
  PAID: "Payée",
  OVERDUE: "En retard",
  REMINDED: "Relancée",
  CANCELLED: "Annulée",
  SEPA_PENDING: "SEPA en cours",
};

// Mode paiement lisible
const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Virement",
  STRIPE: "Carte bancaire",
  PAYPAL: "PayPal",
  GOCARDLESS: "Prélèvement SEPA",
};

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthedBusinessUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Non authentifié" as const };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      plan: true,
      trialEndsAt: true,
      email: true,
      grantedPlan: true,
      companyName: true,
      companySiret: true,
      companySiren: true,
      accountantEmail: true,
    },
  });

  if (!user) return { error: "Utilisateur introuvable" as const };

  return { user, effectivePlan: getEffectivePlan(user) };
}

// ─── Export FEC ──────────────────────────────────────────────────────────────

export async function exportFec(
  year: number
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  const result = await getAuthedBusinessUser();
  if ("error" in result) return { success: false, error: result.error };
  const { user, effectivePlan } = result;

  if (!canUseFeature({ plan: effectivePlan, trialEndsAt: null }, "fec_export")) {
    return { success: false, error: "Fonctionnalité réservée au plan Business" };
  }

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Factures + avoirs non-brouillons de l'année
    const docs = await prisma.document.findMany({
      where: {
        userId: user.id,
        type: { in: ["INVOICE", "CREDIT_NOTE"] },
        status: { not: "DRAFT" },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        client: {
          select: {
            companyName: true,
            companySiret: true,
            firstName: true,
            lastName: true,
            id: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Colonnes FEC normalisées (tab-separated)
    const fecColumns = [
      "JournalCode",
      "JournalLib",
      "EcritureNum",
      "EcritureDate",
      "CompteNum",
      "CompteLib",
      "CompAuxNum",
      "CompAuxLib",
      "PieceRef",
      "PieceDate",
      "EcritureLib",
      "Debit",
      "Credit",
      "EcritureLet",
      "DateLet",
      "ValidDate",
      "Montantdevise",
      "Idevise",
    ];

    const rows: string[] = [fecColumns.join("\t")];

    for (const doc of docs) {
      const clientName = doc.client?.companyName
        || [doc.client?.firstName, doc.client?.lastName].filter(Boolean).join(" ")
        || "Client inconnu";
      const clientRef = doc.client?.companySiret || doc.client?.id || "";
      const docNumber = doc.number ?? "";
      const docDate = fecDate(new Date(doc.date));
      const isCredit = doc.type === "CREDIT_NOTE";
      const label = isCredit
        ? `Avoir ${docNumber} - ${clientName}`
        : `Facture ${docNumber} - ${clientName}`;

      const ht = Number(doc.subtotal);
      const tva = Number(doc.taxTotal);
      const ttc = Number(doc.total);

      // Écriture 1 : Débit client 411000 (TTC)
      rows.push([
        "VE",                                   // JournalCode
        "Journal des ventes",                   // JournalLib
        docNumber,                              // EcritureNum
        docDate,                                // EcritureDate
        "411000",                               // CompteNum (client)
        "Clients",                              // CompteLib
        clientRef,                              // CompAuxNum
        clientName,                             // CompAuxLib
        docNumber,                              // PieceRef
        docDate,                                // PieceDate
        label,                                  // EcritureLib
        isCredit ? "" : fmtNum(ttc),            // Debit
        isCredit ? fmtNum(ttc) : "",            // Credit (avoir = inverse)
        "",                                     // EcritureLet
        "",                                     // DateLet
        docDate,                                // ValidDate
        fmtNum(ttc),                            // Montantdevise
        "EUR",                                  // Idevise
      ].join("\t"));

      // Écriture 2 : Crédit ventes 701000 (HT)
      rows.push([
        "VE",
        "Journal des ventes",
        docNumber,
        docDate,
        "701000",
        "Ventes de services",
        "",
        "",
        docNumber,
        docDate,
        label,
        isCredit ? fmtNum(ht) : "",
        isCredit ? "" : fmtNum(ht),
        "",
        "",
        docDate,
        fmtNum(ht),
        "EUR",
      ].join("\t"));

      // Écriture 3 : Crédit TVA 445710 (TVA collectée) — si TVA > 0
      if (tva > 0) {
        rows.push([
          "VE",
          "Journal des ventes",
          docNumber,
          docDate,
          "445710",
          "TVA collectée",
          "",
          "",
          docNumber,
          docDate,
          label,
          isCredit ? fmtNum(tva) : "",
          isCredit ? "" : fmtNum(tva),
          "",
          "",
          docDate,
          fmtNum(tva),
          "EUR",
        ].join("\t"));
      }
    }

    // Nom de fichier normalisé : FEC_SIREN_YYYYMMDD.txt
    const siren = user.companySiren || user.companySiret?.slice(0, 9) || "000000000";
    const today = fecDate(new Date());
    const filename = `FEC_${siren}_${today}.txt`;

    return {
      success: true,
      data: BOM + rows.join("\n"),
      filename,
    };
  } catch (error) {
    console.error("exportFec error:", error);
    return { success: false, error: "Erreur lors de l'export FEC" };
  }
}

// ─── Export URSSAF ────────────────────────────────────────────────────────────

export async function exportUrssaf(
  year: number
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  const result = await getAuthedBusinessUser();
  if ("error" in result) return { success: false, error: result.error };
  const { user, effectivePlan } = result;

  if (!canUseFeature({ plan: effectivePlan, trialEndsAt: null }, "annual_report")) {
    return { success: false, error: "Fonctionnalité réservée au plan Business" };
  }

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Factures PAID de l'année
    const invoices = await prisma.document.findMany({
      where: {
        userId: user.id,
        type: "INVOICE",
        status: "PAID",
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, subtotal: true, total: true },
    });

    // Agrégation par trimestre
    const quarters = [
      { label: "T1 (Jan–Mar)", months: [0, 1, 2] },
      { label: "T2 (Avr–Jun)", months: [3, 4, 5] },
      { label: "T3 (Jul–Sep)", months: [6, 7, 8] },
      { label: "T4 (Oct–Déc)", months: [9, 10, 11] },
    ];

    const header = "Trimestre;CA HT;CA TTC;Nombre factures";
    const rows = quarters.map((q) => {
      const qInvoices = invoices.filter((inv) =>
        q.months.includes(new Date(inv.date).getMonth())
      );
      const caHT = qInvoices.reduce((s, inv) => s + Number(inv.subtotal), 0);
      const caTTC = qInvoices.reduce((s, inv) => s + Number(inv.total), 0);
      return [q.label, fmtNum(caHT), fmtNum(caTTC), String(qInvoices.length)].join(";");
    });

    // Total annuel
    const totalHT = invoices.reduce((s, inv) => s + Number(inv.subtotal), 0);
    const totalTTC = invoices.reduce((s, inv) => s + Number(inv.total), 0);
    rows.push(["TOTAL", fmtNum(totalHT), fmtNum(totalTTC), String(invoices.length)].join(";"));

    return {
      success: true,
      data: BOM + [header, ...rows].join("\n"),
      filename: `urssaf-${year}.csv`,
    };
  } catch (error) {
    console.error("exportUrssaf error:", error);
    return { success: false, error: "Erreur lors de l'export URSSAF" };
  }
}

// ─── Rapport annuel ─────────────────────────────────────────────────────────

export async function exportAnnualReport(
  year: number
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  const result = await getAuthedBusinessUser();
  if ("error" in result) return { success: false, error: result.error };
  const { user, effectivePlan } = result;

  if (!canUseFeature({ plan: effectivePlan, trialEndsAt: null }, "annual_report")) {
    return { success: false, error: "Fonctionnalité réservée au plan Business" };
  }

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Toutes les factures + avoirs de l'année (hors brouillons)
    const docs = await prisma.document.findMany({
      where: {
        userId: user.id,
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
    const caNet = caTTC - avoirsTotal;
    const tauxEncaissement = invoices.length > 0
      ? Math.round((paidInvoices.length / invoices.length) * 100)
      : 0;

    // Top client par CA
    const clientMap = new Map<string, { name: string; total: number }>();
    for (const inv of paidInvoices) {
      if (!inv.client) continue;
      const name = inv.client.companyName
        || [inv.client.firstName, inv.client.lastName].filter(Boolean).join(" ")
        || "Inconnu";
      const existing = clientMap.get(inv.clientId);
      if (existing) {
        existing.total += Number(inv.total);
      } else {
        clientMap.set(inv.clientId, { name, total: Number(inv.total) });
      }
    }
    const topClient = [...clientMap.values()].sort((a, b) => b.total - a.total)[0];

    // Format CSV avec les indicateurs clés
    const header = "Indicateur;Valeur";
    const rows = [
      `Année;${year}`,
      `CA HT encaissé;${fmtNum(caHT)} €`,
      `CA TTC encaissé;${fmtNum(caTTC)} €`,
      `TVA collectée;${fmtNum(tvaCollectee)} €`,
      `Nombre de factures émises;${invoices.length}`,
      `Nombre de factures payées;${paidInvoices.length}`,
      `Nombre d'avoirs;${creditNotes.length}`,
      `Total avoirs;${fmtNum(avoirsTotal)} €`,
      `CA net (TTC - avoirs);${fmtNum(caNet)} €`,
      `Taux d'encaissement;${tauxEncaissement} %`,
      `Client principal;${topClient ? `${topClient.name} (${fmtNum(topClient.total)} €)` : "—"}`,
    ];

    return {
      success: true,
      data: BOM + [header, ...rows].join("\n"),
      filename: `rapport-annuel-${year}.csv`,
    };
  } catch (error) {
    console.error("exportAnnualReport error:", error);
    return { success: false, error: "Erreur lors de l'export du rapport annuel" };
  }
}

// ─── Journal mensuel ─────────────────────────────────────────────────────────

export async function exportMonthlyReport(
  year: number,
  month: number // 0–11
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  const result = await getAuthedBusinessUser();
  if ("error" in result) return { success: false, error: result.error };
  const { user, effectivePlan } = result;

  if (!canUseFeature({ plan: effectivePlan, trialEndsAt: null }, "monthly_accounting_report")) {
    return { success: false, error: "Fonctionnalité réservée au plan Business" };
  }

  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Récupère factures + acomptes + avoirs du mois en une seule requête
    const docs = await prisma.document.findMany({
      where: {
        userId: user.id,
        type: { in: ["INVOICE", "DEPOSIT", "CREDIT_NOTE"] },
        status: { not: "DRAFT" },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        client: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true,
            companySiret: true,
            companySiren: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // En-tête avec colonne Type (Facture / Acompte / Avoir), flux (Entrée/Sortie) et SIRET/SIREN
    const header = "Date;Type;Flux;N° Document;Client;SIRET / SIREN;Montant HT;TVA;Total TTC;Statut;Mode de paiement";

    const rows = docs.map((doc) => {
      const clientName = doc.client?.companyName
        || [doc.client?.firstName, doc.client?.lastName].filter(Boolean).join(" ")
        || "—";

      // SIRET prioritaire, sinon SIREN
      const siretSiren = doc.client?.companySiret || doc.client?.companySiren || "—";

      // Type lisible + sens du flux
      let typeLabel: string;
      let flux: string;
      if (doc.type === "INVOICE") {
        typeLabel = "Facture";
        flux = "Entrée";
      } else if (doc.type === "DEPOSIT") {
        typeLabel = "Acompte";
        flux = "Entrée";
      } else {
        // CREDIT_NOTE
        typeLabel = "Avoir";
        flux = "Sortie";
      }

      const status = STATUS_LABELS[doc.status] ?? doc.status;
      const payment = doc.paymentMethod ? (PAYMENT_LABELS[doc.paymentMethod] ?? doc.paymentMethod) : "—";

      // Les avoirs sont négatifs comptablement — on préfixe d'un signe –
      const sign = doc.type === "CREDIT_NOTE" ? -1 : 1;

      return [
        frDate(new Date(doc.date)),
        typeLabel,
        flux,
        doc.number ?? "—",
        clientName,
        siretSiren,
        fmtNum(sign * Number(doc.subtotal)),
        fmtNum(sign * Number(doc.taxTotal)),
        fmtNum(sign * Number(doc.total)),
        status,
        payment,
      ].join(";");
    });

    const mName = format(new Date(year, month, 1), "MMMM-yyyy", { locale: fr });

    return {
      success: true,
      data: BOM + [header, ...rows].join("\n"),
      filename: `journal-${mName}.csv`,
    };
  } catch (error) {
    console.error("exportMonthlyReport error:", error);
    return { success: false, error: "Erreur lors de l'export du journal mensuel" };
  }
}

// ─── Données structurées pour PDF URSSAF ─────────────────────────────────────

export async function getUrssafData(
  year: number
): Promise<{ success: boolean; data?: UrssafPdfData; error?: string }> {
  const result = await getAuthedBusinessUser();
  if ("error" in result) return { success: false, error: result.error };
  const { user, effectivePlan } = result;

  if (!canUseFeature({ plan: effectivePlan, trialEndsAt: null }, "annual_report")) {
    return { success: false, error: "Fonctionnalité réservée au plan Business" };
  }

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await prisma.document.findMany({
      where: {
        userId: user.id,
        type: "INVOICE",
        status: "PAID",
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, subtotal: true, total: true },
    });

    const quarterDefs = [
      { label: "T1 (Jan–Mar)", months: [0, 1, 2] },
      { label: "T2 (Avr–Jun)", months: [3, 4, 5] },
      { label: "T3 (Jul–Sep)", months: [6, 7, 8] },
      { label: "T4 (Oct–Déc)", months: [9, 10, 11] },
    ];

    const quarters = quarterDefs.map((q) => {
      const qInvoices = invoices.filter((inv) =>
        q.months.includes(new Date(inv.date).getMonth())
      );
      return {
        label: q.label,
        caHT: qInvoices.reduce((s, inv) => s + Number(inv.subtotal), 0),
        caTTC: qInvoices.reduce((s, inv) => s + Number(inv.total), 0),
        count: qInvoices.length,
      };
    });

    return {
      success: true,
      data: {
        year,
        companyName: user.companyName,
        companySiren: user.companySiren ?? user.companySiret?.slice(0, 9) ?? null,
        quarters,
        totalHT: invoices.reduce((s, inv) => s + Number(inv.subtotal), 0),
        totalTTC: invoices.reduce((s, inv) => s + Number(inv.total), 0),
        totalCount: invoices.length,
        generatedAt: frDate(new Date()),
      },
    };
  } catch (error) {
    console.error("getUrssafData error:", error);
    return { success: false, error: "Erreur lors de la récupération des données URSSAF" };
  }
}

// ─── Données structurées pour PDF Rapport Annuel ──────────────────────────────

export async function getAnnualReportData(
  year: number
): Promise<{ success: boolean; data?: AnnualReportPdfData; error?: string }> {
  const result = await getAuthedBusinessUser();
  if ("error" in result) return { success: false, error: result.error };
  const { user, effectivePlan } = result;

  if (!canUseFeature({ plan: effectivePlan, trialEndsAt: null }, "annual_report")) {
    return { success: false, error: "Fonctionnalité réservée au plan Business" };
  }

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const docs = await prisma.document.findMany({
      where: {
        userId: user.id,
        type: { in: ["INVOICE", "CREDIT_NOTE"] },
        status: { not: "DRAFT" },
        date: { gte: startDate, lte: endDate },
      },
      select: {
        type: true,
        status: true,
        date: true,
        subtotal: true,
        taxTotal: true,
        total: true,
        clientId: true,
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

    // Top client par CA TTC
    const clientMap = new Map<string, { name: string; total: number }>();
    for (const inv of paidInvoices) {
      if (!inv.client) continue;
      const name = inv.client.companyName
        || [inv.client.firstName, inv.client.lastName].filter(Boolean).join(" ")
        || "Inconnu";
      const existing = clientMap.get(inv.clientId);
      if (existing) {
        existing.total += Number(inv.total);
      } else {
        clientMap.set(inv.clientId, { name, total: Number(inv.total) });
      }
    }
    const topClient = [...clientMap.values()].sort((a, b) => b.total - a.total)[0] ?? null;

    // Répartition mensuelle
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
      success: true,
      data: {
        year,
        companyName: user.companyName,
        companySiren: user.companySiren ?? user.companySiret?.slice(0, 9) ?? null,
        caHT,
        caTTC,
        tvaCollectee,
        invoiceCount: invoices.length,
        paidCount: paidInvoices.length,
        creditNoteCount: creditNotes.length,
        avoirsTotal,
        caNet: caTTC - avoirsTotal,
        tauxEncaissement,
        topClient,
        monthlyBreakdown,
        generatedAt: frDate(new Date()),
      },
    };
  } catch (error) {
    console.error("getAnnualReportData error:", error);
    return { success: false, error: "Erreur lors de la récupération du rapport annuel" };
  }
}

// ─── Mise à jour de l'email comptable ────────────────────────────────────────

const emailSchema = z.object({
  email: z.union([z.string().email("Email invalide"), z.literal("")]),
});

export async function updateAccountantEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  try {
    const parsed = emailSchema.parse({ email });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { accountantEmail: parsed.email || null },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Email invalide" };
    }
    console.error("updateAccountantEmail error:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ─── Récupérer l'email comptable ──────────────────────────────────────────────

export async function getAccountantEmail(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountantEmail: true },
  });

  return user?.accountantEmail ?? null;
}
