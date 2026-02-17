"use client";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { StatusBadge, type QuoteStatus } from "./status-badge";
import { useUpdateQuoteStatus } from "@/hooks/use-quotes";

// ─── Mapping DB → UI ──────────────────────────────────────────────────────────

const DB_TO_UI: Record<string, QuoteStatus> = {
  DRAFT:     "à envoyer",
  SENT:      "envoyé",
  ACCEPTED:  "accepté",
  REJECTED:  "refusé",
  CANCELLED: "expiré",
};

// ─── Transitions disponibles par statut DB ────────────────────────────────────

interface Transition {
  status: string;
  label: string;
  color: string;
}

const TRANSITIONS: Record<string, Transition[]> = {
  DRAFT: [
    { status: "SENT", label: "Marquer comme envoyé", color: "text-blue-500" },
  ],
  SENT: [
    { status: "ACCEPTED", label: "Marquer comme accepté", color: "text-emerald-500" },
    { status: "REJECTED", label: "Marquer comme refusé",  color: "text-red-500" },
  ],
  ACCEPTED: [
    { status: "SENT", label: "Annuler → Envoyé", color: "text-blue-500" },
  ],
  REJECTED: [
    { status: "SENT", label: "Annuler → Envoyé", color: "text-blue-500" },
  ],
  CANCELLED: [
    { status: "SENT", label: "Annuler → Envoyé", color: "text-blue-500" },
  ],
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface StatusDropdownQuoteProps {
  quoteId: string;
  dbStatus: string;
}

export function StatusDropdownQuote({ quoteId, dbStatus }: StatusDropdownQuoteProps) {
  const updateStatus = useUpdateQuoteStatus();

  const uiStatus = DB_TO_UI[dbStatus] ?? "à envoyer";
  const transitions = TRANSITIONS[dbStatus] ?? [];

  // Pas de transitions disponibles → badge statique
  if (transitions.length === 0) {
    return <StatusBadge status={uiStatus} />;
  }

  return (
    // stopPropagation pour ne pas ouvrir la modal de prévisualisation
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            className="inline-flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Changer le statut"
          >
            <StatusBadge status={uiStatus} />
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="center"
            side="bottom"
            sideOffset={6}
            className="z-50 w-52 origin-(--radix-dropdown-menu-content-transform-origin) rounded-xl border border-primary/20 dark:border-violet-400/25 bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] shadow-lg dark:shadow-violet-950/40 p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-violet-400 mb-1">
              Changer le statut
            </p>

            {transitions.map((t) => (
              <DropdownMenuPrimitive.Item
                key={t.status}
                onSelect={() => updateStatus.mutate({ id: quoteId, status: t.status })}
                disabled={updateStatus.isPending}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-violet-100/60 dark:hover:bg-violet-500/10 focus:bg-violet-100/60 dark:focus:bg-violet-500/10 focus:outline-none cursor-pointer select-none disabled:opacity-50 disabled:cursor-wait"
              >
                <Check className={`h-3.5 w-3.5 shrink-0 ${t.color}`} />
                {t.label}
              </DropdownMenuPrimitive.Item>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}
