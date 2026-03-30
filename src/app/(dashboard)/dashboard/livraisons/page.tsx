"use client";

// Page liste des bons de livraison (DELIVERY_NOTE)
// Pattern identique à avoirs/page.tsx — couleur teal #0d9488

import { useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { Truck, Download, Loader2, CheckCircle2 } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  DataTable,
  ActionButtons,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { Button } from "@/components/ui/button";
import { InvoiceSearchCombobox } from "@/components/shared/invoice-search-combobox";
import { useDeliveryNotes, useDeleteDeliveryNote } from "@/hooks/use-delivery-notes";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import type { SavedDeliveryNote } from "@/lib/types/delivery-notes";
import { DeliveryNotePdfDocument } from "@/lib/pdf/delivery-note-pdf-document";
import { useInvoices } from "@/hooks/use-invoices";
import { createDeliveryNote } from "@/lib/actions/delivery-notes";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// PDFDownloadLink chargé côté client uniquement
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientName(client: SavedDeliveryNote["client"]): string {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}


function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatAmount(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

// Date par défaut = aujourd'hui au format YYYY-MM-DD pour input[type=date]
function todayInputValue() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// ─── Type de ligne pour le tableau ───────────────────────────────────────────

interface DeliveryNoteRow {
  id: string;
  number: string;
  client: string;
  invoiceNumber: string;
  deliveryDate: string;
  lineCount: string;
}

function toRow(dn: SavedDeliveryNote): DeliveryNoteRow {
  return {
    id: dn.id,
    number: dn.number,
    client: getClientName(dn.client),
    invoiceNumber: dn.invoiceNumber,
    deliveryDate: formatDateFR(dn.deliveryDate),
    lineCount: `${dn.lines.length} article${dn.lines.length > 1 ? "s" : ""}`,
  };
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

function buildKpis(deliveryNotes: SavedDeliveryNote[]): KpiData[] {
  const total = deliveryNotes.length;
  // Nombre de factures distinctes couvertes par des BL
  const distinctInvoices = new Set(deliveryNotes.map((dn) => dn.invoiceId)).size;

  return [
    {
      label: "Total BL émis",
      value: String(total),
      change: `${total} bon${total > 1 ? "s" : ""} de livraison`,
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
      label: "Factures couvertes",
      value: String(distinctInvoices),
      change: "Factures avec un BL associé",
      changeType: "neutral",
      icon: "check",
      iconBg: "bg-emerald-500",
      borderAccent: "border-emerald-500/30",
      gradientFrom: "#ecfdf5",
      gradientTo: "#a7f3d0",
      darkGradientFrom: "#1e1b4b",
      darkGradientTo: "#064e3b",
    },
  ];
}

// ─── Générateur de bon de livraison depuis une facture ───────────────────────

function InvoiceDeliveryNoteGenerator() {
  const queryClient = useQueryClient();
  const { data: allInvoices = [] } = useInvoices();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [wasCreated, setWasCreated] = useState(false);

  // Toutes les factures sauf les brouillons
  const eligibleInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status !== "DRAFT"),
    [allInvoices],
  );

  const selectedInvoice = useMemo(
    () => eligibleInvoices.find((inv) => inv.id === selectedInvoiceId),
    [eligibleInvoices, selectedInvoiceId],
  );

  const handleInvoiceChange = useCallback((value: string) => {
    setSelectedInvoiceId(value);
    setNotes("");
    setWasCreated(false);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!selectedInvoice || isCreating) return;

    setIsCreating(true);
    try {
      const result = await createDeliveryNote({
        invoiceId: selectedInvoice.id,
        notes: notes.trim() || undefined,
        deliveryDate,
      });

      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la création du bon de livraison");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      toast.success(`Bon de livraison ${result.data.number} créé avec succès`);
      setWasCreated(true);
      setSelectedInvoiceId("");
      setNotes("");
      setDeliveryDate(todayInputValue());
    } finally {
      setIsCreating(false);
    }
  }, [selectedInvoice, notes, deliveryDate, isCreating, queryClient]);

  if (eligibleInvoices.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-violet-400/60 italic">
        Aucune facture disponible pour générer un bon de livraison.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Combobox de recherche de facture */}
      <InvoiceSearchCombobox
        invoices={eligibleInvoices}
        value={selectedInvoiceId}
        onChange={handleInvoiceChange}
        placeholder="Rechercher une facture..."
      />

      {/* Options si facture sélectionnée */}
      {selectedInvoice && (
        <div className="space-y-3 pt-1">
          {/* Date de livraison */}
          <div className="flex flex-col gap-1">
            <label className="text-xs xs:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Date de livraison
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full max-w-xs rounded-xl border border-slate-300 dark:border-violet-400/30 bg-white/90 dark:bg-[#2a2254]/80 px-3 py-1.5 text-xs xs:text-sm text-slate-900 dark:text-violet-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
            />
          </div>

          {/* Notes optionnelles */}
          <div className="flex flex-col gap-1">
            <label className="text-xs xs:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Notes <span className="text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions de livraison, remarques..."
              rows={2}
              className="w-full max-w-md rounded-xl border border-slate-300 dark:border-violet-400/30 bg-white/90 dark:bg-[#2a2254]/80 px-3 py-1.5 text-xs xs:text-sm text-slate-900 dark:text-violet-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
            />
          </div>

          {/* Bouton créer + badge succès */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={isCreating}
              onClick={handleCreate}
              className="bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {isCreating ? (
                <Loader2 className="size-3.5 sm:size-4 animate-spin mr-1.5" />
              ) : (
                <Truck className="size-3.5 sm:size-4 mr-1.5" />
              )}
              {isCreating ? "Création en cours..." : "Générer le bon de livraison"}
            </Button>

            {wasCreated && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 shrink-0">
                <CheckCircle2 size={12} />
                Créé
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contenu de la page ───────────────────────────────────────────────────────

function LivraisonsPageContent() {
  const [search, setSearch] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: allDeliveryNotes = [], isLoading } = useDeliveryNotes();
  const deleteMutation = useDeleteDeliveryNote();

  // Map id → objet complet pour accès rapide dans les renderers
  const deliveryNoteMap = useMemo(() => {
    const m = new Map<string, SavedDeliveryNote>();
    for (const dn of allDeliveryNotes) m.set(dn.id, dn);
    return m;
  }, [allDeliveryNotes]);

  const handleSearch = useCallback((v: string) => setSearch(v), []);

  const allRows = useMemo(() => allDeliveryNotes.map(toRow), [allDeliveryNotes]);
  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q),
    );
  }, [allRows, search]);

  const kpis = useMemo(() => buildKpis(allDeliveryNotes), [allDeliveryNotes]);

  const columns = useMemo(
    (): Column<DeliveryNoteRow>[] => [
      {
        key: "number",
        label: "N° BL",
        headerClassName: "md:w-[130px] lg:w-auto",
        cellClassName: "md:w-[130px] lg:w-auto overflow-hidden",
        render: (row) => (
          <span className="text-[11px] lg:text-xs xl:text-sm font-semibold text-teal-600 dark:text-teal-400 block truncate md:max-w-[110px] lg:max-w-none">
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
        key: "invoiceNumber",
        label: "Facture d'origine",
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            {row.invoiceNumber}
          </span>
        ),
      },
      {
        key: "deliveryDate",
        label: "Date livraison",
        sortable: true,
        getValue: (row) =>
          new Date(row.deliveryDate.split("/").reverse().join("-")).getTime(),
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            {row.deliveryDate}
          </span>
        ),
      },
      {
        key: "lineCount",
        label: "Lignes",
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            {row.lineCount}
          </span>
        ),
      },
      {
        key: "id",
        label: "PDF",
        align: "center",
        render: (row) => {
          const dn = deliveryNoteMap.get(row.id);
          if (!dn) return null;
          return (
            <PDFDownloadLink
              document={<DeliveryNotePdfDocument deliveryNote={dn} />}
              fileName={`${dn.number}.pdf`}
            >
              {({ loading }) =>
                loading ? (
                  <Loader2 className="size-4 animate-spin text-slate-400 mx-auto" />
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition-colors cursor-pointer mx-auto"
                    aria-label={`Télécharger le PDF du bon de livraison ${dn.number}`}
                  >
                    <Download className="size-3.5" />
                    <span className="hidden lg:inline">PDF</span>
                  </button>
                )
              }
            </PDFDownloadLink>
          );
        },
      },
    ],
    [deliveryNoteMap],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTargetId) return;
    deleteMutation.mutate(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteMutation]);

  // Skeleton — affiché tant que les données ne sont pas chargées (après tous les hooks)
  if (isLoading) return <SkeletonTable variant="table" rows={6} cardCount={4} />;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Bons de livraison"
        subtitle="Gérez vos bons de livraison"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 max-w-2xl lg:max-w-5xl">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Générateur de BL depuis une facture */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-md shadow-slate-200/50 dark:shadow-violet-950/30 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-2.5 lg:p-3 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-500/20">
            <Truck className="size-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Générer un bon depuis une facture
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-violet-400/60">
              Sélectionnez une facture pour générer automatiquement un bon de livraison avec ses articles
            </p>
          </div>
        </div>
        <InvoiceDeliveryNoteGenerator />
      </div>

      {/* SearchBar */}
      <div className="mb-6">
        <SearchBar
          placeholder="Rechercher par n° BL, client, facture..."
          onSearch={handleSearch}
        />
      </div>

      {/* Tableau des bons de livraison */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20">
          <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-500/20 shrink-0">
            <Truck className="size-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Bons de livraison émis
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isLoading
                ? "Chargement..."
                : `${filteredRows.length} bon${filteredRows.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <DataTable<DeliveryNoteRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          limit={10}
          mobileFields={["number", "client"]}
          actions={(row) => (
            <ActionButtons onDelete={() => setDeleteTargetId(row.id)} />
          )}
          emptyTitle={isLoading ? "Chargement…" : "Aucun bon de livraison émis"}
          emptyDescription={
            isLoading
              ? "Récupération des bons de livraison en cours…"
              : "Utilisez le formulaire ci-dessus pour générer votre premier bon de livraison."
          }
        />
      </div>

      {/* Modale suppression */}
      <DeleteConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
        documentLabel="le bon de livraison"
        documentNumber={deleteTargetId ? (deliveryNoteMap.get(deleteTargetId)?.number ?? "") : ""}
      />
    </div>
  );
}

// ─── Page avec Suspense ───────────────────────────────────────────────────────

export default function LivraisonsPage() {
  return (
    <Suspense>
      <LivraisonsPageContent />
    </Suspense>
  );
}
