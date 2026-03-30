"use client";
// src/app/(dashboard)/dashboard/purchase-orders/page.tsx
// Page listant les bons de commande — adapté de quotes/page.tsx

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import dynamic from "next/dynamic";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import type { SavedPurchaseOrder } from "@/lib/pdf/purchase-order-pdf-document";

// Lazy load des modals
const DeleteConfirmModal = dynamic(
  () => import("@/components/shared/delete-confirm-modal").then((m) => ({ default: m.DeleteConfirmModal })),
  { ssr: false },
);
const PurchaseOrderPreviewModal = dynamic(
  () =>
    import("@/components/purchase-orders/purchase-order-preview-modal").then((m) => ({
      default: m.PurchaseOrderPreviewModal,
    })),
  { ssr: false },
);

// ─── Types & helpers ──────────────────────────────────────────────────────────

// Statuts simplifiés pour l'affichage dans le tableau
type PurchaseOrderStatus = "à envoyer" | "envoyé" | "accepté" | "annulé";

interface PurchaseOrderRow {
  id: string;
  number: string;
  client: string;
  date: string;
  deliveryDate: string;
  amount: string;
  status: PurchaseOrderStatus;
  dbStatus: string;
}

const statusOrder: Record<PurchaseOrderStatus, number> = {
  "à envoyer": 0,
  "envoyé": 1,
  "accepté": 2,
  "annulé": 3,
};

function mapDbStatus(status: string): PurchaseOrderStatus {
  switch (status) {
    case "DRAFT":     return "à envoyer";
    case "SENT":      return "envoyé";
    case "ACCEPTED":  return "accepté";
    case "CANCELLED": return "annulé";
    default:          return "à envoyer";
  }
}

function getStatusColor(status: PurchaseOrderStatus) {
  switch (status) {
    case "accepté":  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "envoyé":   return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "annulé":   return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300";
    default:         return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  }
}

