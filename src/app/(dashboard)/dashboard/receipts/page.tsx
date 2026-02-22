"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, FileCheck, Download, Loader2 } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  DataTable,
  ActionButtons,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useReceipts, useDeleteReceipt, type SavedReceipt } from "@/hooks/use-receipts";
import { useInvoices } from "@/hooks/use-invoices";
import { ReceiptModal } from "@/components/receipts/receipt-modal";
import { ReceiptPreviewModal } from "@/components/receipts/receipt-preview-modal";
import { RECEIPT_PAYMENT_METHODS } from "@/lib/types/receipts";
import { ReceiptPdfDocument } from "@/lib/pdf/receipt-pdf-document";
import type { SavedInvoice } from "@/lib/actions/invoices";

// PDFDownloadLink chargé côté client uniquement (utilise des APIs navigateur)
// ReceiptPdfDocument importé normalement — pas de browser API, juste des objets react-pdf
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);

// ─── Types & Helpers ──────────────────────────────────────────────────────────

interface ReceiptRow {
  id: string;
  number: string;
  client: string;
  date: string;
  description: string;
  paymentMethod: string;
  amount: string;
}

function getClientName(client: SavedReceipt["client"]): string {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function getInvoiceClientName(client: SavedInvoice["client"]): string {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatAmount(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function getPaymentLabel(method: string) {
  return RECEIPT_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

function toRow(r: SavedReceipt): ReceiptRow {
  return {
    id: r.id,
    number: r.number,
    client: getClientName(r.client),
    date: formatDateFR(r.date),
    description: r.description,
    paymentMethod: getPaymentLabel(r.paymentMethod),
    amount: formatAmount(r.total),
  };
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

function buildKpis(receipts: SavedReceipt[]): KpiData[] {
  const total = receipts.length;
  const totalAmount = receipts.reduce((s, r) => s + r.total, 0);
  const cashCount = receipts.filter((r) => r.paymentMethod === "CASH").length;
  const checkCount = receipts.filter((r) => r.paymentMethod === "CHECK").length;

  return [
    {
      label: "Total reçus",
      value: String(total),
      change: `${total} reçu${total > 1 ? "s" : ""}`,
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
      label: "Total encaissé",
      value: formatAmount(totalAmount),
      change: "Tous reçus confondus",
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
      label: "Espèces",
      value: String(cashCount),
      change: cashCount > 0 ? `${Math.round((cashCount / total) * 100)}% du total` : "0%",
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
      label: "Chèques",
      value: String(checkCount),
      change: checkCount > 0 ? `${Math.round((checkCount / total) * 100)}% du total` : "0%",
      changeType: "neutral",
      icon: "building",
      iconBg: "bg-blue-500",
      borderAccent: "border-blue-500/30",
      gradientFrom: "#eff6ff",
      gradientTo: "#bfdbfe",
      darkGradientFrom: "#1e1b4b",
      darkGradientTo: "#1e3a5f",
    },
  ];
}

// ─── Générateur de reçu depuis une facture payée ─────────────────────────────

function InvoiceReceiptGenerator() {
  const { data: allInvoices = [] } = useInvoices();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  // Filtrer les factures payées
  const paidInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status === "PAID"),
    [allInvoices],
  );

  const selectedInvoice = useMemo(
    () => paidInvoices.find((inv) => inv.id === selectedInvoiceId),
    [paidInvoices, selectedInvoiceId],
  );

  // Construire un SavedReceipt "virtuel" depuis la facture sélectionnée
  const virtualReceipt = useMemo((): SavedReceipt | null => {
    if (!selectedInvoice) return null;
    return {
      id: selectedInvoice.id,
      number: `REC-${selectedInvoice.number}`,
      status: "PAID",
      date: selectedInvoice.date,
      total: selectedInvoice.total,
      description: `Paiement de la facture ${selectedInvoice.number}`,
      paymentMethod: "TRANSFER",
      notes: null,
      client: {
        ...selectedInvoice.client,
        phone: null,           // SavedInvoice.client n'a pas phone
        address: selectedInvoice.client.address ?? null,
        postalCode: selectedInvoice.client.postalCode ?? null,
      },
      user: {
        name: selectedInvoice.user.companyName ?? "Mon entreprise",
        ...selectedInvoice.user,
      },
      createdAt: selectedInvoice.date,
    };
  }, [selectedInvoice]);

  if (paidInvoices.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-violet-400/60 italic">
        Aucune facture payée pour le moment.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex-1">
        <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
          <SelectTrigger className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 cursor-pointer">
            <SelectValue placeholder="Sélectionner une facture payée..." />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25">
            {paidInvoices.map((inv) => (
              <SelectItem
                key={inv.id}
                value={inv.id}
                className="focus:bg-violet-100 dark:focus:bg-violet-500/20 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer"
              >
                <span className="font-semibold">{inv.number}</span>
                <span className="text-slate-400 dark:text-violet-300/60 ml-2">
                  — {getInvoiceClientName(inv.client)} — {formatAmount(inv.total)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {virtualReceipt ? (
        <PDFDownloadLink
          document={<ReceiptPdfDocument receipt={virtualReceipt} />}
          fileName={`${virtualReceipt.number}.pdf`}
        >
          {({ loading }) => (
            <Button
              type="button"
              disabled={loading || !selectedInvoice}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shrink-0 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Download className="size-4 mr-2" />
              )}
              Générer le PDF
            </Button>
          )}
        </PDFDownloadLink>
      ) : (
        <Button
          type="button"
          disabled
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shrink-0 opacity-50 cursor-not-allowed"
        >
          <Download className="size-4 mr-2" />
          Générer le PDF
        </Button>
      )}
    </div>
  );
}

// ─── Contenu de la page ───────────────────────────────────────────────────────

function ReceiptsPageContent() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<SavedReceipt | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: allReceipts = [], isLoading } = useReceipts();
  const deleteMutation = useDeleteReceipt();

  // Map id → SavedReceipt
  const receiptMap = useMemo(() => {
    const m = new Map<string, SavedReceipt>();
    for (const r of allReceipts) m.set(r.id, r);
    return m;
  }, [allReceipts]);

  const handleSearch = useCallback((v: string) => setSearch(v), []);

  // Lignes filtrées par recherche
  const allRows = useMemo(() => allReceipts.map(toRow), [allReceipts]);
  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [allRows, search]);

  const kpis = useMemo(() => buildKpis(allReceipts), [allReceipts]);

  // Colonnes du tableau
  const columns = useMemo(
    (): Column<ReceiptRow>[] => [
      {
        key: "number",
        label: "N° Reçu",
        render: (row) => (
          <span className="text-xs lg:text-sm font-semibold text-violet-600 dark:text-violet-400">
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
        key: "description",
        label: "Objet",
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] block">
            {row.description}
          </span>
        ),
      },
      {
        key: "paymentMethod",
        label: "Mode",
        align: "center",
        render: (row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40">
            {row.paymentMethod}
          </span>
        ),
      },
      {
        key: "date",
        label: "Date",
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
        key: "amount",
        label: "Montant",
        align: "right",
        sortable: true,
        getValue: (row) => receiptMap.get(row.id)?.total ?? 0,
        render: (row) => (
          <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">
            {row.amount}
          </span>
        ),
      },
    ],
    [receiptMap],
  );

  const handleRowClick = useCallback(
    (row: ReceiptRow) => {
      const r = receiptMap.get(row.id);
      if (r) {
        setPreviewReceipt(r);
        setPreviewOpen(true);
      }
    },
    [receiptMap],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTargetId) return;
    deleteMutation.mutate(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteMutation]);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Reçus"
        subtitle="Gérez vos reçus et encaissements"
        ctaLabel="Nouveau reçu"
        ctaIcon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
        ctaVariant="gradient"
        onCtaClick={() => setModalOpen(true)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Générateur de reçu depuis une facture payée */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-md shadow-slate-200/50 dark:shadow-violet-950/30 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20">
            <FileCheck className="size-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Générer un reçu depuis une facture payée
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-violet-400/60">
              Sélectionnez une facture — le PDF est généré sans être stocké
            </p>
          </div>
        </div>
        <InvoiceReceiptGenerator />
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          placeholder="Rechercher par n°, client, objet..."
          onSearch={handleSearch}
        />
      </div>

      {/* Table des reçus manuels */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20">
          <div>
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Reçus manuels
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isLoading
                ? "Chargement..."
                : `${filteredRows.length} reçu${filteredRows.length > 1 ? "s" : ""} (espèces, chèque…)`}
            </p>
          </div>
        </div>
        <DataTable<ReceiptRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          mobileFields={["number", "client"]}
          mobileAmountKey="amount"
          onRowClick={handleRowClick}
          actions={(row) => (
            <ActionButtons onDelete={() => setDeleteTargetId(row.id)} />
          )}
          emptyTitle={isLoading ? "Chargement…" : "Aucun reçu manuel"}
          emptyDescription={
            isLoading
              ? "Récupération des reçus en cours…"
              : "Créez un reçu pour enregistrer un paiement en espèces, chèque ou autre."
          }
        />
      </div>

      {/* Modal création */}
      <ReceiptModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Modal aperçu */}
      <ReceiptPreviewModal
        receipt={previewReceipt}
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
            <AlertDialogTitle>Supprimer ce reçu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le reçu sera définitivement supprimé.
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

// ─── Page avec Suspense ───────────────────────────────────────────────────────

export default function ReceiptsPage() {
  return (
    <Suspense>
      <ReceiptsPageContent />
    </Suspense>
  );
}
