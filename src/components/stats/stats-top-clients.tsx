"use client";

import type { TopClient } from "@/lib/actions/statistics";

interface StatsTopClientsProps {
  clients: TopClient[];
  themeColor?: string;
}

export function StatsTopClients({ clients, themeColor = "#7c3aed" }: StatsTopClientsProps) {
  if (!clients.length) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
        Aucun client enregistré cette année
      </p>
    );
  }

  const max = clients[0].total;

  return (
    <div className="flex flex-col gap-3">
      {clients.map((client, i) => {
        const pct = max > 0 ? (client.total / max) * 100 : 0;
        const formattedTotal = client.total.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return (
          <div key={client.id} className="flex items-center gap-3">
            {/* Rang */}
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4 shrink-0">
              #{i + 1}
            </span>

            {/* Nom + barre */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {client.name}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 ml-2 shrink-0">
                  {formattedTotal} €
                </span>
              </div>
              {/* Barre de progression */}
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: themeColor, opacity: 0.7 + i * -0.1 }}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {client.count} facture{client.count > 1 ? "s" : ""} payée{client.count > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