function getClientName(client: SavedPurchaseOrder["client"]): string {
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

function toRow(po: SavedPurchaseOrder): PurchaseOrderRow {
  return {
    id: po.id,
    number: po.number,
    client: getClientName(po.client),
    date: formatDateFR(po.date),
    deliveryDate: formatDateFR(po.deliveryDate),
    amount: formatAmountFR(po.total),
    status: mapDbStatus(po.status),
    dbStatus: po.status,
  };
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

// ─── Contenu de la page (lit searchParams via Suspense) ───────────────────────

function PurchaseOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [previewOrder, setPreviewOrder] = useState<SavedPurchaseOrder | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Données (hook à brancher sur l'agent backend) ────────────────────
  // TODO: remplacer par `usePurchaseOrders()` une fois l'agent backend terminé
  const allOrders: SavedPurchaseOrder[] = [];
  const isLoading = false;

  // Map id → order pour accès rapide
  const orderMap = useMemo(() => {
    const m = new Map<string, SavedPurchaseOrder>();
    for (const o of allOrders) m.set(o.id, o);
    return m;
  }, [allOrders]);

  // Ouvrir la modal si ?preview=<id> dans l'URL
  const previewOpenedRef = useRef(false);
  useEffect(() => {
    if (!previewId || isLoading || previewOpenedRef.current) return;
    const o = orderMap.get(previewId);
    if (o) {
      previewOpenedRef.current = true;
      setPreviewOrder(o);
      setPreviewOpen(true);
    }
  }, [previewId, orderMap, isLoading]);

  // Nettoyer ?preview= de l'URL quand la modal se ferme
  const handlePreviewClose = useCallback(
    (open: boolean) => {
      setPreviewOpen(open);
      if (!open && previewId) {
        previewOpenedRef.current = false;
        router.replace("/dashboard/purchase-orders", { scroll: false });
      }
    },
    [previewId, router],
  );

  const handleSearch = useCallback((value: string) => setSearch(value), []);
  const handleMonthChange = useCallback((date: Date) => setSelectedMonth(date), []);

  const selectedMonthKey = useMemo(() => {
    const m = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    return `${selectedMonth.getFullYear()}-${m}`;
  }, [selectedMonth]);

  const allRows = useMemo(() => allOrders.map(toRow), [allOrders]);

  // Filtrage par mois
  const monthRows = useMemo(
    () =>
      allRows.filter((row) => {
        const o = orderMap.get(row.id);
        return o ? getMonthKey(o.date) === selectedMonthKey : false;
      }),
    [allRows, orderMap, selectedMonthKey],
  );

  // Filtrage par recherche
  const filteredRows = useMemo(() => {
    if (!search.trim()) return monthRows;
    const query = search.toLowerCase();
    return monthRows.filter(
      (row) =>
        row.number.toLowerCase().includes(query) ||
        row.client.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query),
    );
  }, [monthRows, search]);

  // KPIs du mois
  const kpis = useMemo((): KpiData[] => {
    const total    = monthRows.length;
    const accepted = monthRows.filter((r) => r.status === "accepté").length;
    const sent     = monthRows.filter((r) => r.status === "envoyé").length;
    const cancelled = monthRows.filter((r) => r.status === "annulé").length;

    return [
      {
        label: "BC ce mois",
        value: String(total),
        change: `${total} BC`,
        changeType: "up",
        icon: "file",
        iconBg: "bg-violet-500",
        borderAccent: "border-violet-500/30",
        gradientFrom: "#f5f3ff",
        gradientTo: "#ddd6fe",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#2e1065",
      },
      {
        label: "Acceptés",
        value: String(accepted),
        change: `${accepted} accepté${accepted > 1 ? "s" : ""}`,
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
        label: "Envoyés",
        value: String(sent),
        change: `${sent} envoyé${sent > 1 ? "s" : ""}`,
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
        label: "Annulés",
        value: String(cancelled),
        change: `${cancelled} annulé${cancelled > 1 ? "s" : ""}`,
        changeType: "down",
        icon: "alert",
        iconBg: "bg-blue-500",
        borderAccent: "border-blue-500/30",
        gradientFrom: "#eff6ff",
        gradientTo: "#bfdbfe",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#1e3a5f",
      },
    ];
  }, [monthRows]);

  // Colonnes du tableau
  const columns = useMemo(
    (): Column<PurchaseOrderRow>[] => [
      {
        key: "number",
        label: "N° BC",
        headerClassName: "md:w-[120px] lg:w-auto",
        cellClassName: "md:w-[120px] lg:w-auto overflow-hidden",
        render: (row) => (
          <span className="text-[11px] lg:text-xs xl:text-sm font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-800 transition-colors block truncate md:max-w-[100px] lg:max-w-none">
            {row.number}
          </span>
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
        key: "date",
        label: "Émission",
        sortable: true,
        getValue: (row) => new Date(row.date.split("/").reverse().join("-")).getTime(),
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{row.date}</span>
        ),
      },
      {
        key: "deliveryDate",
        label: "Livraison",
        sortable: true,
        getValue: (row) =>
          row.deliveryDate !== "—"
            ? new Date(row.deliveryDate.split("/").reverse().join("-")).getTime()
            : 0,
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{row.deliveryDate}</span>
        ),
      },
      {
        key: "amount",
        label: "Montant",
        align: "right" as const,
        sortable: true,
        getValue: (row) => orderMap.get(row.id)?.total ?? 0,
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
        sortable: true,
        getValue: (row) => statusOrder[row.status],
        render: (row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-medium ${getStatusColor(row.status)}`}
          >
            {row.status}
          </span>
        ),
      },
    ],
    [orderMap],
  );

  // Données archives
  const archiveData = useMemo(() => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const grouped: Record<number, Record<number, number>> = {};
    for (const o of allOrders) {
      const d = new Date(o.date);
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
  }, [allOrders, selectedMonth]);

  // Skeleton pendant le chargement
  if (isLoading) return <SkeletonTable variant="table" rows={6} cardCount={4} />;

  const handleArchiveSelect = useCallback((year: number, monthName: string) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const idx = monthNames.indexOf(monthName);
    if (idx >= 0) setSelectedMonth(new Date(year, idx, 1));
  }, []);

  const handleRowClick = useCallback(
    (row: PurchaseOrderRow) => {
      const o = orderMap.get(row.id);
      if (!o) return;
      setPreviewOrder(o);
      setPreviewOpen(true);
    },
    [orderMap],
  );

  const handleEdit = useCallback(
    (row: PurchaseOrderRow) => {
      router.push(`/dashboard/purchase-orders/${row.id}/edit`);
    },
    [router],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    // TODO: brancher sur deleteMutation.mutate(deleteTargetId) une fois le hook backend créé
    console.log("Delete purchase order:", deleteTargetId);
    setDeleteTargetId(null);
    setIsDeleting(false);
  }, [deleteTargetId]);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Bons de commande"
        subtitle="Créez et gérez vos bons de commande"
        ctaLabel="Nouveau BC"
        ctaHref="/dashboard/purchase-orders/new"
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
            placeholder="Rechercher par n° BC, client, statut..."
            onSearch={handleSearch}
          />
        </div>
        <MonthSelector value={selectedMonth} onChange={handleMonthChange} />
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden mb-8">
        <DataTable<PurchaseOrderRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          limit={10}
          mobileFields={["number", "client"]}
          mobileStatusKey="status"
          mobileAmountKey="amount"
          onRowClick={handleRowClick}
          actions={(row) => (
            <ActionButtons
              onEdit={() => handleEdit(row)}
              onDelete={() => setDeleteTargetId(row.id)}
            />
          )}
          emptyTitle={isLoading ? "Chargement..." : "Aucun bon de commande trouvé"}
          emptyDescription={
            isLoading
              ? "Récupération des bons de commande en cours..."
              : "Aucun bon de commande ne correspond à votre recherche pour ce mois."
          }
        />
      </div>

      {/* Archive */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}

      {/* Modal aperçu */}
      <PurchaseOrderPreviewModal
        purchaseOrder={previewOrder}
        open={previewOpen}
        onOpenChange={handlePreviewClose}
        onDelete={async (id) => {
          // TODO: brancher sur le hook backend
          console.log("Delete from modal:", id);
        }}
      />

      {/* Modal confirmation suppression depuis le tableau */}
      <DeleteConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        documentLabel="le bon de commande"
        documentNumber={deleteTargetId ? (orderMap.get(deleteTargetId)?.number ?? "") : ""}
      />
    </div>
  );
}

// ─── Page principale avec Suspense pour useSearchParams ──────────────────────

export default function PurchaseOrdersPage() {
  return (
    <Suspense>
      <PurchaseOrdersPageContent />
    </Suspense>
  );
}
