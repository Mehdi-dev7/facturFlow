"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  MonthSelector,
  DataTable,
  ActionButtons,
  ArchiveSection,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import type { InvoiceStatus } from "@/components/dashboard/status-badge";
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
import { useInvoices, useDeleteInvoice, type SavedInvoice } from "@/hooks/use-invoices";
import { StatusDropdown } from "@/components/dashboard/status-dropdown";
import { InvoicePreviewModal } from "@/components/factures/invoice-preview-modal";

// ─── Types & helpers ──────────────────────────────────────────────────────────

// Ligne de tableau simplifiée pour DataTable
interface InvoiceRow {
  id: string;      // UUID DB (pour les actions)
  number: string;  // N° facture affiché (FAC-2025-0001)
  client: string;
  date: string;    // DD/MM/YYYY
  echeance: string;
  amount: string;
  status: InvoiceStatus;
  dbStatus: string; // Statut DB brut pour le dropdown
}

const statusOrder: Record<InvoiceStatus, number> = {
  relancée: 0,
  impayée: 1,
  envoyée: 2,
  "en attente": 3,
  "à envoyer": 4,
  payée: 5,
};

function mapDocStatus(status: string): InvoiceStatus {
  switch (status) {
    case "DRAFT":    return "à envoyer";
    case "SENT":     return "envoyée";
    case "PAID":     return "payée";
    case "OVERDUE":  return "impayée";
    case "REMINDED": return "relancée";
    default:         return "à envoyer";
  }
}

