"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ArchiveMonth {
  month: string;
  count: number;
}

interface ArchiveYear {
  year: number;
  months: ArchiveMonth[];
}

interface ArchiveSectionProps {
  data: ArchiveYear[];
  onSelect: (year: number, month: string) => void;
}

export function ArchiveSection({ data, onSelect }: ArchiveSectionProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Archives</h3>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-violet-500/20">
        {data.map((yearData) => {
          const isExpanded = expandedYear === yearData.year;
          return (
            <div key={yearData.year}>
              <button
                onClick={() => setExpandedYear(isExpanded ? null : yearData.year)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{yearData.year}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="px-4 sm:px-6 pb-3 flex flex-wrap gap-2 mt-3">
                    {yearData.months.map((m) => (
                      <button
                        key={m.month}
                        onClick={() => onSelect(yearData.year, m.month)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/25 transition-colors cursor-pointer"
                      >
                        {m.month} ({m.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
