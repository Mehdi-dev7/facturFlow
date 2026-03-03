"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard, PageHeader } from "@/components/dashboard";
import type { KpiData } from "@/components/dashboard";
import { StatsBarChart } from "@/components/stats/stats-bar-chart";
import { StatsDonutChart } from "@/components/stats/stats-donut-chart";
import { StatsTopClients } from "@/components/stats/stats-top-clients";
import { StatsMonthlyTable } from "@/components/stats/stats-monthly-table";
import { useStatistics } from "@/hooks/use-statistics";
import { useAppearance } from "@/hooks/use-appearance";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number) {
  return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// Génère les années disponibles (3 années en arrière jusqu'à l'année courante)
function getYearOptions() {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/80 dark:bg-[#1a1438] backdrop-blur-lg p-4 sm:p-5">
      <h2 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-3 sm:mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function StatsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const years = getYearOptions();

  const { data, isLoading, error } = useStatistics(year);
  const { themeColor } = useAppearance();

  // ─── KPI Cards ──────────────────────────────────────────────────────────────

  const kpis: KpiData[] = data
    ? [
        {
          label: "CA encaissé",
          value: fmt(data.kpis.caTTC),
          change: "Factures payées",
          changeType: "up",
          icon: "chart",
          iconBg: "bg-emerald-500",
          borderAccent: "border-emerald-500/30",
          gradientFrom: "#ecfdf5",
          gradientTo: "#a7f3d0",
          darkGradientFrom: "#1e1b4b",
          darkGradientTo: "#064e3b",
        },
        {
          label: "En attente",
          value: fmt(data.kpis.enAttente),
          change: "À encaisser",
          changeType: "neutral",
          icon: "clock",
          iconBg: "bg-amber-500",
          borderAccent: "border-amber-500/30",
          gradientFrom: "#fffbeb",
          gradientTo: "#fde68a",
          darkGradientFrom: "#1e1b4b",
          darkGradientTo: "#78350f",
        },
        {
          label: "TVA collectée",
          value: fmt(data.kpis.tva),
          change: "Sur factures PAID",
          changeType: "neutral",
          icon: "file",
          iconBg: "bg-blue-500",
          borderAccent: "border-blue-500/30",
          gradientFrom: "#eff6ff",
          gradientTo: "#bfdbfe",
          darkGradientFrom: "#1e1b4b",
          darkGradientTo: "#1e3a5f",
        },
        {
          label: "Taux conversion",
          value: `${data.kpis.tauxConversion} %`,
          change: `${data.kpis.nbDevis} devis`,
          changeType: data.kpis.tauxConversion >= 50 ? "up" : "down",
          icon: "check",
          iconBg: "bg-violet-500",
          borderAccent: "border-violet-500/30",
          gradientFrom: "#f5f3ff",
          gradientTo: "#ddd6fe",
          darkGradientFrom: "#1e1b4b",
          darkGradientTo: "#2e1065",
        },
      ]
    : [];

  // ─── États de chargement / erreur ───────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Impossible de charger les statistiques.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header avec sélecteur d'année */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl xs:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Statistiques
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Vue d&apos;ensemble de votre activité
          </p>
        </div>

        {/* Sélecteur année */}
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(Number(v))}
        >
          <SelectTrigger className="w-32 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
            {years.map((y) => (
              <SelectItem
                key={y}
                value={String(y)}
                className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50"
              >
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 h-28 animate-pulse"
              />
            ))
          : kpis.map((kpi, i) => <KpiCard key={kpi.label} data={kpi} index={i} />)}
      </div>

      {/* Graphiques — 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
        <SectionCard title="CA mensuel">
          {isLoading ? (
            <div className="h-[180px] xs:h-[220px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ) : (
            <StatsBarChart data={data!.monthly} themeColor={themeColor} />
          )}
        </SectionCard>

        <SectionCard title="Répartition des statuts">
          {isLoading ? (
            <div className="h-[180px] xs:h-[220px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ) : (
            <StatsDonutChart byStatus={data!.byStatus} />
          )}
        </SectionCard>
      </div>

      {/* Top clients + Compteurs documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
        <SectionCard title="Top 5 clients (CA encaissé)">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <StatsTopClients clients={data!.topClients} themeColor={themeColor} />
          )}
        </SectionCard>

        {/* Compteurs rapides */}
        <SectionCard title="Volume de documents">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Factures",
                  count: data!.kpis.nbFactures,
                  color: "text-violet-600 dark:text-violet-400",
                  bg: "bg-violet-50 dark:bg-violet-900/20",
                },
                {
                  label: "Devis",
                  count: data!.kpis.nbDevis,
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                },
                {
                  label: "Acomptes",
                  count: data!.kpis.nbAcomptes,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                },
              ].map(({ label, count, color, bg }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-xl p-3 sm:p-4 ${bg}`}
                >
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {label}
                  </span>
                  <span className={`text-2xl font-bold ${color}`}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Tableau mensuel récapitulatif */}
      <SectionCard title="Récapitulatif mensuel">
        {isLoading ? (
          <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ) : (
          <StatsMonthlyTable data={data!.monthly} />
        )}
      </SectionCard>
    </div>
  );
}
