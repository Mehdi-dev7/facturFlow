"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import { SortIcon } from "./icons";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
  getValue?: (item: T) => string | number;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (item: T) => string;
  mobileFields?: string[];
  // Clé de colonne à afficher comme badge de statut au centre de la ligne mobile.
  mobileStatusKey?: string;
  // Clé de colonne à afficher sous le badge de statut sur mobile (ex: montant TTC).
  mobileAmountKey?: string;
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

type SortDir = "asc" | "desc";

export function parseDate(d: string): number {
  const [day, month, year] = d.split("/");
  return new Date(`${year}-${month}-${day}`).getTime();
}

export function parseAmount(a: string): number {
  return parseFloat(a.replace(/[^\d,]/g, "").replace(",", "."));
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  mobileFields,
  mobileStatusKey,
  mobileAmountKey,
  actions,
  onRowClick,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Il n'y a rien à afficher pour le moment.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.getValue) return data;
    return [...data].sort((a, b) => {
      const aVal = col.getValue!(a);
      const bVal = col.getValue!(b);
      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), "fr");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, columns, sortKey, sortDir]);

  // Colonnes affichées à gauche sur mobile
  const mobileCols = mobileFields
    ? columns.filter((c) => mobileFields.includes(c.key))
    : columns.slice(0, 2);

  // Colonne statut affichée au centre sur mobile
  const mobileStatusCol = mobileStatusKey
    ? columns.find((c) => c.key === mobileStatusKey)
    : undefined;

  // Colonne montant affichée sous le statut sur mobile
  const mobileAmountCol = mobileAmountKey
    ? columns.find((c) => c.key === mobileAmountKey)
    : undefined;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-violet-500/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-violet-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{emptyTitle}</p>
        <p className="text-xs text-slate-400 dark:text-violet-400 mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile : carte à 2 lignes ── */}
      <div className="md:hidden divide-y divide-slate-200 dark:divide-violet-500/20">
        {sortedData.map((item) => {
          const id = getRowId(item);
          return (
            <div
              key={id}
              className="px-4 py-2 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick?.(item);
                }
              }}
            >
              {/* Ligne 1 : n° facture (gauche) + statut (droite) */}
              <div className="flex items-center justify-between mb-2.5">
                {mobileCols[0] && (
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 truncate max-w-[55%]">
                    {mobileCols[0].render
                      ? mobileCols[0].render(item)
                      : String((item as Record<string, unknown>)[mobileCols[0].key] ?? "")}
                  </span>
                )}
                {mobileStatusCol && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {mobileStatusCol.render
                      ? mobileStatusCol.render(item)
                      : (
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {String((item as Record<string, unknown>)[mobileStatusCol.key] ?? "")}
                        </span>
                      )}
                  </div>
                )}
              </div>

              {/* Ligne 2 : client (gauche) + montant (droite) */}
              <div className="flex items-center justify-between">
                {mobileCols[1] && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
                    {mobileCols[1].render
                      ? mobileCols[1].render(item)
                      : String((item as Record<string, unknown>)[mobileCols[1].key] ?? "")}
                  </span>
                )}
                {mobileAmountCol && (
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 shrink-0">
                    {String((item as Record<string, unknown>)[mobileAmountCol.key] ?? "")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop/tablette : vue table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-violet-500/20 bg-violet-200/90 dark:bg-violet-950/50">
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`px-3 lg:px-6 py-3 text-[10px] lg:text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider ${
                    i < columns.length - 1 ? "border-r border-slate-200 dark:border-violet-500/20" : ""
                  } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.headerClassName ?? ""}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors ${col.align === "right" ? "ml-auto" : col.align === "center" ? "mx-auto" : ""}`}
                    >
                      {col.label} <SortIcon direction={sortKey === col.key ? sortDir : null} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {actions && (
                <th className="hidden lg:table-cell w-12 px-1 py-3 text-center text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider">
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={getRowId(item)} className="border-b border-slate-200 dark:border-violet-500/20 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer group">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    onClick={() => onRowClick?.(item)}
                    className={`px-3 lg:px-6 py-3.5 ${
                      i < columns.length - 1 || actions ? "border-r border-slate-200 dark:border-violet-500/15" : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""} ${col.cellClassName ?? ""}`}
                  >
                    {col.render ? col.render(item) : (
                      <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300">
                        {String((item as Record<string, unknown>)[col.key] ?? "")}
                      </span>
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="hidden lg:table-cell w-12 px-1 py-3.5 text-center">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
