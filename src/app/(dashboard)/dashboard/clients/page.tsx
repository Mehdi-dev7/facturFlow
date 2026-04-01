"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Lock, Upload } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  DataTable,
  ActionButtons,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import { useClients, useDeleteClient, type SavedClient } from "@/hooks/use-clients";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
// Lazy load des modals — chargées seulement quand l'utilisateur ouvre/clique
const ClientModal = dynamic(
  () => import("@/components/clients/client-modal").then((m) => ({ default: m.ClientModal })),
  { ssr: false }
);
const ClientPreviewModal = dynamic(
  () => import("@/components/clients/client-preview-modal").then((m) => ({ default: m.ClientPreviewModal })),
  { ssr: false }
);
const DeleteClientConfirmModal = dynamic(
  () => import("@/components/clients/delete-client-confirm-modal").then((m) => ({ default: m.DeleteClientConfirmModal })),
  { ssr: false }
);
const ImportClientsModal = dynamic(
  () => import("@/components/clients/import-clients-modal").then((m) => ({ default: m.ImportClientsModal })),
  { ssr: false }
);

// ─── Formater un montant en euros ────────────────────────────────────────────

function formatEuros(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/* ─── KPI Data ─── */
function buildKpiData(clients: SavedClient[]): KpiData[] {
  const total = clients.length;
  const companies = clients.filter((c) => c.type === "entreprise").length;
  const pme = clients.filter((c) => c.type === "particulier").length;

  return [
    {
      label: "Total clients",
      value: String(total),
      change: `${total} au total`,
      changeType: "neutral",
      icon: "users",
      iconBg: "bg-blue-500",
      borderAccent: "border-blue-500/30",
      gradientFrom: "#eff6ff",
      gradientTo: "#bfdbfe",
      darkGradientFrom: "#1e1b4b",
      darkGradientTo: "#1e3a5f",
    },
    {
      label: "Entreprises",
      value: String(companies),
      change: total > 0 ? `${Math.round((companies / total) * 100)}% du total` : "0%",
      changeType: "up",
      icon: "building",
      iconBg: "bg-amber-500",
      borderAccent: "border-amber-500/30",
      gradientFrom: "#fffbeb",
      gradientTo: "#fde68a",
      darkGradientFrom: "#1e1b4b",
      darkGradientTo: "#78350f",
    },
    {
      label: "PME & Auto-entrepreneurs",
      value: String(pme),
      change: total > 0 ? `${Math.round((pme / total) * 100)}% du total` : "0%",
      changeType: "up",
      icon: "briefcase",
      iconBg: "bg-emerald-500",
      borderAccent: "border-emerald-500/30",
      gradientFrom: "#f0fdf4",
      gradientTo: "#a7f3d0",
      darkGradientFrom: "#1e1b4b",
      darkGradientTo: "#064e3b",
    },
  ];
}

/* ─── Badge SEPA — affiché à côté du nom si mandat GoCardless actif ─── */
function SepaBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] lg:text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
      title="Mandat SEPA actif — prélèvement direct"
    >
      <svg className="size-2.5 lg:size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 7h20M2 12h20M6 17h12" />
      </svg>
      SEPA
    </span>
  );
}

