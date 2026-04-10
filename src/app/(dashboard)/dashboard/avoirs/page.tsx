"use client";

// Page liste des avoirs (notes de crédit)
// Création directement depuis cette page via sélection d'une facture (pattern identique aux reçus)

import { useState, useMemo, useCallback, Suspense } from "react";
import { FileMinus, Loader2, Send, CheckCircle2 } from "lucide-react";
import {
  PageHeader,
  KpiCard,
  SearchBar,
  DataTable,
  ActionButtons,
  MonthSelector,
  ArchiveSection,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { InvoiceSearchCombobox } from "@/components/shared/invoice-search-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreditNotes, useDeleteCreditNote } from "@/hooks/use-credit-notes";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import type { SavedCreditNote } from "@/lib/types/credit-notes";
import { CREDIT_NOTE_REASONS } from "@/lib/types/credit-notes";
import { useInvoices } from "@/hooks/use-invoices";
import { createCreditNote } from "@/lib/actions/credit-notes";
import { sendCreditNoteEmail } from "@/lib/actions/send-credit-note-email";
import { CreditNotePreviewModal } from "@/components/avoirs/credit-note-preview-modal";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Types & Helpers ──────────────────────────────────────────────────────────

interface CreditNoteRow {
  id: string;
  number: string;
  client: string;
  invoiceNumber: string;
  date: string;
  amount: string;
  reason: string;
}

function getClientName(client: SavedCreditNote["client"]): string {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}


function getReasonLabel(value: string): string {
  return CREDIT_NOTE_REASONS.find((r) => r.value === value)?.label ?? value;
}

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

// Retourne "YYYY-MM" à partir d'une date ISO
function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toRow(cn: SavedCreditNote, currency: string): CreditNoteRow {
  return {
    id: cn.id,
    number: cn.number,
    client: getClientName(cn.client),
    invoiceNumber: cn.invoiceNumber,
    date: formatDateFR(cn.date),
    amount: formatCurrency(cn.total, currency),
    reason: getReasonLabel(cn.reason),
  };
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

function buildKpis(creditNotes: SavedCreditNote[], currency: string): KpiData[] {
  const total = creditNotes.length;
  const totalAmount = creditNotes.reduce((s, cn) => s + cn.total, 0);

  return [
    {
      label: "Total avoirs",
      value: String(total),
      change: `${total} avoir${total > 1 ? "s" : ""}`,
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
      label: "Montant total crédité",
      value: formatCurrency(totalAmount, currency),
      change: "Tous avoirs confondus",
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

// ─── Générateur d'avoir depuis une facture ────────────────────────────────────

function InvoiceCreditNoteGenerator() {
  const queryClient = useQueryClient();
  const { data: allInvoices = [] } = useInvoices();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [type, setType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [wasSent, setWasSent] = useState(false);

  // Factures éligibles (tout sauf brouillons)
  // Uniquement les factures payées (logique métier : on n'émet un avoir que sur du payé)
  const eligibleInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status === "PAID"),
    [allInvoices],
  );

  const selectedInvoice = useMemo(
    () => eligibleInvoices.find((inv) => inv.id === selectedInvoiceId),
    [eligibleInvoices, selectedInvoiceId],
  );

  // Réinitialiser les champs quand on change de facture
  const handleInvoiceChange = useCallback((value: string) => {
    setSelectedInvoiceId(value);
    setType("full");
    setAmount("");
    setReason("");
    setWasSent(false);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!selectedInvoice || !reason || isCreating) return;

    if (type === "partial") {
      const parsed = parseFloat(amount.replace(",", "."));
      if (!parsed || parsed <= 0 || parsed > selectedInvoice.total) {
        toast.error("Montant invalide (doit être entre 0 et " + formatCurrency(selectedInvoice.total, currency) + ")");
        return;
      }
    }

    setIsCreating(true);
    try {
      const parsed = type === "partial" ? parseFloat(amount.replace(",", ".")) : undefined;

      const result = await createCreditNote({
        invoiceId: selectedInvoice.id,
        type,
        amount: parsed,
        reason,
      });

      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la création de l'avoir");
        return;
      }

      // Envoyer l'email en arrière-plan
      sendCreditNoteEmail(result.data.id).catch((err) =>
        console.error("[avoir] Erreur envoi email:", err),
      );

      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      toast.success(`Avoir ${result.data.number} créé et envoyé à ${selectedInvoice.client.email}`);
      setWasSent(true);
      setSelectedInvoiceId("");
      setType("full");
      setAmount("");
      setReason("");
    } finally {
      setIsCreating(false);
    }
  }, [selectedInvoice, type, amount, reason, isCreating, queryClient]);

  if (eligibleInvoices.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-violet-400/60 italic">
        Aucune facture disponible pour émettre un avoir.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ligne 1 : combobox de recherche de facture */}
      <InvoiceSearchCombobox
        invoices={eligibleInvoices}
        value={selectedInvoiceId}
        onChange={handleInvoiceChange}
        placeholder="Rechercher une facture payée..."
      />

      {/* Options si facture sélectionnée */}
      {selectedInvoice && (
        <div className="space-y-3 pt-1">
          {/* Type : total / partiel */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs xs:text-sm text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="creditType"
                value="full"
                checked={type === "full"}
                onChange={() => setType("full")}
                className="accent-rose-600 cursor-pointer"
              />
              Total ({formatCurrency(selectedInvoice.total, currency)})
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs xs:text-sm text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="creditType"
                value="partial"
                checked={type === "partial"}
                onChange={() => setType("partial")}
                className="accent-rose-600 cursor-pointer"
              />
              Partiel
            </label>
          </div>

          {/* Montant si partiel */}
          {type === "partial" && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Montant (max ${formatCurrency(selectedInvoice.total, currency)})`}
              min={0.01}
              max={selectedInvoice.total}
              step={0.01}
              className="w-full max-w-xs rounded-xl border border-slate-300 dark:border-violet-400/30 bg-white/90 dark:bg-[#2a2254]/80 px-3 py-1.5 text-xs xs:text-sm text-slate-900 dark:text-violet-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          )}

          {/* Motif */}
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full max-w-xs sm:max-w-sm h-auto min-h-9 py-1.5 bg-white/90 dark:bg-[#2a2254]/80 border-slate-300 dark:border-violet-400/30 rounded-xl text-[11px] xs:text-xs sm:text-sm text-slate-900 dark:text-violet-100 cursor-pointer">
              <SelectValue placeholder="Motif de l'avoir..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg dark:shadow-violet-950/50 bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30">
              {CREDIT_NOTE_REASONS.map((r) => (
                <SelectItem
                  key={r.value}
                  value={r.value}
                  className="text-slate-800 dark:text-violet-100 focus:bg-violet-100 dark:focus:bg-violet-500/25 cursor-pointer"
                >
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bouton créer + badge succès */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={!reason || isCreating}
              onClick={handleCreate}
              className="bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {isCreating ? (
                <Loader2 className="size-3.5 sm:size-4 animate-spin mr-1.5" />
              ) : (
                <Send className="size-3.5 sm:size-4 mr-1.5" />
              )}
              {isCreating ? "Création en cours..." : "Émettre l'avoir et envoyer par email"}
            </Button>

            {wasSent && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shrink-0">
                <CheckCircle2 size={12} />
                Émis
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contenu de la page ───────────────────────────────────────────────────────

function AvoirsPageContent() {
  const [search, setSearch] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [previewCreditNote, setPreviewCreditNote] = useState<SavedCreditNote | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { currency } = useAppearance();
  const { data: allCreditNotes = [], isLoading } = useCreditNotes();
  const deleteMutation = useDeleteCreditNote();

  const creditNoteMap = useMemo(() => {
    const m = new Map<string, SavedCreditNote>();
    for (const cn of allCreditNotes) m.set(cn.id, cn);
    return m;
  }, [allCreditNotes]);

  const handleSearch = useCallback((v: string) => setSearch(v), []);
  const handleMonthChange = useCallback((date: Date) => setSelectedMonth(date), []);

  const handleRowClick = useCallback((row: CreditNoteRow) => {
    const cn = creditNoteMap.get(row.id);
    if (cn) {
      setPreviewCreditNote(cn);
      setIsPreviewOpen(true);
    }
  }, [creditNoteMap]);

  // Clé du mois sélectionné au format "YYYY-MM"
  const selectedMonthKey = useMemo(() => getMonthKey(selectedMonth.toISOString()), [selectedMonth]);

  const allRows = useMemo(() => allCreditNotes.map((cn) => toRow(cn, currency)), [allCreditNotes, currency]);

  // Filtre par mois
  const monthRows = useMemo(
    () => allRows.filter((row) => {
      const cn = creditNoteMap.get(row.id);
      return cn ? getMonthKey(cn.date) === selectedMonthKey : false;
    }),
    [allRows, creditNoteMap, selectedMonthKey],
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return monthRows;
    const q = search.toLowerCase();
    return monthRows.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q),
    );
  }, [monthRows, search]);

  // Archive : mois avec avoirs, regroupés par année (années précédentes)
  const archiveData = useMemo(() => {
    const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const grouped: Record<number, Record<number, number>> = {};
    for (const cn of allCreditNotes) {
      const d = new Date(cn.date);
      const y = d.getFullYear(); const mo = d.getMonth() + 1;
      if (!grouped[y]) grouped[y] = {};
      grouped[y][mo] = (grouped[y][mo] || 0) + 1;
    }
    const cy = selectedMonth.getFullYear(); const cm = selectedMonth.getMonth() + 1;
    const currentYear = new Date().getFullYear();
    return Object.entries(grouped)
      .map(([yearStr, months]) => ({
        year: parseInt(yearStr, 10),
        months: Object.entries(months)
          .filter(([mStr]) => {
            const y = parseInt(yearStr, 10); const mo = parseInt(mStr, 10);
            return !(y === cy && mo === cm) && y < currentYear;
          })
          .map(([mStr, count]) => ({ month: MONTH_NAMES[parseInt(mStr, 10) - 1], count }))
          .sort((a, b) => MONTH_NAMES.indexOf(b.month) - MONTH_NAMES.indexOf(a.month)),
      }))
      .filter((y) => y.months.length > 0)
      .sort((a, b) => b.year - a.year);
  }, [allCreditNotes, selectedMonth]);

  const handleArchiveSelect = useCallback((year: number, monthName: string) => {
    const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const idx = MONTH_NAMES.indexOf(monthName);
    if (idx >= 0) setSelectedMonth(new Date(year, idx, 1));
  }, []);

  // KPIs calculés sur le mois sélectionné
  const kpis = useMemo(() => buildKpis(
    allCreditNotes.filter((cn) => getMonthKey(cn.date) === selectedMonthKey),
    currency
  ), [allCreditNotes, selectedMonthKey, currency]);

  const columns = useMemo(
    (): Column<CreditNoteRow>[] => [
      {
        key: "number",
        label: "N° Avoir",
        headerClassName: "md:w-[130px] lg:w-auto",
        cellClassName: "md:w-[130px] lg:w-auto overflow-hidden",
        render: (row) => (
          <span className="text-[11px] lg:text-xs xl:text-sm font-semibold text-rose-600 dark:text-rose-400 block truncate md:max-w-[110px] lg:max-w-none">
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
        key: "reason",
        label: "Motif",
        render: (row) => (
          <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate max-w-[160px] block">
            {row.reason}
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
        getValue: (row) => creditNoteMap.get(row.id)?.total ?? 0,
        render: (row) => (
          <span className="text-xs lg:text-sm font-semibold text-rose-600 dark:text-rose-400">
            − {row.amount}
          </span>
        ),
      },
    ],
    [creditNoteMap],
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
        title="Avoirs"
        subtitle="Gérez vos notes de crédit"
      />

      {/* KPI Cards — 1 col mobile, 2 col md+, taille limitée sur grand écran */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 max-w-2xl lg:max-w-5xl">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Générateur d'avoir depuis une facture — même pattern que la page Reçus */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-md shadow-slate-200/50 dark:shadow-violet-950/30 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-2.5 lg:p-3 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20">
            <FileMinus className="size-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Émettre un avoir depuis une facture
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-violet-400/60">
              Sélectionnez une facture — créez un avoir total ou partiel et envoyez-le par email
            </p>
          </div>
        </div>
        <InvoiceCreditNoteGenerator />
      </div>

      {/* Search + Month Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Rechercher par n° avoir, client, facture..."
            onSearch={handleSearch}
          />
        </div>
        <MonthSelector value={selectedMonth} onChange={handleMonthChange} />
      </div>

      {/* Tableau des avoirs */}
      <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20">
          <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 shrink-0">
            <FileMinus className="size-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Avoirs émis
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isLoading
                ? "Chargement..."
                : `${filteredRows.length} avoir${filteredRows.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <DataTable<CreditNoteRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          limit={10}
          mobileFields={["number", "client"]}
          mobileAmountKey="amount"
          onRowClick={handleRowClick}
          actions={(row) => (
            <ActionButtons onDelete={() => setDeleteTargetId(row.id)} />
          )}
          emptyTitle={isLoading ? "Chargement…" : "Aucun avoir ce mois-ci"}
          emptyDescription={
            isLoading
              ? "Récupération des avoirs en cours…"
              : "Aucun avoir pour ce mois. Consultez l'archive ci-dessous ou changez de mois."
          }
        />
      </div>

      {/* Archive — mois précédents avec des avoirs */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}

      {/* Modale suppression */}
      <DeleteConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
        documentLabel="l'avoir"
        documentNumber={deleteTargetId ? (creditNoteMap.get(deleteTargetId)?.number ?? "") : ""}
      />

      {/* Modale prévisualisation avoir */}
      <CreditNotePreviewModal
        creditNote={previewCreditNote}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}

// ─── Page avec Suspense ───────────────────────────────────────────────────────

export default function AvoirsPage() {
  return (
    <Suspense>
      <AvoirsPageContent />
    </Suspense>
  );
}
