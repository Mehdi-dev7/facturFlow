"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Pause, Play, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  DataTable,
  ActionButtons,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { useRecurrings, useToggleRecurring, useDeleteRecurring, type SavedRecurring } from "@/hooks/use-recurring";
import { RecurringModal } from "@/components/recurring/recurring-modal";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface RecurringRow {
  id: string;
  label: string;
  client: string;
  totalAmount: string;
  frequency: string;
  frequencyKey: string;
  nextDate: string;
  paymentMethod: string;
  paymentKey: string;
  active: boolean;
  _raw: SavedRecurring;
}

// Labels fréquence
const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Hebdo",
  BIWEEKLY: "Bi-hebdo",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  SEMIYEARLY: "Semestriel",
  YEARLY: "Annuel",
};

// Labels paiement
const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Virement",
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  SEPA: "SEPA",
};

function getClientName(client: SavedRecurring["client"]): string {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email || "Client sans nom";
}

function formatDateFR(iso: string | null): string {
  if (!iso) return "---";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function toRow(recurring: SavedRecurring, currency: string): RecurringRow {
  return {
    id: recurring.id,
    label: recurring.label ?? "Sans nom",
    client: getClientName(recurring.client),
    totalAmount: formatCurrency(recurring.totalAmount, currency),
    frequency: FREQUENCY_LABELS[recurring.frequency] ?? recurring.frequency,
    frequencyKey: recurring.frequency,
    nextDate: formatDateFR(recurring.nextDate),
    paymentMethod: PAYMENT_LABELS[recurring.paymentMethod ?? ""] ?? "---",
    paymentKey: recurring.paymentMethod ?? "",
    active: recurring.active,
    _raw: recurring,
  };
}

// ─── Badges de fréquence ──────────────────────────────────────────────────────

const FREQUENCY_COLORS: Record<string, string> = {
  WEEKLY: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  BIWEEKLY: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  MONTHLY: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  QUARTERLY: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  SEMIYEARLY: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  YEARLY: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
};

const PAYMENT_COLORS: Record<string, string> = {
  BANK_TRANSFER: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  STRIPE: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  PAYPAL: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  SEPA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

// ─── Colonnes du tableau ──────────────────────────────────────────────────────

const columns: Column<RecurringRow>[] = [
  {
    key: "label",
    label: "Récurrence",
    headerClassName: "md:w-[160px] lg:w-auto",
    cellClassName: "md:w-[160px] lg:w-auto overflow-hidden",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="text-[11px] lg:text-xs xl:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors block truncate md:max-w-[140px] lg:max-w-none">
          {row.label}
        </span>
        {!row.active && (
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            Pausée
          </span>
        )}
      </div>
    ),
  },
  {
    key: "client",
    label: "Client",
    headerClassName: "md:w-[120px] lg:w-auto",
    cellClassName: "md:w-[120px] lg:w-auto overflow-hidden",
    render: (row) => (
      <span className="text-[11px] lg:text-xs xl:text-sm text-slate-700 dark:text-slate-300 block truncate md:max-w-[100px] lg:max-w-none">
        {row.client}
      </span>
    ),
  },
  {
    key: "totalAmount",
    label: "Montant/ech.",
    align: "right" as const,
    sortable: true,
    getValue: (row) => row._raw.totalAmount,
    render: (row) => (
      <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">
        {row.totalAmount}
      </span>
    ),
  },
  {
    key: "frequency",
    label: "Fréquence",
    align: "center" as const,
    render: (row) => (
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] xs:text-xs font-medium rounded-full ${FREQUENCY_COLORS[row.frequencyKey] ?? "bg-slate-100 text-slate-600"}`}>
        {row.frequency}
      </span>
    ),
  },
  {
    key: "nextDate",
    label: "Prochaine date",
    sortable: true,
    getValue: (row) => new Date(row._raw.nextDate).getTime(),
    render: (row) => (
      <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{row.nextDate}</span>
    ),
  },
  {
    key: "paymentMethod",
    label: "Paiement",
    align: "center" as const,
    render: (row) => (
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] xs:text-xs font-medium rounded-full ${PAYMENT_COLORS[row.paymentKey] ?? "bg-slate-100 text-slate-600"}`}>
        {row.paymentMethod}
      </span>
    ),
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export function RecurringPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // La modale est gardée pour une éventuelle utilisation future
  const [modalOpen, setModalOpen] = useState(false);

  // Donnees
  const { currency } = useAppearance();
  const { data: recurrings = [] } = useRecurrings();
  const toggleMutation = useToggleRecurring();
  const deleteMutation = useDeleteRecurring();

  // Mapper en lignes de tableau
  const rows: RecurringRow[] = useMemo(() => recurrings.map((r) => toRow(r, currency)), [recurrings, currency]);

  // ─── KPIs dynamiques ──────────────────────────────────────────────────────

  const kpis: KpiData[] = useMemo(() => {
    const activeRecurrings = recurrings.filter((r) => r.active);
    const activeCount = activeRecurrings.length;
    const monthlyRevenue = activeRecurrings.reduce((sum, r) => sum + r.monthlyAmount, 0);
    const totalInvoices = recurrings.reduce((sum, r) => sum + r.invoiceCount, 0);

    // Prochaine génération : la date la plus proche parmi les actives
    const nextGen = activeRecurrings
      .map((r) => ({ date: new Date(r.nextDate), label: r.label }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    const nextGenLabel = nextGen
      ? nextGen.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
      : "---";

    return [
      {
        label: "Récurrences actives",
        value: String(activeCount),
        change: `${activeCount} active${activeCount > 1 ? "s" : ""}`,
        changeType: "up",
        icon: "repeat",
        iconBg: "bg-violet-500",
        borderAccent: "border-violet-500/30",
        gradientFrom: "#f5f3ff",
        gradientTo: "#ddd6fe",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#2e1065",
      },
      {
        label: "CA récurrent / mois",
        value: formatCurrency(monthlyRevenue, currency),
        change: `${activeCount} source${activeCount > 1 ? "s" : ""}`,
        changeType: "up",
        icon: "trend-up",
        iconBg: "bg-emerald-500",
        borderAccent: "border-emerald-500/30",
        gradientFrom: "#ecfdf5",
        gradientTo: "#a7f3d0",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#064e3b",
      },
      {
        label: "Prochaine génération",
        value: nextGenLabel,
        change: nextGen?.label ?? "---",
        changeType: "neutral",
        icon: "clock",
        iconBg: "bg-amber-500",
        borderAccent: "border-amber-500/30",
        gradientFrom: "#fffbeb",
        gradientTo: "#fde68a",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#78350f",
      },
      {
        label: "Factures générées",
        value: String(totalInvoices),
        change: "au total",
        changeType: "neutral",
        icon: "file",
        iconBg: "bg-blue-500",
        borderAccent: "border-blue-500/30",
        gradientFrom: "#eff6ff",
        gradientTo: "#bfdbfe",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#1e3a5f",
      },
    ] satisfies KpiData[];
  }, [recurrings, currency]);

  // ─── Filtrage par recherche ──────────────────────────────────────────────────

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) => r.label.toLowerCase().includes(q) || r.client.toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleToggle = useCallback(
    (row: RecurringRow) => {
      toggleMutation.mutate(row.id);
    },
    [toggleMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    deleteMutation.mutate(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteMutation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Récurrences"
        subtitle="Automatisez la génération de vos factures"
        ctaLabel="Nouvelle récurrence"
        ctaIcon={<Plus className="size-4" />}
        onCtaClick={() => router.push("/dashboard/recurring/new")}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Rechercher par nom, client..."
            onSearch={setSearchQuery}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden mb-8">
        <DataTable<RecurringRow>
          columns={columns}
          data={filteredRows}
          getRowId={(row) => row.id}
          limit={10}
          mobileFields={["label", "client"]}
          mobileAmountKey="totalAmount"
          actions={(row) => (
            <div className="flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1">
              {/* Toggle pause/reprendre */}
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(row); }}
                className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-100 dark:text-violet-400 dark:hover:text-amber-400 dark:hover:bg-amber-500/20 transition-all duration-300 cursor-pointer"
                aria-label={row.active ? "Mettre en pause" : "Reprendre"}
                title={row.active ? "Mettre en pause" : "Reprendre"}
              >
                {row.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              {/* Supprimer */}
              <ActionButtons
                onDelete={() => setDeleteTargetId(row.id)}
              />
            </div>
          )}
          emptyTitle="Aucune récurrence"
          emptyDescription="Créez votre première récurrence pour automatiser vos factures."
        />
      </div>

      {/* Modale de création */}
      <RecurringModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        documentLabel="la récurrence"
        documentNumber={deleteTargetId ? (recurrings.find((r) => r.id === deleteTargetId)?.label ?? "") : ""}
      />
    </div>
  );
}
