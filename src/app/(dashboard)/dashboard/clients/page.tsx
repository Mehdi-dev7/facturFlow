"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  DataTable,
  ActionButtons,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import { useClients, useDeleteClient, type SavedClient } from "@/hooks/use-clients";
import { ClientModal } from "@/components/clients/client-modal";
import { ClientPreviewModal } from "@/components/clients/client-preview-modal";
import { DeleteClientConfirmModal } from "@/components/clients/delete-client-confirm-modal";

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
      <span className="text-xs lg:text-sm font-semibold text-violet-600 dark:text-violet-400">
        {c.name}
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

  // État modale de prévisualisation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewClient, setPreviewClient] = useState<SavedClient | null>(null);

  // État modale de confirmation de suppression
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<SavedClient | null>(null);

  // Données réelles depuis la DB
  const { data: clients = [], isLoading } = useClients();
  const deleteMutation = useDeleteClient();

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

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Clients"
        subtitle="Gérez votre base clients"
        ctaLabel="Nouveau client"
        ctaIcon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
        onCtaClick={handleNewClient}
      />

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
                : `${filteredClients.length} client${filteredClients.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <DataTable
          data={filteredClients}
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
    </div>
  );
}
