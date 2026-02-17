"use client";

import React from "react";

export type InvoiceStatus = "payée" | "impayée" | "en attente" | "à envoyer" | "envoyée" | "relancée";
export type QuoteStatus = "accepté" | "refusé" | "à envoyer" | "envoyé" | "expiré" | "en attente" | "brouillon";
export type AllStatus = InvoiceStatus | QuoteStatus;

interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
  border: string;
  label: string;
  icon: "check" | "cross" | "dot" | "send" | "expired" | "draft" | "bell" | null;
}

const statusConfig: Record<AllStatus, StatusStyle> = {
  "payée": {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse",
    border: "border border-emerald-300 dark:border-emerald-500/40",
    label: "Payée",
    icon: "check",
  },
  "impayée": {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-800 dark:text-red-300",
    dot: "bg-red-500 dark:bg-red-400 animate-pulse",
    border: "border border-red-300 dark:border-red-500/40",
    label: "Impayée",
    icon: "cross",
  },
  "en attente": {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-400 animate-pulse",
    border: "border border-amber-300 dark:border-amber-500/40",
    label: "En attente",
    icon: "dot",
  },
  "accepté": {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse",
    border: "border border-emerald-300 dark:border-emerald-500/40",
    label: "Accepté",
    icon: "check",
  },
  "refusé": {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-800 dark:text-red-300",
    dot: "bg-red-500 dark:bg-red-400 animate-pulse",
    border: "border border-red-300 dark:border-red-500/40",
    label: "Refusé",
    icon: "cross",
  },
  "brouillon": {
    bg: "bg-slate-100 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400 dark:bg-slate-500",
    border: "border border-slate-300 dark:border-slate-500/40",
    label: "Brouillon",
    icon: "draft",
  },
  "envoyé": {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-800 dark:text-blue-300",
    dot: "bg-blue-500 dark:bg-blue-400 animate-pulse",
    border: "border border-blue-300 dark:border-blue-500/40",
    label: "Envoyé",
    icon: "send",
  },
  "expiré": {
    bg: "bg-orange-100 dark:bg-orange-500/20",
    text: "text-orange-800 dark:text-orange-300",
    dot: "bg-orange-500 dark:bg-orange-400",
    border: "border border-orange-300 dark:border-orange-500/40",
    label: "Expiré",
    icon: "expired",
  },
  // Statuts facture enrichis
  "à envoyer": {
    bg: "bg-slate-100 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400 dark:bg-slate-500",
    border: "border border-slate-300 dark:border-slate-500/40",
    label: "À envoyer",
    icon: "draft",
  },
  "envoyée": {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-800 dark:text-blue-300",
    dot: "bg-blue-500 dark:bg-blue-400 animate-pulse",
    border: "border border-blue-300 dark:border-blue-500/40",
    label: "Envoyée",
    icon: "send",
  },
  "relancée": {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-800 dark:text-red-300",
    dot: "bg-red-500 dark:bg-red-400 animate-pulse",
    border: "border border-red-300 dark:border-red-500/40",
    label: "Relancée",
    icon: "bell",
  },
};

function StatusIcon({ icon, cfg }: { icon: StatusStyle["icon"]; cfg: StatusStyle }) {
  switch (icon) {
    case "check":
      return (
        <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "cross":
      return (
        <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "dot":
      return <span className={`h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full ${cfg.dot}`} />;
    case "send":
      return (
        <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      );
    case "expired":
      return (
        <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "draft":
      return (
        <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "bell":
      return (
        <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    default:
      return null;
  }
}

export function StatusBadge({ status }: { status: AllStatus }) {
  const cfg = statusConfig[status] ?? statusConfig["en attente"];
  return (
    <span className={`inline-flex items-center gap-1 lg:gap-1.5 rounded-full px-2 py-1 lg:px-3 lg:py-1.5 text-[10px] lg:text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <StatusIcon icon={cfg.icon} cfg={cfg} />
      {cfg.label}
    </span>
  );
}

export { statusConfig };
