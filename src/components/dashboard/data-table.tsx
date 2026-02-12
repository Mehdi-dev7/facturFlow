"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { SortIcon } from "./icons";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
  getValue?: (item: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (item: T) => string;
  mobileFields?: string[];
  actions?: (item: T) => React.ReactNode;
  mobileActions?: (item: T) => React.ReactNode;
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
  actions,
  mobileActions,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Il n'y a rien à afficher pour le moment.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const mobileCols = mobileFields
    ? columns.filter((c) => mobileFields.includes(c.key))
    : columns.slice(0, 2);

  const expandedCols = columns.filter((c) => !mobileCols.some((mc) => mc.key === c.key));

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
      {/* Mobile: Accordion View */}
      <div className="md:hidden divide-y divide-slate-200 dark:divide-violet-500/20">
        {sortedData.map((item) => {
          const id = getRowId(item);
          const isExpanded = expandedId === id;
          return (
            <div key={id}>
              <div
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
              >
                <div
                  className="flex items-center gap-3 min-w-0 flex-1"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isExpanded ? null : id); } }}
                >
                  {mobileCols.map((col) => (
                    <span key={col.key} className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-2">
                  {(mobileActions ?? actions) && (mobileActions ?? actions)!(item)}
                  <ChevronDown
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 cursor-pointer ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
              <div
                className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-3.5 pt-0 flex flex-col gap-2 bg-violet-50/50 dark:bg-violet-950/30">
                    {expandedCols.map((col) => (
                      <div key={col.key} className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{col.label}</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-violet-500/20 bg-violet-200/90 dark:bg-violet-950/50">
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`px-3 lg:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider ${
                    i < columns.length - 1 ? "border-r border-slate-200 dark:border-violet-500/20" : ""
                  } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
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
                <th className="w-20 px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-violet-300 uppercase tracking-wider">
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
                    className={`px-3 lg:px-6 py-3.5 ${
                      i < columns.length - 1 || actions ? "border-r border-slate-200 dark:border-violet-500/15" : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                  >
                    {col.render ? col.render(item) : (
                      <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300">
                        {String((item as Record<string, unknown>)[col.key] ?? "")}
                      </span>
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="w-20 px-2 py-3.5 text-center">
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
