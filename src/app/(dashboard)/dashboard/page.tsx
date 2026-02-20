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
  StatusBadge,
  SortIcon,
  parseDate,
  parseAmount,
} from "@/components/dashboard";
import type { KpiData, InvoiceStatus } from "@/components/dashboard";

interface Invoice {
  id: string;
  client: string;
  date: string;
  echeance: string;
  amount: string;
  status: InvoiceStatus;
}

const kpiData: KpiData[] = [
  { label: "Factures ce mois", value: "12", change: "+3 vs mois dernier", changeType: "up", icon: "file", iconBg: "bg-blue-500", borderAccent: "border-blue-500/30", gradientFrom: "#eff6ff", gradientTo: "#bfdbfe", darkGradientFrom: "#1e1b4b", darkGradientTo: "#1e3a5f" },
  { label: "Payées", value: "7", change: "58.3%", changeType: "up", icon: "check", iconBg: "bg-emerald-500", borderAccent: "border-emerald-500/30", gradientFrom: "#ecfdf5", gradientTo: "#a7f3d0", darkGradientFrom: "#1e1b4b", darkGradientTo: "#064e3b" },
  { label: "En attente", value: "2", change: "1 800,00 €", changeType: "neutral", icon: "clock", iconBg: "bg-amber-500", borderAccent: "border-amber-500/30", gradientFrom: "#fffbeb", gradientTo: "#fde68a", darkGradientFrom: "#1e1b4b", darkGradientTo: "#78350f" },
  { label: "Impayées", value: "3", change: "2 150,00 €", changeType: "down", icon: "alert", iconBg: "bg-red-500", borderAccent: "border-red-500/30", gradientFrom: "#fef2f2", gradientTo: "#fecaca", darkGradientFrom: "#1e1b4b", darkGradientTo: "#7f1d1d" },
];

const recentInvoices: Invoice[] = [
  { id: "FAC-2026-047", client: "Dupont & Associés", date: "08/02/2026", echeance: "08/03/2026", amount: "3 200,00 €", status: "payée" },
  { id: "FAC-2026-046", client: "Studio Créatif Lyon", date: "06/02/2026", echeance: "08/03/2026", amount: "1 450,00 €", status: "en attente" },
  { id: "FAC-2026-045", client: "Tech Solutions SAS", date: "04/02/2026", echeance: "06/03/2026", amount: "5 800,00 €", status: "payée" },
  { id: "FAC-2026-044", client: "Marie Lambert - Freelance", date: "02/02/2026", echeance: "04/03/2026", amount: "750,00 €", status: "impayée" },
  { id: "FAC-2026-043", client: "Boulangerie Petit Jean", date: "31/01/2026", echeance: "02/03/2026", amount: "420,00 €", status: "payée" },
  { id: "FAC-2026-042", client: "Agence Web Marseille", date: "29/01/2026", echeance: "28/02/2026", amount: "2 800,00 €", status: "payée" },
  { id: "FAC-2026-041", client: "Cabinet Martin", date: "27/01/2026", echeance: "26/02/2026", amount: "1 200,00 €", status: "en attente" },
  { id: "FAC-2026-040", client: "Restaurant Le Provençal", date: "25/01/2026", echeance: "24/02/2026", amount: "680,00 €", status: "impayée" },
  { id: "FAC-2026-039", client: "Auto Services Bordeaux", date: "22/01/2026", echeance: "21/02/2026", amount: "3 500,00 €", status: "payée" },
  { id: "FAC-2026-038", client: "Librairie Voltaire", date: "20/01/2026", echeance: "19/02/2026", amount: "290,00 €", status: "impayée" },
];

type SortKey = "date" | "echeance" | "amount" | "status";
type SortDir = "asc" | "desc";

const statusOrder: Record<InvoiceStatus, number> = { relancée: 0, impayée: 1, envoyée: 2, "en attente": 3, "à envoyer": 4, payée: 5 };

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const [tableVisible, setTableVisible] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const timer = setTimeout(() => setTableVisible(true), 800);
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

  const sortedInvoices = useMemo(() => {
    if (!sortKey) return recentInvoices;
    return [...recentInvoices].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = parseDate(a.date) - parseDate(b.date);
          break;
        case "echeance":
          cmp = parseDate(a.echeance) - parseDate(b.echeance);
          break;
        case "amount":
          cmp = parseAmount(a.amount) - parseAmount(b.amount);
          break;
        case "status":
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Utilisateur";

  return (
    <div>
      {/* ── Header + CA Hero ── */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Bonjour,<span className="text-gradient"> {firstName}
					</span>  👋
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
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">Chiffre d&apos;affaires 2026</p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">24 850,00 €</p>
              </div>
              <div className="sm:ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 w-fit">
                <TrendUpIcon />
                +12.5% vs 2025
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

      {/* ── 4 KPI Cards — Factures du mois ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpiData.map((kpi, i) => (
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
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Les 10 dernières factures</p>
          </div>
          <button className="text-xs sm:text-sm font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-300 transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-violet-500/10 dark:hover:bg-violet-500/20 cursor-pointer">
            Voir tout →
          </button>
        </div>

        {/* ── Mobile: Accordion View ── */}
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
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 shrink-0">{inv.id}</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{inv.client}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <StatusBadge status={inv.status} />
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <div
                  className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-3.5 pt-0 flex flex-col gap-2 bg-violet-50/50 dark:bg-violet-950/30">
                      <div className="flex justify-between text-xs md:text:sm">
                        <span className="text-slate-500 dark:text-slate-400">Émission</span>
                        <span className="text-slate-700 dark:text-slate-300">{inv.date}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Échéance</span>
                        <span className="text-slate-700 dark:text-slate-300">{inv.echeance}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
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

        {/* ── Desktop: Table View ── */}
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
                <tr key={inv.id} className="border-b border-slate-200 dark:border-violet-500/20 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer group">
                  <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15 md:w-[120px] lg:w-auto">
                    <span className="text-[11px] lg:text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors block truncate md:max-w-[100px] lg:max-w-none">{inv.id}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15 md:w-[120px] lg:w-auto">
                    <span className="text-[11px] lg:text-xs text-slate-700 dark:text-slate-300 block truncate md:max-w-[100px] lg:max-w-none">{inv.client}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">{inv.date}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">{inv.echeance}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-3.5 text-right border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-[10px] lg:text-xs font-semibold text-slate-900 dark:text-slate-100">{inv.amount}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-3.5 text-center md:w-[115px] lg:w-auto">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
