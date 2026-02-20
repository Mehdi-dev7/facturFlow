"use client";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { StatusBadge, type InvoiceStatus } from "./status-badge";
import { useUpdateInvoiceStatus } from "@/hooks/use-invoices";

// ─── Mapping DB → UI ──────────────────────────────────────────────────────────

const DB_TO_UI: Record<string, InvoiceStatus> = {
  DRAFT:    "à envoyer",
  SENT:     "envoyée",
  PAID:     "payée",
  OVERDUE:  "impayée",
  REMINDED: "relancée",
};

// ─── Transitions disponibles par statut DB ────────────────────────────────────

interface Transition {
  status: string;
  label: string;
  color: string;
}

const TRANSITIONS: Record<string, Transition[]> = {
  DRAFT: [
    { status: "SENT",  label: "Marquer comme envoyée",  color: "text-blue-500" },
    { status: "PAID",  label: "Marquer comme payée",    color: "text-emerald-500" },
  ],
  SENT: [
    { status: "PAID",    label: "Marquer comme payée",    color: "text-emerald-500" },
    { status: "OVERDUE", label: "Marquer comme impayée",  color: "text-orange-500" },
  ],
  OVERDUE: [
    { status: "PAID",     label: "Marquer comme payée",    color: "text-emerald-500" },
    { status: "REMINDED", label: "Marquer comme relancée", color: "text-red-500" },
  ],
  REMINDED: [
    { status: "PAID", label: "Marquer comme payée", color: "text-emerald-500" },
  ],
  // Retour arrière possible en cas d'erreur
  PAID: [
    { status: "SENT",    label: "Annuler → Envoyée",  color: "text-blue-500" },
    { status: "OVERDUE", label: "Annuler → Impayée",  color: "text-orange-500" },
  ],
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface StatusDropdownProps {
  invoiceId: string;
  dbStatus: string;
}

export function StatusDropdown({ invoiceId, dbStatus }: StatusDropdownProps) {
  const updateStatus = useUpdateInvoiceStatus();

  const uiStatus = DB_TO_UI[dbStatus] ?? "à envoyer";
  const transitions = TRANSITIONS[dbStatus] ?? [];

  // Statut final → badge statique partout
  if (transitions.length === 0) {
    return <StatusBadge status={uiStatus} />;
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Mobile/tablette : badge statique, pas de dropdown */}
      <span className="lg:hidden">
        <StatusBadge status={uiStatus} />
      </span>

      {/* Desktop lg+ : dropdown interactif */}
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            className="hidden lg:inline-flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:opacity-80 transition-opacity cursor-pointer"
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
            // Style identique aux modales du projet (company-info-modal, etc.)
            className="z-50 w-52 origin-(--radix-dropdown-menu-content-transform-origin) rounded-xl border border-primary/20 dark:border-violet-400/25 bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] shadow-lg dark:shadow-violet-950/40 p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-violet-400 mb-1">
              Changer le statut
            </p>

            {transitions.map((t) => (
              <DropdownMenuPrimitive.Item
                key={t.status}
                onSelect={() => updateStatus.mutate({ id: invoiceId, status: t.status })}
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
