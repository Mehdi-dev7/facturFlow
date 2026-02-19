"use client";

import { useState, useMemo, useCallback, useEffect, useRef, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  MonthSelector,
  DataTable,
  ActionButtons,
  ActionMenuMobile,
  ArchiveSection,
  StatusDropdownDeposit,
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
// import { useDeposits, useDeleteDeposit, type SavedDeposit } from "@/hooks/use-deposits";
import { DepositPreviewModal } from "@/components/acomptes/deposit-preview-modal";

// ─── Types & helpers ──────────────────────────────────────────────────────────

// Type temporaire pour SavedDeposit
interface SavedDeposit {
  id: string;
  number: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email?: string;
    type: "COMPANY" | "INDIVIDUAL";
    companyName?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    phone?: string;
    companyVatNumber?: string;
    companySiren?: string;
    companySiret?: string;
  };
  amount: number;
  vatRate: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  description: string;
  notes?: string;
  date: string;
  dueDate: string;
  status: string;
  paymentLinks: {
    stripe: boolean;
    paypal: boolean;
    sepa: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface DepositRow {
  id: string;
  number: string;
  client: string;
  date: string;    // DD/MM/YYYY
  echeance: string;
  amount: string;  // formaté FR
  status: InvoiceStatus;
  dbStatus: string;
  _raw: SavedDeposit;
}

// Correspondance statut DB → label UI
function mapStatus(dbStatus: string): InvoiceStatus {
  switch (dbStatus) {
    case "DRAFT":   return "à envoyer";
    case "SENT":    return "envoyée";
    case "PAID":    return "payée";
    case "OVERDUE": return "impayée";
    default:        return "à envoyer";
  }
}

function getClientName(client: SavedDeposit["client"]): string {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email || "Client sans nom";
}

function formatDateFR(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatAmountFR(amount: number): string {
  return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " \u20AC";
}

// Mapper SavedDeposit → DepositRow
function toRow(deposit: SavedDeposit): DepositRow {
  return {
    id: deposit.id,
    number: deposit.number,
    client: getClientName(deposit.client),
    date: formatDateFR(deposit.date),
    echeance: formatDateFR(deposit.dueDate),
    amount: formatAmountFR(deposit.total),
    status: mapStatus(deposit.status),
    dbStatus: deposit.status,
    _raw: deposit,
  };
}

const statusOrder: Record<InvoiceStatus, number> = {
  relancée: 0,
  impayée: 1,
  envoyée: 2,
  "en attente": 3,
  "à envoyer": 4,
  payée: 5,
};

// Colonnes du tableau
const columns: Column<DepositRow>[] = [
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
      <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300">{row.client}</span>
    ),
  },
  {
    key: "date",
    label: "Émission",
    sortable: true,
    getValue: (row) => row.date !== "—" ? new Date(row.date.split("/").reverse().join("-")).getTime() : 0,
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
    getValue: (row) => parseFloat(row.amount.replace(/[^\d,]/g, "").replace(",", ".")),
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
    render: (row) => <StatusDropdownDeposit depositId={row._raw.id} dbStatus={row.dbStatus} />,
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export function DepositsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedStatuses] = useState<InvoiceStatus[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDeposit, setPreviewDeposit] = useState<SavedDeposit | null>(null);

  const previewId = searchParams.get("preview");
  const previewOpenedRef = useRef(false);

  // Filtre mois → format "YYYY-MM" (pour usage futur)
  // const monthFilter = useMemo(() => {
  //   const y = selectedMonth.getFullYear();
  //   const m = String(selectedMonth.getMonth() + 1).padStart(2, "0");
  //   return `${y}-${m}`;
  // }, [selectedMonth]);

  // ─── Données mockées temporaires ─────────────────────────────────────────
  const deposits: SavedDeposit[] = useMemo(() => [
    {
      id: "1",
      number: "ACC-2026-0001",
      clientId: "client-1",
      client: {
        id: "client-1",
        name: "ACME Corp",
        email: "contact@acme.com",
        type: "COMPANY",
        companyName: "ACME Corp",
        address: "123 Rue de la Paix",
        postalCode: "75001",
        city: "Paris",
        phone: "01 23 45 67 89",
        companySiret: "12345678901234"
      },
      amount: 1250,
      vatRate: 20,
      subtotal: 1250,
      taxTotal: 250,
      total: 1500,
      description: "Acompte sur prestation développement web",
      notes: "Acompte de 50% sur le projet",
      date: "2026-02-15",
      dueDate: "2026-03-15",
      status: "SENT",
      paymentLinks: {
        stripe: true,
        paypal: false,
        sepa: true
      },
      createdAt: "2026-02-15T10:00:00Z",
      updatedAt: "2026-02-15T10:00:00Z"
    },
    {
      id: "2",
      number: "ACC-2026-0002",
      clientId: "client-2",
      client: {
        id: "client-2",
        name: "Tech Solutions",
        email: "info@techsolutions.fr",
        type: "COMPANY",
        companyName: "Tech Solutions SARL",
        address: "456 Avenue des Champs",
        postalCode: "69000",
        city: "Lyon",
        phone: "04 56 78 90 12"
      },
      amount: 625,
      vatRate: 20,
      subtotal: 625,
      taxTotal: 125,
      total: 750,
      description: "Acompte sur formation React",
      date: "2026-02-10",
      dueDate: "2026-03-10",
      status: "PAID",
      paymentLinks: {
        stripe: true,
        paypal: true,
        sepa: false
      },
      createdAt: "2026-02-10T14:30:00Z",
      updatedAt: "2026-02-12T09:15:00Z"
    },
    {
      id: "3",
      number: "ACC-2026-0003",
      clientId: "client-3",
      client: {
        id: "client-3",
        name: "StartupXYZ",
        email: "hello@startupxyz.com",
        type: "COMPANY",
        companyName: "StartupXYZ SAS",
        address: "789 Boulevard Innovation",
        postalCode: "33000",
        city: "Bordeaux"
      },
      amount: 1875,
      vatRate: 20,
      subtotal: 1875,
      taxTotal: 375,
      total: 2250,
      description: "Acompte sur refonte site web",
      notes: "Premier acompte de 30%",
      date: "2026-02-18",
      dueDate: "2026-03-20",
      status: "OVERDUE",
      paymentLinks: {
        stripe: true,
        paypal: false,
        sepa: true
      },
      createdAt: "2026-02-18T16:45:00Z",
      updatedAt: "2026-02-18T16:45:00Z"
    }
  ], []);
  
  // Mock delete function
  const deleteDeposit = useMemo(() => ({
    mutateAsync: async (id: string) => {
      console.log("Delete deposit:", id);
      // TODO: Implémenter la suppression
    },
    isPending: false
  }), []);

  // Mapper en DepositRow
  const rows: DepositRow[] = useMemo(() => deposits.map(toRow), [deposits]);

  // ─── KPIs dynamiques ──────────────────────────────────────────────────────
  const kpis: KpiData[] = useMemo(() => {
    const total = rows.length;
    const paid = rows.filter((r) => r.dbStatus === "PAID").length;
    const sent = rows.filter((r) => r.dbStatus === "SENT").length;
    const overdue = rows.filter((r) => r.dbStatus === "OVERDUE").length;

    const sentAmount = deposits
      .filter((d) => d.status === "SENT")
      .reduce((acc, d) => acc + d.total, 0);
    const overdueAmount = deposits
      .filter((d) => d.status === "OVERDUE")
      .reduce((acc, d) => acc + d.total, 0);

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
        change: paid > 0 ? `${Math.round((paid / total) * 100)}%` : "0%",
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
        value: String(sent),
        change: sentAmount > 0 ? formatAmountFR(sentAmount) : "—",
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
        label: "Impayés",
        value: String(overdue),
        change: overdueAmount > 0 ? formatAmountFR(overdueAmount) : "—",
        changeType: overdue > 0 ? "down" : "neutral",
        icon: "alert",
        iconBg: "bg-red-500",
        borderAccent: "border-red-500/30",
        gradientFrom: "#fef2f2",
        gradientTo: "#fecaca",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#7f1d1d",
      },
    ] satisfies KpiData[];
  }, [rows, deposits]);

  // ─── Filtrage + tri ────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let filtered = rows;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) => r.number.toLowerCase().includes(q) || r.client.toLowerCase().includes(q),
      );
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((r) => selectedStatuses.includes(r.status));
    }

    return filtered.sort((a, b) => {
      const diff = statusOrder[a.status] - statusOrder[b.status];
      if (diff !== 0) return diff;
      // Si même statut, trier par date décroissante
      return new Date(b._raw.date).getTime() - new Date(a._raw.date).getTime();
    });
  }, [rows, searchQuery, selectedStatuses]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleRowClick = useCallback(
    (row: DepositRow) => {
      if (row.dbStatus === "DRAFT") {
        router.push(`/dashboard/deposits/${row.id}/edit`);
        return;
      }
      setPreviewDeposit(row._raw);
      setPreviewOpen(true);
    },
    [router],
  );

  const handleEdit = useCallback(
    (row: DepositRow) => {
      router.push(`/dashboard/deposits/${row.id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    await deleteDeposit.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteDeposit]);

  // Ouvrir la preview via URL (?preview=id)
  useEffect(() => {
    if (!previewId || previewOpenedRef.current || deposits.length === 0) return;
    const deposit = deposits.find((d) => d.id === previewId);
    if (deposit) {
      previewOpenedRef.current = true;
      startTransition(() => {
        setPreviewDeposit(deposit);
        setPreviewOpen(true);
      });
    }
  }, [previewId, deposits]);

  useEffect(() => {
    if (!previewOpen) previewOpenedRef.current = false;
  }, [previewOpen]);

  // Nettoyer ?preview= de l'URL quand la modal se ferme
  const handlePreviewClose = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open && previewId) {
      previewOpenedRef.current = false;
      router.replace("/dashboard/deposits", { scroll: false });
    }
  }, [previewId, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Acomptes"
        subtitle="Gérez vos demandes d'acomptes clients"
        ctaLabel="Nouvel acompte"
        ctaIcon={<Plus className="size-4" />}
        onCtaClick={() => router.push("/dashboard/deposits/new")}
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
            placeholder="Rechercher par n°, client…"
            onSearch={setSearchQuery}
          />
        </div>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden mb-8">
        <DataTable<DepositRow>
          columns={columns}
          data={filteredRows}
          getRowId={(row) => row.id}
          mobileFields={["number", "client"]}
          onRowClick={handleRowClick}
          actions={(row) => (
            <ActionButtons
              onEdit={() => handleEdit(row)}
              onDelete={() => setDeleteTargetId(row.id)}
            />
          )}
          mobileActions={(row) => (
            <ActionMenuMobile
              onEdit={() => handleEdit(row)}
              onDelete={() => setDeleteTargetId(row.id)}
            />
          )}
          emptyTitle="Aucun acompte ce mois"
          emptyDescription="Créez votre premier acompte en cliquant sur le bouton ci-dessus."
        />
      </div>

      {/* Section archivées */}
      <ArchiveSection data={[]} onSelect={() => {}} />

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;acompte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet acompte ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDeposit.isPending}
            >
              <Trash2 className="size-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale de prévisualisation */}
      <DepositPreviewModal
        deposit={previewDeposit}
        open={previewOpen}
        onOpenChange={handlePreviewClose}
      />
    </div>
  );
}
