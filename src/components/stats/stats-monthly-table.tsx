"use client";

import type { MonthlyStats } from "@/lib/actions/statistics";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

interface StatsMonthlyTableProps {
  data: MonthlyStats[];
}

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function StatsMonthlyTable({ data }: StatsMonthlyTableProps) {
  const { currency } = useAppearance();
  // Totaux
  const totals = data.reduce(
    (acc, row) => ({
      invoicesPaid: acc.invoicesPaid + row.invoicesPaid,
      invoicesSent: acc.invoicesSent + row.invoicesSent,
      quotesTotal:  acc.quotesTotal  + row.quotesTotal,
      depositsTotal: acc.depositsTotal + row.depositsTotal,
    }),
    { invoicesPaid: 0, invoicesSent: 0, quotesTotal: 0, depositsTotal: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm border-collapse min-w-[580px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left p-2 sm:p-3 font-semibold text-slate-600 dark:text-slate-300">
              Mois
            </th>
            <th className="text-right p-2 sm:p-3 font-semibold text-slate-600 dark:text-slate-300">
              CA encaissé
            </th>
            <th className="text-right p-2 sm:p-3 font-semibold text-slate-600 dark:text-slate-300">
              En attente
            </th>
            <th className="text-right p-2 sm:p-3 font-semibold text-slate-600 dark:text-slate-300">
              Devis
            </th>
            <th className="text-right p-2 sm:p-3 font-semibold text-slate-600 dark:text-slate-300">
              Acomptes
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const hasData =
              row.invoicesPaid > 0 || row.invoicesSent > 0 ||
              row.quotesTotal > 0 || row.depositsTotal > 0;

            return (
              <tr
                key={row.month}
                className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                  hasData ? "" : "opacity-40"
                }`}
              >
                <td className="p-2 sm:p-3 text-slate-700 dark:text-slate-300 font-medium">
                  {MONTH_LABELS[row.month]}
                </td>
                <td className="p-2 sm:p-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                  {row.invoicesPaid > 0 ? formatCurrency(row.invoicesPaid, currency) : "—"}
                </td>
                <td className="p-2 sm:p-3 text-right text-amber-600 dark:text-amber-400">
                  {row.invoicesSent > 0 ? formatCurrency(row.invoicesSent, currency) : "—"}
                </td>
                <td className="p-2 sm:p-3 text-right text-blue-600 dark:text-blue-400">
                  {row.quotesTotal > 0 ? formatCurrency(row.quotesTotal, currency) : "—"}
                </td>
                <td className="p-2 sm:p-3 text-right text-violet-600 dark:text-violet-400">
                  {row.depositsTotal > 0 ? formatCurrency(row.depositsTotal, currency) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Ligne totaux */}
        <tfoot>
          <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
            <td className="p-2 sm:p-3 font-bold text-slate-800 dark:text-slate-100">
              Total
            </td>
            <td className="p-2 sm:p-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totals.invoicesPaid, currency)}
            </td>
            <td className="p-2 sm:p-3 text-right font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(totals.invoicesSent, currency)}
            </td>
            <td className="p-2 sm:p-3 text-right font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(totals.quotesTotal, currency)}
            </td>
            <td className="p-2 sm:p-3 text-right font-bold text-violet-700 dark:text-violet-300">
              {formatCurrency(totals.depositsTotal, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
