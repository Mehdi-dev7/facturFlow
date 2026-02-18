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
  ActionMenuMobile,
  ArchiveSection,
  StatusBadge,
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
// import { DepositPreviewModal } from "@/components/acomptes/deposit-preview-modal";

// ─── Types & helpers ──────────────────────────────────────────────────────────

// Ligne de tableau pour les acomptes
interface DepositRow {
  id: string;      // UUID DB
  number: string;  // N° acompte (ACC-2026-0001)
  client: string;
  date: string;    // DD/MM/YYYY
  echeance: string;
  amount: string;
  status: InvoiceStatus; // Réutilise les mêmes statuts
  dbStatus: string;
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
    render: (row) => (
      <StatusBadge status={row.status} />
    ),
  },
];

// Données mockées pour l'instant
const mockDeposits: DepositRow[] = [
  {
    id: "1",
    number: "ACC-2026-0001",
    client: "ACME Corp",
    date: "15/02/2026",
    echeance: "15/03/2026",
    amount: "1 500,00 €",
    status: "envoyée",
    dbStatus: "SENT"
  },
  {
    id: "2", 
    number: "ACC-2026-0002",
    client: "Tech Solutions",
    date: "10/02/2026",
    echeance: "10/03/2026", 
    amount: "750,00 €",
    status: "payée",
    dbStatus: "PAID"
  },
  {
    id: "3",
    number: "ACC-2026-0003", 
    client: "StartupXYZ",
    date: "18/02/2026",
    echeance: "20/03/2026",
    amount: "2 250,00 €", 
    status: "impayée",
    dbStatus: "OVERDUE"
  }
];

// KPIs mockés
const mockKpis: KpiData[] = [
  {
    label: "Acomptes ce mois",
    value: "3",
    change: "3 acomptes",
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
    value: "1",
    change: "33%",
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
    value: "1",
    change: "1 500,00 €",
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
    value: "1",
    change: "2 250,00 €",
    changeType: "down",
    icon: "alert",
    iconBg: "bg-red-500",
    borderAccent: "border-red-500/30",
    gradientFrom: "#fef2f2",
    gradientTo: "#fecaca",
    darkGradientFrom: "#1e1b4b",
    darkGradientTo: "#7f1d1d",
  }
];

export function DepositsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // États locaux
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDeposit, setPreviewDeposit] = useState<any>(null);

  // Gestion de la preview via URL
  const previewId = searchParams.get("preview");
  const previewOpenedRef = useRef(false);

  // Données filtrées
  const filteredDeposits = useMemo(() => {
    let filtered = mockDeposits;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (deposit) =>
          deposit.number.toLowerCase().includes(query) ||
          deposit.client.toLowerCase().includes(query)
      );
    }

    // Filtre par statuts
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((deposit) =>
        selectedStatuses.includes(deposit.status)
      );
    }

    // Tri par statut puis par date
    return filtered.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // Si même statut, trier par date décroissante
      const [dayA, monthA, yearA] = a.date.split("/").map(Number);
      const [dayB, monthB, yearB] = b.date.split("/").map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateB.getTime() - dateA.getTime();
    });
  }, [searchQuery, selectedStatuses]);

  // Gestion des actions
  const handleRowClick = useCallback((row: DepositRow) => {
    // Si c'est un brouillon, aller vers l'édition
    if (row.dbStatus === "DRAFT") {
      router.push(`/dashboard/deposits/${row.id}/edit`);
      return;
    }

    // Sinon, ouvrir la modal de prévisualisation
    setPreviewDeposit(row);
    setPreviewOpen(true);
  }, [router]);

  const handleEdit = useCallback((row: DepositRow) => {
    router.push(`/dashboard/deposits/${row.id}/edit`);
  }, [router]);

  const handleDelete = useCallback((id: string) => {
    // TODO: Implémenter la suppression
    console.log("Supprimer acompte:", id);
    setDeleteTargetId(null);
  }, []);

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    // TODO: Implémenter le changement de statut
    console.log("Changer statut:", id, newStatus);
  }, []);

  // Gestion preview via URL
  useEffect(() => {
    if (!previewId || previewOpenedRef.current) return;
    
    const deposit = mockDeposits.find(d => d.id === previewId);
    if (deposit) {
      previewOpenedRef.current = true;
      setPreviewDeposit(deposit);
      setPreviewOpen(true);
    }
  }, [previewId]);

  useEffect(() => {
    if (!previewOpen) {
      previewOpenedRef.current = false;
    }
  }, [previewOpen]);

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
        {mockKpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Search + Month Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Rechercher par n°, client, statut..."
            onSearch={setSearchQuery}
          />
        </div>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden mb-8">
        <DataTable<DepositRow>
          columns={columns}
          data={filteredDeposits}
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
          emptyTitle="Aucun acompte trouvé"
          emptyDescription="Aucun acompte ne correspond à votre recherche pour ce mois."
        />
      </div>

      {/* Section archivées */}
      <ArchiveSection
        data={[]}
        onSelect={(year, month) => {
          // TODO: Implémenter la sélection des archivés
          console.log("Archive sélectionnée:", year, month);
        }}
      />

      {/* Modal de suppression */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'acompte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet acompte ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="size-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de prévisualisation */}
      {/* TODO: Créer DepositPreviewModal */}
      {previewOpen && previewDeposit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Aperçu de l'acompte</h2>
              <p>Acompte: {previewDeposit.number}</p>
              <p>Client: {previewDeposit.client}</p>
              <p>Montant: {previewDeposit.amount}</p>
              <button
                onClick={() => setPreviewOpen(false)}
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}