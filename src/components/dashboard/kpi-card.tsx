"use client";

import React, { useState, useEffect } from "react";
import { iconMap, TrendUpIcon, TrendDownIcon, MinusIcon } from "./icons";

export interface KpiData {
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

export function KpiCard({ data, index }: { data: KpiData; index: number }) {
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
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-white ${data.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            {IconComponent && <IconComponent />}
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold ${
            data.changeType === "up" ? "bg-emerald-100 text-emerald-700"
            : data.changeType === "down" ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
          }`}>
            {data.changeType === "up" ? <TrendUpIcon /> : data.changeType === "down" ? <TrendDownIcon /> : <MinusIcon />}
            {data.change}
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">{data.value}</p>
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-violet-300">{data.label}</p>
      </div>
      <div className={`h-1 w-full ${data.iconBg} opacity-60 transition-opacity duration-300 group-hover:opacity-100`} />
    </div>
  );
}
