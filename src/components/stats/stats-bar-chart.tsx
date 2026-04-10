"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyStats } from "@/lib/actions/statistics";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsBarChartProps {
  data: MonthlyStats[];
  themeColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function formatEur(value: number) {
  if (value >= 1000) return (value / 1000).toFixed(1) + " k€";
  return value.toFixed(0) + " €";
}

// Tooltip custom avec fond adapté dark/light
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  const { currency } = useAppearance();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-violet-500/30 bg-white dark:bg-[#1e1845] shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-3">
          <span>{entry.name}</span>
          <span className="font-medium">
            {formatCurrency(entry.value, currency)}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function StatsBarChart({ data, themeColor = "#7c3aed" }: StatsBarChartProps) {
  const chartData = data.map((d) => ({
    name: MONTH_LABELS[d.month],
    "Factures payées": Math.round(d.invoicesPaid * 100) / 100,
    "En attente": Math.round(d.invoicesSent * 100) / 100,
    "Acomptes": Math.round(d.depositsTotal * 100) / 100,
  }));

  return (
    <div className="h-[180px] xs:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatEur}
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            iconSize={8}
            iconType="circle"
          />
          <Bar dataKey="Factures payées" fill={themeColor} radius={[3, 3, 0, 0]} />
          <Bar dataKey="En attente" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Acomptes" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
