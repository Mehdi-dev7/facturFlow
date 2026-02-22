"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  MonthSelector,
  DataTable,
  ActionButtons,
  ArchiveSection,
  StatusBadge,
} from "@/components/dashboard";
import type { KpiData, Column, AllStatus } from "@/components/dashboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeposits, useDeleteDeposit, type SavedDeposit } from "@/hooks/use-deposits";
import { DepositModal } from "@/components/acomptes/deposit-modal";
import { DepositPreviewModal } from "@/components/acomptes/deposit-preview-modal";

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface DepositRow {
  id: string;
  number: string;
  client: string;
  date: string;
  echeance: string;
  amount: string;
  status: string;
  dbStatus: string;
}

function mapDepositStatus(status: string): AllStatus {
  switch (status) {
    case "DRAFT":   return "à envoyer";
    case "SENT":    return "envoyé";
    case "PAID":    return "payée";
    case "OVERDUE": return "impayée";
    default:        return "à envoyer";
  }
}

function getClientName(client: SavedDeposit["client"]): string {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatAmountFR(amount: number): string {
  return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function toRow(dep: SavedDeposit): DepositRow {
  return {
    id: dep.id,
    number: dep.number,
    client: getClientName(dep.client),
    date: formatDateFR(dep.date),
    echeance: formatDateFR(dep.dueDate),
    amount: formatAmountFR(dep.total),
    status: mapDepositStatus(dep.status) as string,
    dbStatus: dep.status,
  };
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

// ─── Composant interne ────────────────────────────────────────────────────

function DepositsPageContent() {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [previewDeposit, setPreviewDeposit] = useState<SavedDeposit | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch
  const { data: allDeposits = [], isLoading } = useDeposits();
  const deleteMutation = useDeleteDeposit();

  // Map DB id -> SavedDeposit
  const depositMap = useMemo(() => {
    const m = new Map<string, SavedDeposit>();
    for (const dep of allDeposits) m.set(dep.id, dep);
    return m;
  }, [allDeposits]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);
  const handleMonthChange = useCallback((date: Date) => setSelectedMonth(date), []);

  const selectedMonthKey = useMemo(() => {
    const m = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    return `${selectedMonth.getFullYear()}-${m}`;
  }, [selectedMonth]);

  // Conversion en lignes de tableau
  const allRows = useMemo(() => allDeposits.map(toRow), [allDeposits]);

  // Filtrage par mois
  const monthRows = useMemo(
    () =>
      allRows.filter((row) => {
        const dep = depositMap.get(row.id);
        return dep ? getMonthKey(dep.date) === selectedMonthKey : false;
      }),
    [allRows, depositMap, selectedMonthKey],
  );

  // Filtrage par recherche
  const filteredRows = useMemo(() => {
    if (!search.trim()) return monthRows;
    const q = search.toLowerCase();
    return monthRows.filter(
      (row) =>
        row.number.toLowerCase().includes(q) ||
        row.client.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q),
    );
  }, [monthRows, search]);

  // KPIs calculés sur le mois courant
  const kpis = useMemo((): KpiData[] => {
    const total = monthRows.length;
    const paid = monthRows.filter((r) => r.dbStatus === "PAID").length;

    const sentAmount = monthRows
      .filter((r) => r.dbStatus === "SENT")
      .reduce((s, r) => s + (depositMap.get(r.id)?.total ?? 0), 0);
    const overdueAmount = monthRows
      .filter((r) => r.dbStatus === "OVERDUE")
      .reduce((s, r) => s + (depositMap.get(r.id)?.total ?? 0), 0);

    return [
      {
        label: "Acomptes ce mois",
        value: String(total),
        change: `${total} acompte${total > 1 ? "s" : ""}`,
        changeType: "up",
        icon: "file",
        iconBg: "bg-blue-500",
        borderAccent: "border-blue-500/30",
        gradientFrom: "#eff6ff",
        gradientTo: "#bfdbfe",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#1e3a5f",
      },
      {
        label: "Payés",
        value: String(paid),
        change: total > 0 ? ((paid / total) * 100).toFixed(1) + "%" : "0%",
        changeType: "up",
        icon: "check",
        iconBg: "bg-emerald-500",
        borderAccent: "border-emerald-500/30",
        gradientFrom: "#ecfdf5",
        gradientTo: "#a7f3d0",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#064e3b",
      },
      {
        label: "En attente",
        value: formatAmountFR(sentAmount),
        change: `${monthRows.filter((r) => r.dbStatus === "SENT").length} envoyé${monthRows.filter((r) => r.dbStatus === "SENT").length > 1 ? "s" : ""}`,
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
        label: "En retard",
        value: formatAmountFR(overdueAmount),
        change: `${monthRows.filter((r) => r.dbStatus === "OVERDUE").length} en retard`,
        changeType: "down",
        icon: "alert",
        iconBg: "bg-red-500",
        borderAccent: "border-red-500/30",
        gradientFrom: "#fef2f2",
        gradientTo: "#fecaca",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#7f1d1d",
      },
    ];
  }, [monthRows, depositMap]);

  // Colonnes du tableau
  const columns = useMemo(
    (): Column<DepositRow>[] => [
      {
        key: "number",
        label: "N° Acompte",
        render: (row) => (
          <span className="text-xs lg:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors">
            {row.number}
          </span>
        ),
      },
      {
        key: "client",
        label: "Client",
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300">
            {row.client}
          </span>
        ),
      },
      {
        key: "date",
        label: "Émission",
        sortable: true,
        getValue: (row) =>
          new Date(row.date.split("/").reverse().join("-")).getTime(),
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            {row.date}
          </span>
        ),
      },
      {
        key: "echeance",
        label: "Échéance",
        sortable: true,
        getValue: (row) =>
          row.echeance !== "—"
            ? new Date(row.echeance.split("/").reverse().join("-")).getTime()
            : 0,
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            {row.echeance}
          </span>
        ),
      },
      {
        key: "amount",
        label: "Montant",
        align: "right" as const,
        sortable: true,
        getValue: (row) => depositMap.get(row.id)?.total ?? 0,
        render: (row) => (
          <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">
            {row.amount}
          </span>
        ),
      },
      {
        key: "status",
        label: "Statut",
        align: "center" as const,
        render: (row) => <StatusBadge status={row.status as AllStatus} />,
      },
    ],
    [depositMap],
  );

  // Archive
  const archiveData = useMemo(() => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const grouped: Record<number, Record<number, number>> = {};
    for (const dep of allDeposits) {
      const d = new Date(dep.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      if (!grouped[y]) grouped[y] = {};
      grouped[y][m] = (grouped[y][m] || 0) + 1;
    }

    const cy = selectedMonth.getFullYear();
    const cm = selectedMonth.getMonth() + 1;

    return Object.entries(grouped)
      .map(([yearStr, months]) => ({
        year: parseInt(yearStr, 10),
        months: Object.entries(months)
          .filter(([mStr]) => {
            const y = parseInt(yearStr, 10);
            const m = parseInt(mStr, 10);
            return !(y === cy && m === cm);
          })
          .map(([mStr, count]) => ({
            month: monthNames[parseInt(mStr, 10) - 1],
            count,
          }))
          .sort(
            (a, b) => monthNames.indexOf(b.month) - monthNames.indexOf(a.month),
          ),
      }))
      .filter((y) => y.months.length > 0)
      .sort((a, b) => b.year - a.year);
  }, [allDeposits, selectedMonth]);

  const handleArchiveSelect = useCallback(
    (year: number, monthName: string) => {
      const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
      ];
      const idx = monthNames.indexOf(monthName);
      if (idx >= 0) setSelectedMonth(new Date(year, idx, 1));
    },
    [],
  );

  // Ouvrir la modal au clic sur une ligne
  const handleRowClick = useCallback(
    (row: DepositRow) => {
      const dep = depositMap.get(row.id);
      if (dep) {
        setPreviewDeposit(dep);
        setPreviewOpen(true);
      }
    },
    [depositMap],
  );

  // Supprimer avec confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTargetId) return;
    deleteMutation.mutate(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteMutation]);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Acomptes"
        subtitle="Gérez vos acomptes et demandes de dépôt"
        ctaLabel="Nouvel acompte"
        ctaIcon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
        ctaVariant="gradient"
        onCtaClick={() => setDepositModalOpen(true)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Search + Month Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Rechercher par n°, client, statut..."
            onSearch={handleSearch}
          />
        </div>
        <MonthSelector value={selectedMonth} onChange={handleMonthChange} />
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden mb-8">
        <DataTable<DepositRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          mobileFields={["number", "client"]}
          onRowClick={handleRowClick}
          actions={(row) => (
            <ActionButtons
              onDelete={() => setDeleteTargetId(row.id)}
            />
          )}
          emptyTitle={isLoading ? "Chargement…" : "Aucun acompte trouvé"}
          emptyDescription={
            isLoading
              ? "Récupération des acomptes en cours…"
              : "Aucun acompte ne correspond à votre recherche pour ce mois."
          }
        />
      </div>

      {/* Archive Section */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}

      {/* Modal création */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
      />

      {/* Modal aperçu */}
      <DepositPreviewModal
        deposit={previewDeposit}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet acompte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'acompte sera définitivement
              supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="size-4 mr-1.5" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page principale avec Suspense ──────────────────────────────────────────

export default function DepositsPage() {
  return (
    <Suspense>
      <DepositsPageContent />
    </Suspense>
  );
}
