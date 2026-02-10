"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

interface KpiData {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: string;
  iconBg: string;
  borderAccent: string;
  gradientFrom: string;
  gradientTo: string;
  darkGradientFrom: string;
  darkGradientTo: string;
}

type InvoiceStatus = "payée" | "impayée" | "en attente";

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

/* ─── SVG Icons ─── */
function ChartIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 6-6" /></svg>);
}
function FileIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>);
}
function CheckIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
}
function AlertIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>);
}
function ClockIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
}
function TrendUpIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
}
function TrendDownIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>);
}
function MinusIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>);
}

const iconMap: Record<string, () => React.JSX.Element> = { file: FileIcon, check: CheckIcon, alert: AlertIcon, clock: ClockIcon };

const statusConfig: Record<InvoiceStatus, { bg: string; text: string; dot: string; label: string }> = {
  "payée": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Payée" },
  "impayée": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Impayée" },
  "en attente": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "En attente" },
};

/* ─── KPI Card Component ─── */
function KpiCard({ data, index }: { data: KpiData; index: number }) {
  const [visible, setVisible] = useState(false);
  const IconComponent = iconMap[data.icon];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150 + index * 120);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${data.borderAccent} shadow-lg hover:shadow-xl transition-all duration-500 ease-out cursor-default hover:-translate-y-1 hover:scale-[1.02] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="absolute inset-0 dark:hidden" style={{ background: `linear-gradient(135deg, ${data.gradientFrom} 0%, ${data.gradientTo} 100%)` }} />
      <div className="absolute inset-0 hidden dark:block" style={{ background: `linear-gradient(135deg, ${data.darkGradientFrom} 0%, ${data.darkGradientTo} 100%)` }} />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${data.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <IconComponent />
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            data.changeType === "up" ? "bg-emerald-100 text-emerald-700"
            : data.changeType === "down" ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
          }`}>
            {data.changeType === "up" ? <TrendUpIcon /> : data.changeType === "down" ? <TrendDownIcon /> : <MinusIcon />}
            {data.change}
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">{data.value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-violet-300">{data.label}</p>
      </div>
      <div className={`h-1 w-full ${data.iconBg} opacity-60 transition-opacity duration-300 group-hover:opacity-100`} />
    </div>
  );
}

/* ─── Sort Icons ─── */
function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  if (direction === "asc") {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 5v14" /><path d="m5 12 7-7 7 7" /></svg>);
  }
  if (direction === "desc") {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 5v14" /><path d="m5 12 7 7 7-7" /></svg>);
  }
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>);
}

type SortKey = "date" | "echeance" | "amount" | "status";
type SortDir = "asc" | "desc";

const statusOrder: Record<InvoiceStatus, number> = { "impayée": 0, "en attente": 1, "payée": 2 };

function parseDate(d: string): number {
  const [day, month, year] = d.split("/");
  return new Date(`${year}-${month}-${day}`).getTime();
}

function parseAmount(a: string): number {
  return parseFloat(a.replace(/[^\d,]/g, "").replace(",", "."));
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = statusConfig[status] || statusConfig["en attente"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const [tableVisible, setTableVisible] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
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
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Bonjour,<span className="text-gradient"> {firstName}
						</span>  👋
        </h1>
        <p className="mt-1 text-sm lg:text-base text-slate-500 dark:text-slate-400">
          "Facturation, devis et suivi clients — tout est ici"
        </p>

        {/* CA + Nouvelle facture */}
        <div className="mt-5 flex items-center gap-5">
          {/* CA Annuel */}
          <div
            className="relative overflow-hidden rounded-2xl border border-violet-200/50 dark:border-violet-800/50 p-6 w-1/2"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(168,85,247,0.05) 50%, rgba(255,255,255,0.8) 100%)", backdropFilter: "blur(16px)" }}
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500 opacity-10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/25 shrink-0">
                <ChartIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">Chiffre d&apos;affaires 2026</p>
                <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">24 850,00 €</p>
              </div>
              <div className="sm:ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 w-fit">
                <TrendUpIcon />
                +12.5% vs 2025
              </div>
            </div>
          </div>

          {/* Nouvelle facture */}
          <div className="ml-auto">
            <Button variant="gradient" size="lg" className="h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer" asChild>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-violet-500/20 dark:bg-[#1a1438]">
          <div >
            <h2 className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">Factures récentes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Les 10 dernières factures</p>
          </div>
          <button className="text-sm font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer">
            Voir tout →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-violet-500/20 bg-violet-200/90 dark:bg-violet-950/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">N° Facture</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">
                  <button onClick={() => handleSort("date")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                    Émission <SortIcon direction={sortKey === "date" ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">
                  <button onClick={() => handleSort("echeance")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                    Échéance <SortIcon direction={sortKey === "echeance" ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider border-r border-slate-200 dark:border-violet-500/20">
                  <button onClick={() => handleSort("amount")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors ml-auto">
                    Montant <SortIcon direction={sortKey === "amount" ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider">
                  <button onClick={() => handleSort("status")} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors mx-auto">
                    Statut <SortIcon direction={sortKey === "status" ? sortDir : null} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-200 dark:border-violet-500/20 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer group">
                  <td className="px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors">{inv.id}</span>
                  </td>
                  <td className="px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{inv.client}</span>
                  </td>
                  <td className="px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{inv.date}</span>
                  </td>
                  <td className="px-6 py-3.5 border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{inv.echeance}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right border-r border-slate-200 dark:border-violet-500/15">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.amount}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
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
