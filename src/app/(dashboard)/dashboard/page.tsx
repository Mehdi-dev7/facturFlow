"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import {
  ChartIcon,
  TrendUpIcon,
  KpiCard,
  SortIcon,
  parseDate,
  parseAmount,
} from "@/components/dashboard";
import type { KpiData } from "@/components/dashboard";
import type { InvoiceStatus } from "@/components/dashboard/status-badge";
import { StatusDropdown } from "@/components/dashboard/status-dropdown";
import { useInvoices, type SavedInvoice } from "@/hooks/use-invoices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDocStatus(status: string): InvoiceStatus {
  switch (status) {
    case "DRAFT":    return "à envoyer";
    case "SENT":     return "envoyée";
    case "PAID":     return "payée";
    case "OVERDUE":  return "impayée";
    case "REMINDED": return "relancée";
    default:         return "à envoyer";
  }
}

function getClientName(client: SavedInvoice["client"]): string {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatAmountFR(amount: number): string {
  return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

interface InvoiceRow {
  id: string;
  number: string;
  client: string;
  date: string;
  echeance: string;
  amount: string;
  rawDate: number;
  status: InvoiceStatus;
  dbStatus: string;
}

type SortKey = "date" | "echeance" | "amount" | "status";
type SortDir = "asc" | "desc";

const statusOrder: Record<InvoiceStatus, number> = {
  relancée: 0, impayée: 1, envoyée: 2, "en attente": 3, "à envoyer": 4, payée: 5,
};

function toRow(inv: SavedInvoice): InvoiceRow {
  return {
    id: inv.id,
    number: inv.number,
    client: getClientName(inv.client),
    date: formatDateFR(inv.date),
    echeance: formatDateFR(inv.dueDate),
    amount: formatAmountFR(inv.total),
    rawDate: inv.date ? new Date(inv.date).getTime() : 0,
    status: mapDocStatus(inv.status),
    dbStatus: inv.status,
  };
}

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const [tableVisible, setTableVisible] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: session } = useSession();

  // Vraies données
  const { data: allInvoices = [], isLoading } = useInvoices();

  useEffect(() => {
    const timer = setTimeout(() => setTableVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  // 10 factures les plus récentes
  const recentRows = useMemo(() => {
    const rows = allInvoices.map(toRow);
    // Trier par date desc pour afficher les plus récentes d'abord
    return rows.sort((a, b) => b.rawDate - a.rawDate).slice(0, 10);
  }, [allInvoices]);

  const sortedInvoices = useMemo(() => {
    if (!sortKey) return recentRows;
    return [...recentRows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":     cmp = parseDate(a.date !== "—" ? a.date : "01/01/1970") - parseDate(b.date !== "—" ? b.date : "01/01/1970"); break;
        case "echeance": cmp = parseDate(a.echeance !== "—" ? a.echeance : "01/01/1970") - parseDate(b.echeance !== "—" ? b.echeance : "01/01/1970"); break;
        case "amount":   cmp = parseAmount(a.amount) - parseAmount(b.amount); break;
        case "status":   cmp = statusOrder[a.status] - statusOrder[b.status]; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [recentRows, sortKey, sortDir]);

  // KPIs calculés sur le mois courant
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const kpis = useMemo((): KpiData[] => {
    const thisMonth = allInvoices.filter((inv) => {
      if (!inv.date) return false;
      const d = new Date(inv.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const total   = thisMonth.length;
    const paid    = thisMonth.filter((r) => r.status === "PAID").length;
    const pending = thisMonth.filter((r) => r.status === "SENT").length;
    const unpaid  = thisMonth.filter((r) => r.status === "OVERDUE").length;

    const pendingAmount = thisMonth.filter((r) => r.status === "SENT").reduce((s, r) => s + r.total, 0);
    const unpaidAmount  = thisMonth.filter((r) => r.status === "OVERDUE").reduce((s, r) => s + r.total, 0);
    const paidPct = total > 0 ? ((paid / total) * 100).toFixed(1) + "%" : "0%";

    return [
      { label: "Factures ce mois", value: String(total), change: `${total} facture${total > 1 ? "s" : ""}`, changeType: "up", icon: "file", iconBg: "bg-blue-500", borderAccent: "border-blue-500/30", gradientFrom: "#eff6ff", gradientTo: "#bfdbfe", darkGradientFrom: "#1e1b4b", darkGradientTo: "#1e3a5f" },
      { label: "Payées", value: String(paid), change: paidPct, changeType: "up", icon: "check", iconBg: "bg-emerald-500", borderAccent: "border-emerald-500/30", gradientFrom: "#ecfdf5", gradientTo: "#a7f3d0", darkGradientFrom: "#1e1b4b", darkGradientTo: "#064e3b" },
      { label: "En attente", value: String(pending), change: formatAmountFR(pendingAmount), changeType: "neutral", icon: "clock", iconBg: "bg-amber-500", borderAccent: "border-amber-500/30", gradientFrom: "#fffbeb", gradientTo: "#fde68a", darkGradientFrom: "#1e1b4b", darkGradientTo: "#78350f" },
      { label: "Impayées", value: String(unpaid), change: formatAmountFR(unpaidAmount), changeType: "down", icon: "alert", iconBg: "bg-red-500", borderAccent: "border-red-500/30", gradientFrom: "#fef2f2", gradientTo: "#fecaca", darkGradientFrom: "#1e1b4b", darkGradientTo: "#7f1d1d" },
    ];
  }, [allInvoices, currentYear, currentMonth]);

  // CA annuel = somme des factures payées de l'année en cours
  const caAnnuel = useMemo(() => {
    return allInvoices
      .filter((inv) => {
        if (inv.status !== "PAID" || !inv.date) return false;
        return new Date(inv.date).getFullYear() === currentYear;
      })
      .reduce((s, inv) => s + inv.total, 0);
  }, [allInvoices, currentYear]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Utilisateur";

  return (
    <div>
      {/* ── Header + CA Hero ── */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Bonjour,<span className="text-gradient"> {firstName}</span> 👋
        </h1>
        <p className="mt-1 text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400">
          « Facturation, devis et suivi clients — tout est ici »
        </p>

        {/* CA + Nouvelle facture */}
        <div className="mt-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5">
          {/* CA Annuel */}
          <div
            className="relative overflow-hidden rounded-2xl border border-violet-200/50 dark:border-violet-800/50 p-4 sm:p-6 w-full lg:w-1/2"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(168,85,247,0.05) 50%, rgba(255,255,255,0.8) 100%)", backdropFilter: "blur(16px)" }}
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500 opacity-10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/25 shrink-0">
                <ChartIcon />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  Chiffre d&apos;affaires {currentYear}
                </p>
                {isLoading ? (
                  <div className="h-8 w-40 bg-slate-200 dark:bg-violet-800/40 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {formatAmountFR(caAnnuel)}
                  </p>
                )}
              </div>
              <div className="sm:ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 w-fit">
                <TrendUpIcon />
                Factures payées
              </div>
            </div>
          </div>

          {/* Nouvelle facture */}
          <div className="lg:ml-auto">
            <Button variant="gradient" size="lg" className="h-11 sm:h-12 px-6 sm:px-8 font-ui text-sm sm:text-base transition-all duration-300 cursor-pointer hover:scale-105 w-auto" asChild>
              <Link href="/dashboard/invoices/new">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
                Nouvelle facture
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* ── Tableau factures récentes ── */}
      <div
        className={`rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden transition-all duration-700 ease-out ${tableVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20 dark:bg-[#1a1438]">
          <div>
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">Factures récentes</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isLoading ? "Chargement…" : `${recentRows.length} dernière${recentRows.length > 1 ? "s" : ""} facture${recentRows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/dashboard/invoices"
            className="text-xs sm:text-sm font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-300 transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-violet-500/10 dark:hover:bg-violet-500/20 cursor-pointer"
          >
            Voir tout →
          </Link>
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="divide-y divide-slate-200 dark:divide-violet-500/20">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 sm:px-6 py-3.5 flex items-center gap-4">
                <div className="h-4 w-24 bg-slate-200 dark:bg-violet-800/40 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-slate-100 dark:bg-violet-800/20 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-100 dark:bg-violet-800/20 rounded animate-pulse" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-violet-800/40 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* ── Vide ── */}
        {!isLoading && sortedInvoices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aucune facture</p>
            <p className="text-xs text-slate-400 dark:text-violet-400 mt-1">Créez votre première facture pour commencer.</p>
          </div>
        )}

        {/* ── Mobile: Accordion View ── */}
        {!isLoading && sortedInvoices.length > 0 && (
          <div className="md:hidden divide-y divide-slate-200 dark:divide-violet-500/20">
            {sortedInvoices.map((inv) => {
              const isExpanded = expandedId === inv.id;
              return (
                <div key={inv.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 shrink-0">{inv.number}</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{inv.client}</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown invoiceId={inv.id} dbStatus={inv.dbStatus} />
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  <div className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="px-4 pb-3.5 pt-0 flex flex-col gap-2 bg-violet-50/50 dark:bg-violet-950/30">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Émission</span>
                          <span className="text-slate-700 dark:text-slate-300">{inv.date}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Échéance</span>
                          <span className="text-slate-700 dark:text-slate-300">{inv.echeance}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Montant</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{inv.amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Desktop: Table View ── */}
        {!isLoading && sortedInvoices.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-violet-500/20 bg-violet-200/90 dark:bg-violet-950/50">
                  <th className="px-3 lg:px-6 py-3 text-left text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20 md:w-[120px] lg:w-auto">N° Facture</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20 md:w-[120px] lg:w-auto">Client</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">
                    <button onClick={() => handleSort("date")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                      Émission <SortIcon direction={sortKey === "date" ? sortDir : null} />
                    </button>
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">
                    <button onClick={() => handleSort("echeance")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                      Échéance <SortIcon direction={sortKey === "echeance" ? sortDir : null} />
                    </button>
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-right text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">
                    <button onClick={() => handleSort("amount")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors ml-auto">
                      Montant <SortIcon direction={sortKey === "amount" ? sortDir : null} />
                    </button>
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider md:w-[115px] lg:w-auto">
                    <button onClick={() => handleSort("status")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors mx-auto">
                      Statut <SortIcon direction={sortKey === "status" ? sortDir : null} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-200 dark:border-violet-500/20 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors group">
                    <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15 md:w-[120px] lg:w-auto">
                      <Link href={`/dashboard/invoices?preview=${inv.id}`} className="text-[11px] lg:text-xs xl:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors block truncate md:max-w-[100px] lg:max-w-none">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15 md:w-[120px] lg:w-auto">
                      <span className="text-[11px] lg:text-xs xl:text-sm text-slate-700 dark:text-slate-300 block truncate md:max-w-[100px] lg:max-w-none">{inv.client}</span>
                    </td>
                    <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                      <span className="text-[10px] lg:text-sm text-slate-500 dark:text-slate-400">{inv.date}</span>
                    </td>
                    <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                      <span className="text-[10px] lg:text-sm text-slate-500 dark:text-slate-400">{inv.echeance}</span>
                    </td>
                    <td className="px-3 lg:px-6 py-3.5 text-right border-r border-slate-200 dark:border-violet-500/15">
                      <span className="text-[10px] lg:text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.amount}</span>
                    </td>
                    <td className="px-3 lg:px-6 py-3.5 text-center md:w-[115px] lg:w-auto" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown invoiceId={inv.id} dbStatus={inv.dbStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