/* ─── Type Badge ─── */
function TypeBadge({ type }: { type: SavedClient["type"] }) {
  const isEntreprise = type === "entreprise";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] lg:text-xs font-semibold ${
        isEntreprise
          ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40"
          : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40"
      }`}
    >
      {isEntreprise ? "Entreprise" : "PME & Freelance"}
    </span>
  );
}

/* ─── Table Columns (sans la colonne Ville) ─── */
const columns: Column<SavedClient>[] = [
  {
    key: "name",
    label: "Nom / Entreprise",
    sortable: true,
    getValue: (c) => c.name,
    render: (c) => (
      <span className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-violet-600 dark:text-violet-400">
        {c.name}
        {c.gcMandateStatus === "active" && <SepaBadge />}
      </span>
    ),
  },
  {
    key: "type",
    label: "Type",
    sortable: true,
    getValue: (c) => c.type,
    render: (c) => <TypeBadge type={c.type} />,
  },
  {
    key: "email",
    label: "Email",
    sortable: false,
    render: (c) => (
      <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
        {c.email}
      </span>
    ),
  },
  {
    key: "phone",
    label: "Téléphone",
    sortable: false,
    render: (c) => (
      <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
        {c.phone ?? "—"}
      </span>
    ),
  },
  {
    key: "totalInvoiced",
    label: "Total facturé",
    sortable: true,
    align: "right" as const,
    getValue: (c) => c.totalInvoiced,
    render: (c) => (
      <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">
        {formatEuros(c.totalInvoiced)}
      </span>
    ),
  },
];

/* ─── Clients Page ─── */
export default function ClientsPage() {
  const [search, setSearch] = useState("");

  // État modale édition/création
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<SavedClient | null>(null);

  // État modale d'import CSV/Excel
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  // État modale de prévisualisation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewClient, setPreviewClient] = useState<SavedClient | null>(null);

  // État modale de confirmation de suppression
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<SavedClient | null>(null);

  // Données réelles depuis la DB
  const { data: clients = [], isLoading } = useClients();
  const deleteMutation = useDeleteClient();

  // Plan courant — pour grisage des clients au-delà de la limite FREE (5 clients)
  const { data: subData } = useQuery({
    queryKey: ["subscription"],
    queryFn: getCurrentSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  // null pendant le chargement → isFree reste false → pas de flash "clients gelés"
  const effectivePlan = subData?.success ? subData.data.effectivePlan : null;
  const isFree = effectivePlan === "FREE";

  const kpiData = useMemo(() => buildKpiData(clients), [clients]);

  // Filtrage local par recherche
  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false),
    );
  }, [search, clients]);

  // Clients actifs (affichés dans le DataTable) : limités à 5 sur FREE hors recherche
  const activeClients = useMemo(() => {
    if (!isFree || search) return filteredClients;
    return filteredClients.slice(0, 5);
  }, [filteredClients, isFree, search]);

  // Clients gelés : au-delà de 5 sur FREE, uniquement hors mode recherche
  // On prend les clients non filtrés (liste complète) pour ne pas masquer des clients gelés
  const frozenClients = useMemo(() => {
    if (!isFree || search) return [];
    return clients.slice(5);
  }, [clients, isFree, search]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Ouvrir la modale de prévisualisation au clic sur une ligne
  const handlePreview = useCallback((client: SavedClient) => {
    setPreviewClient(client);
    setPreviewOpen(true);
  }, []);

  // Ouvrir l'édition directement depuis le tableau (bouton action)
  const handleEdit = useCallback((client: SavedClient) => {
    setEditClient(client);
    setModalOpen(true);
  }, []);

  // Éditer depuis la modale de prévisualisation
  const handleEditFromPreview = useCallback((client: SavedClient) => {
    setPreviewOpen(false);
    setEditClient(client);
    setModalOpen(true);
  }, []);

  // Ouvrir la modale de confirmation (depuis le tableau OU la preview)
  const handleDelete = useCallback((client: SavedClient) => {
    setClientToDelete(client);
    setDeleteConfirmOpen(true);
  }, []);

  // Même handler pour la preview (ferme la preview en plus)
  const handleDeleteFromPreview = useCallback((client: SavedClient) => {
    setClientToDelete(client);
    setDeleteConfirmOpen(true);
  }, []);

  // Exécuter la suppression après confirmation
  const handleConfirmDelete = useCallback(() => {
    if (!clientToDelete) return;
    deleteMutation.mutate(clientToDelete.id, {
      onSuccess: (result) => {
        if (result.success) {
          setDeleteConfirmOpen(false);
          setClientToDelete(null);
          setPreviewOpen(false); // ferme la preview si ouverte
        }
      },
    });
  }, [clientToDelete, deleteMutation]);

  // Ouvrir la modale en mode création
  const handleNewClient = useCallback(() => {
    setEditClient(null);
    setModalOpen(true);
  }, []);

  // Skeleton — affiché tant que les données ne sont pas chargées (après tous les hooks)
  if (isLoading) return <SkeletonTable variant="table" rows={6} cardCount={4} />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-start gap-3 mb-6">
        <div className="flex-1">
          <PageHeader
            title="Clients"
            subtitle="Gérez votre base clients"
            ctaLabel="Nouveau client"
            ctaIcon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
            onCtaClick={handleNewClient}
          />
        </div>
        {/* Bouton import — affiché à droite du header sur desktop, dessous sur mobile */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportOpen(true)}
          className="shrink-0 cursor-pointer border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 self-start xs:mt-1"
        >
          <Upload className="size-4 mr-2" />
          Importer CSV / Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {kpiData.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          placeholder="Rechercher par nom, email ou ville..."
          onSearch={handleSearch}
        />
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20 dark:bg-[#1a1438]">
          <div>
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Liste des clients
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isLoading
                ? "Chargement..."
                : `${activeClients.length} client${activeClients.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <DataTable
          data={activeClients}
          columns={columns}
          getRowId={(c) => c.id}
          // Mobile : ligne 1 = Nom (gauche) + TypeBadge (droite via mobileStatusKey)
          //          ligne 2 = Email (gauche)
          mobileFields={["name", "email"]}
          mobileStatusKey="type"
          onRowClick={handlePreview}
          actions={(client) => (
            <ActionButtons
              onEdit={() => handleEdit(client)}
              onDelete={() => handleDelete(client)}
            />
          )}
          emptyTitle="Aucun client"
          emptyDescription="Ajoutez votre premier client pour commencer."
        />
      </div>

      {/* Section clients gelés — plan FREE, au-delà de 5 clients, hors mode recherche */}
      {isFree && frozenClients.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 overflow-hidden">
          {/* Header de la section */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-500/30">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {frozenClients.length} client{frozenClients.length > 1 ? "s" : ""} gelé{frozenClients.length > 1 ? "s" : ""} — Plan Gratuit
            </span>
            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2 cursor-pointer"
            >
              Passer au Pro
            </button>
          </div>

          {/* Liste des clients gelés — opacité réduite, non interactifs */}
          <div className="divide-y divide-amber-100 dark:divide-amber-500/20">
            {frozenClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3 opacity-50 select-none"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {client.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{client.email}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
                  <Lock className="h-3 w-3" />
                  Gelé
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modale de prévisualisation (clic sur une ligne) */}
      <ClientPreviewModal
        client={previewClient}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onEdit={handleEditFromPreview}
        onDelete={handleDeleteFromPreview}
        isDeleting={deleteMutation.isPending}
      />

      {/* Modale de création/édition */}
      <ClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editClient={editClient}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteClientConfirmModal
        client={clientToDelete}
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Modale d'import CSV/Excel */}
      <ImportClientsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          // Invalide le cache TanStack Query pour recharger la liste
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }}
      />
    </div>
  );
}
