"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyStats {
  month: number;           // 0 = jan, 11 = déc
  invoicesPaid: number;    // INVOICE PAID — total TTC
  invoicesSent: number;    // INVOICE SENT/OVERDUE/REMINDED — total TTC
  quotesTotal: number;     // QUOTE non-DRAFT — total TTC
  depositsTotal: number;   // DEPOSIT — total TTC
}

export interface TopClient {
  id: string;
  name: string;
  total: number;
  count: number;
}

export interface StatsData {
  kpis: {
    caTTC: number;           // CA encaissé (INVOICE PAID)
    tva: number;             // TVA collectée (INVOICE PAID)
    enAttente: number;       // En attente (INVOICE SENT/OVERDUE/REMINDED)
    tauxConversion: number;  // % devis acceptés
    nbFactures: number;
    nbDevis: number;
    nbAcomptes: number;
  };
  monthly: MonthlyStats[];
  byStatus: Record<string, number>;
  topClients: TopClient[];
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function getStats(
  year: number
): Promise<{ success: boolean; data?: StatsData; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  try {
    const startDate = new Date(year, 0, 1);    // 1er janv
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Récupère tous les documents de l'année filtrés par type
    const docs = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
        type: { in: ["INVOICE", "QUOTE", "DEPOSIT"] },
      },
      select: {
        type: true,
        status: true,
        total: true,
        subtotal: true,
        taxTotal: true,
        date: true,
        clientId: true,
        client: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // ─── KPIs ─────────────────────────────────────────────────────────────────

    const invoices = docs.filter((d) => d.type === "INVOICE");
    const quotes   = docs.filter((d) => d.type === "QUOTE");
    const deposits = docs.filter((d) => d.type === "DEPOSIT");

    const paidInvoices   = invoices.filter((d) => d.status === "PAID");
    const pendingInvoices = invoices.filter((d) =>
      ["SENT", "OVERDUE", "REMINDED"].includes(d.status)
    );

    const caTTC     = paidInvoices.reduce((s, d) => s + Number(d.total), 0);
    const tva       = paidInvoices.reduce((s, d) => s + Number(d.taxTotal), 0);
    const enAttente = pendingInvoices.reduce((s, d) => s + Number(d.total), 0);

    // Taux de conversion : devis acceptés / (acceptés + refusés + envoyés)
    const quotesForConversion = quotes.filter((d) =>
      ["ACCEPTED", "REJECTED", "SENT"].includes(d.status)
    );
    const quotesAccepted = quotes.filter((d) => d.status === "ACCEPTED").length;
    const tauxConversion =
      quotesForConversion.length > 0
        ? Math.round((quotesAccepted / quotesForConversion.length) * 100)
        : 0;

    // ─── Monthly ──────────────────────────────────────────────────────────────

    const monthly: MonthlyStats[] = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      invoicesPaid: 0,
      invoicesSent: 0,
      quotesTotal: 0,
      depositsTotal: 0,
    }));

    for (const doc of docs) {
      const m = new Date(doc.date).getMonth(); // 0-11
      if (doc.type === "INVOICE") {
        if (doc.status === "PAID") monthly[m].invoicesPaid += Number(doc.total);
        else if (["SENT", "OVERDUE", "REMINDED"].includes(doc.status))
          monthly[m].invoicesSent += Number(doc.total);
      } else if (doc.type === "QUOTE" && doc.status !== "DRAFT") {
        monthly[m].quotesTotal += Number(doc.total);
      } else if (doc.type === "DEPOSIT") {
        monthly[m].depositsTotal += Number(doc.total);
      }
    }

    // ─── By Status (factures uniquement) ──────────────────────────────────────

    const byStatus: Record<string, number> = {};
    for (const inv of invoices) {
      byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
    }

    // ─── Top clients (par CA encaissé sur factures PAID) ──────────────────────

    const clientMap = new Map<
      string,
      { name: string; total: number; count: number }
    >();

    for (const inv of paidInvoices) {
      if (!inv.clientId) continue;
      const name = inv.client?.companyName
        ? inv.client.companyName
        : [inv.client?.firstName, inv.client?.lastName].filter(Boolean).join(" ") ||
          "Client inconnu";

      const existing = clientMap.get(inv.clientId);
      if (existing) {
        existing.total += Number(inv.total);
        existing.count += 1;
      } else {
        clientMap.set(inv.clientId, { name, total: Number(inv.total), count: 1 });
      }
    }

    const topClients: TopClient[] = [...clientMap.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      success: true,
      data: {
        kpis: {
          caTTC,
          tva,
          enAttente,
          tauxConversion,
          nbFactures: invoices.length,
          nbDevis: quotes.length,
          nbAcomptes: deposits.length,
        },
        monthly,
        byStatus,
        topClients,
      },
    };
  } catch (error) {
    console.error("getStats error:", error);
    return { success: false, error: "Erreur lors du chargement des statistiques" };
  }
}