function getClientName(client: SavedInvoice["client"]): string {
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

function toRow(inv: SavedInvoice): InvoiceRow {
  return {
    id: inv.id,
    number: inv.number,
    client: getClientName(inv.client),
    date: formatDateFR(inv.date),
    echeance: formatDateFR(inv.dueDate),
    amount: formatAmountFR(inv.total),
    status: mapDocStatus(inv.status),
    dbStatus: inv.status,
  };
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

// ─── Composant interne qui lit searchParams ────────────────────────────────

function InvoicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [previewInvoice, setPreviewInvoice] = useState<SavedInvoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch real data
  const { data: allInvoices = [], isLoading } = useInvoices();
  const deleteMutation = useDeleteInvoice();

  // Map DB id → SavedInvoice pour accès rapide
  const invoiceMap = useMemo(() => {
    const m = new Map<string, SavedInvoice>();
    for (const inv of allInvoices) m.set(inv.id, inv);
    return m;
  }, [allInvoices]);

  // Ouvrir la modal si ?preview=<id> dans l'URL (après chargement des données)
  const previewOpenedRef = useRef(false);
  useEffect(() => {
    if (!previewId || isLoading || previewOpenedRef.current) return;
    const inv = invoiceMap.get(previewId);
    if (inv) {
      // Vérifier que ce n'est pas un brouillon temporaire
      if (!inv.number.startsWith("BROUILLON-")) {
        previewOpenedRef.current = true;
        setPreviewInvoice(inv);
        setPreviewOpen(true);
      }
    }
  }, [previewId, invoiceMap, isLoading]);

  // Nettoyer ?preview= de l'URL quand la modal se ferme
  const handlePreviewClose = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open && previewId) {
      previewOpenedRef.current = false;
      router.replace("/dashboard/invoices", { scroll: false });
    }
  }, [previewId, router]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);
  const handleMonthChange = useCallback((date: Date) => setSelectedMonth(date), []);

  const selectedMonthKey = useMemo(() => {
    const m = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    return `${selectedMonth.getFullYear()}-${m}`;
  }, [selectedMonth]);

  // Conversion en lignes de tableau
  const allRows = useMemo(() => allInvoices.map(toRow), [allInvoices]);

  // Filtrage par mois
  const monthRows = useMemo(
    () => allRows.filter((row) => {
      const inv = invoiceMap.get(row.id);
      return inv ? getMonthKey(inv.date) === selectedMonthKey : false;
    }),
    [allRows, invoiceMap, selectedMonthKey],
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
    const paid = monthRows.filter((r) => r.status === "payée").length;
    const pending = monthRows.filter((r) => r.status === "en attente").length;
    const unpaid = monthRows.filter((r) => r.status === "impayée").length;

    const pendingAmount = monthRows
      .filter((r) => r.status === "en attente")
      .reduce((s, r) => s + (invoiceMap.get(r.id)?.total ?? 0), 0);
    const unpaidAmount = monthRows
      .filter((r) => r.status === "impayée")
      .reduce((s, r) => s + (invoiceMap.get(r.id)?.total ?? 0), 0);

    const paidPct = total > 0 ? ((paid / total) * 100).toFixed(1) + "%" : "0%";
    const fmtPending = formatAmountFR(pendingAmount);
    const fmtUnpaid = formatAmountFR(unpaidAmount);

    return [
      {
        label: "Factures ce mois",
        value: String(total),
        change: `${total} facture${total > 1 ? "s" : ""}`,
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
        label: "Payées",
        value: String(paid),
        change: paidPct,
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
        value: String(pending),
        change: fmtPending,
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
        label: "Impayées",
        value: String(unpaid),
        change: fmtUnpaid,
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
  }, [monthRows, invoiceMap]);

  // Colonnes du tableau
  const columns = useMemo((): Column<InvoiceRow>[] => [
    {
      key: "number",
      label: "N° Facture",
      headerClassName: "md:w-[120px] lg:w-auto",
      cellClassName: "md:w-[120px] lg:w-auto",
      render: (row) => (
        <span className="text-[11px] lg:text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors block truncate md:max-w-[100px] lg:max-w-none">
          {row.number}
        </span>
      ),
    },
    {
      key: "client",
      label: "Client",
      headerClassName: "md:w-[120px] lg:w-auto",
      cellClassName: "md:w-[120px] lg:w-auto",
      render: (row) => (
        <span className="text-[11px] lg:text-xs text-slate-700 dark:text-slate-300 block truncate md:max-w-[100px] lg:max-w-none">{row.client}</span>
      ),
    },
    {
      key: "date",
      label: "Émission",
      sortable: true,
      getValue: (row) => new Date(row.date.split("/").reverse().join("-")).getTime(),
      render: (row) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{row.date}</span>
      ),
    },
    {
      key: "echeance",
      label: "Échéance",
      sortable: true,
      getValue: (row) => row.echeance !== "—" ? new Date(row.echeance.split("/").reverse().join("-")).getTime() : 0,
      render: (row) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{row.echeance}</span>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      align: "right" as const,
      sortable: true,
      getValue: (row) => invoiceMap.get(row.id)?.total ?? 0,
      render: (row) => (
        <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">{row.amount}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      align: "center" as const,
      sortable: true,
      getValue: (row) => statusOrder[row.status],
      headerClassName: "md:w-[115px] lg:w-auto",
      cellClassName: "md:w-[115px] lg:w-auto",
      render: (row) => (
        <StatusDropdown invoiceId={row.id} dbStatus={row.dbStatus} />
      ),
    },
  ], [invoiceMap]);

  // Archive
  const archiveData = useMemo(() => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const grouped: Record<number, Record<number, number>> = {};
    for (const inv of allInvoices) {
      const d = new Date(inv.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      if (!grouped[y]) grouped[y] = {};
      grouped[y][m] = (grouped[y][m] || 0) + 1;
    }

    const cy = selectedMonth.getFullYear();
    const cm = selectedMonth.getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return Object.entries(grouped)
      .map(([yearStr, months]) => ({
        year: parseInt(yearStr, 10),
        months: Object.entries(months)
          .filter(([mStr]) => {
            const y = parseInt(yearStr, 10);
            const m = parseInt(mStr, 10);
            // Exclure le mois courant ET ne montrer que les années antérieures à l'année courante
            return !(y === cy && m === cm) && y < currentYear;
          })
          .map(([mStr, count]) => ({
            month: monthNames[parseInt(mStr, 10) - 1],
            count,
          }))
          .sort((a, b) => monthNames.indexOf(b.month) - monthNames.indexOf(a.month)),
      }))
      .filter((y) => y.months.length > 0)
      .sort((a, b) => b.year - a.year);
  }, [allInvoices, selectedMonth]);

  const handleArchiveSelect = useCallback((year: number, monthName: string) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const idx = monthNames.indexOf(monthName);
    if (idx >= 0) setSelectedMonth(new Date(year, idx, 1));
  }, []);

  // Ouvrir la modal au clic sur une ligne (vrais brouillons → page d'édition)
  const handleRowClick = useCallback((row: InvoiceRow) => {
    const inv = invoiceMap.get(row.id);
    if (!inv) return;
    
    // Si c'est un vrai brouillon (numéro temporaire), aller vers l'édition
    if (row.dbStatus === "DRAFT" && inv.number.startsWith("BROUILLON-")) {
      router.push(`/dashboard/invoices/${row.id}/edit`);
      return;
    }
    
    // Sinon, ouvrir la modal de prévisualisation
    setPreviewInvoice(inv);
    setPreviewOpen(true);
  }, [invoiceMap, router]);

  // Toujours aller vers le formulaire d'édition (pour le bouton "Éditer")
  const handleEdit = useCallback((row: InvoiceRow) => {
    router.push(`/dashboard/invoices/${row.id}/edit`);
  }, [router]);

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
        title="Factures"
        subtitle="Gérez vos factures"
        ctaLabel="Nouvelle facture"
        ctaHref="/dashboard/invoices/new"
        ctaIcon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
        ctaVariant="gradient"
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
        <DataTable<InvoiceRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          mobileFields={["number", "client"]}
          mobileStatusKey="status"
          onRowClick={handleRowClick}
          actions={(row) => (
            <ActionButtons
              onEdit={() => handleEdit(row)}
              onDelete={() => setDeleteTargetId(row.id)}
            />
          )}
          emptyTitle={isLoading ? "Chargement…" : "Aucune facture trouvée"}
          emptyDescription={
            isLoading
              ? "Récupération des factures en cours…"
              : "Aucune facture ne correspond à votre recherche pour ce mois."
          }
        />
      </div>

      {/* Archive Section */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}

      {/* Modal aperçu */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        open={previewOpen}
        onOpenChange={handlePreviewClose}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture sera définitivement supprimée.
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

// ─── Page principale avec Suspense pour useSearchParams ──────────────────────

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesPageContent />
    </Suspense>
  );
}
