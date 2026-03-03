"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── Couleurs par statut ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PAID:         { label: "Payées",      color: "#10b981" },
  SENT:         { label: "Envoyées",    color: "#3b82f6" },
  OVERDUE:      { label: "Impayées",    color: "#ef4444" },
  REMINDED:     { label: "Relancées",   color: "#f59e0b" },
  DRAFT:        { label: "Brouillons",  color: "#94a3b8" },
  SEPA_PENDING: { label: "SEPA cours",  color: "#8b5cf6" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsDonutChartProps {
  byStatus: Record<string, number>;
}

// ─── Tooltip custom ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-violet-500/30 bg-white dark:bg-[#1e1845] shadow-lg px-3 py-2 text-xs">
      <p style={{ color: item.payload.color }} className="font-semibold">{item.name}</p>
      <p className="text-slate-600 dark:text-slate-300">{item.value} facture{item.value > 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Label central ────────────────────────────────────────────────────────────

function CenterLabel({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) {
  return (
    <>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-900 dark:fill-slate-100" style={{ fontSize: 20, fontWeight: 700 }}>
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10 }}>
        factures
      </text>
    </>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function StatsDonutChart({ byStatus }: StatsDonutChartProps) {
  const entries = Object.entries(byStatus).filter(([, count]) => count > 0);
  const total = entries.reduce((s, [, c]) => s + c, 0);

  if (total === 0) {
    return (
      <div className="h-[180px] xs:h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        Aucune facture cette année
      </div>
    );
  }

  const pieData = entries.map(([status, count]) => ({
    name: STATUS_CONFIG[status]?.label ?? status,
    value: count,
    color: STATUS_CONFIG[status]?.color ?? "#94a3b8",
  }));

  return (
    <div className="h-[180px] xs:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="42%"
            innerRadius="45%"
            outerRadius="65%"
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            {/* Label central via customized prop */}
          </Pie>
          {/* Label central SVG inline */}
          <text
            x="50%"
            y="38%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 20, fontWeight: 700, fill: "currentColor" }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 10, fill: "#94a3b8" }}
          >
            factures
          </text>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            iconSize={8}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
