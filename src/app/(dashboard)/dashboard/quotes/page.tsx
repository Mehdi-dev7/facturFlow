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
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import type { QuoteStatus } from "@/components/dashboard/status-badge";
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
import { useQuotes, useDeleteQuote, type SavedQuote } from "@/hooks/use-quotes";
import { StatusDropdownQuote } from "@/components/dashboard/status-dropdown-quote";
import { QuotePreviewModal } from "@/components/devis/quote-preview-modal";

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface QuoteRow {
  id: string;
  number: string;
  client: string;
  date: string;
  validUntil: string;
  amount: string;
  status: QuoteStatus;
  dbStatus: string;
}

const statusOrder: Record<QuoteStatus, number> = {
  "à envoyer": 0,
  "envoyé": 1,
  "en attente": 2,
  "accepté": 3,
  "refusé": 4,
  "expiré": 5,
  "brouillon": 6,
};

function mapDocStatus(status: string): QuoteStatus {
  switch (status) {
    case "DRAFT":     return "à envoyer";
    case "SENT":      return "envoyé";
    case "ACCEPTED":  return "accepté";
    case "REJECTED":  return "refusé";
    case "CANCELLED": return "expiré";
    default:          return "à envoyer";
  }
}

function getClientName(client: SavedQuote["client"]): string {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatAmountFR(amount: number): string {
  return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " \u20AC";
}

function toRow(q: SavedQuote): QuoteRow {
  return {
    id: q.id,
    number: q.number,
    client: getClientName(q.client),
    date: formatDateFR(q.date),
    validUntil: formatDateFR(q.validUntil),
    amount: formatAmountFR(q.total),
    status: mapDocStatus(q.status),
    dbStatus: q.status,
  };
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

// ─── Composant interne qui lit searchParams ────────────────────────────────

function QuotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [previewQuote, setPreviewQuote] = useState<SavedQuote | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch real data
  const { data: allQuotes = [], isLoading } = useQuotes();
  const deleteMutation = useDeleteQuote();

  // Map DB id → SavedQuote pour acces rapide
  const quoteMap = useMemo(() => {
    const m = new Map<string, SavedQuote>();
    for (const q of allQuotes) m.set(q.id, q);
    return m;
  }, [allQuotes]);

  // Ouvrir la modal si ?preview=<id> dans l'URL
  const previewOpenedRef = useRef(false);
  useEffect(() => {
    if (!previewId || isLoading || previewOpenedRef.current) return;
    const q = quoteMap.get(previewId);
    if (q) {
      previewOpenedRef.current = true;
      setPreviewQuote(q);
      setPreviewOpen(true);
    }
  }, [previewId, quoteMap, isLoading]);

  // Nettoyer ?preview= de l'URL quand la modal se ferme
  const handlePreviewClose = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open && previewId) {
      previewOpenedRef.current = false;
      router.replace("/dashboard/quotes", { scroll: false });
    }
  }, [previewId, router]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);
  const handleMonthChange = useCallback((date: Date) => setSelectedMonth(date), []);

  const selectedMonthKey = useMemo(() => {
    const m = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    return `${selectedMonth.getFullYear()}-${m}`;
  }, [selectedMonth]);

  // Conversion en lignes de tableau
  const allRows = useMemo(() => allQuotes.map(toRow), [allQuotes]);

  // Filtrage par mois
  const monthRows = useMemo(
    () => allRows.filter((row) => {
      const q = quoteMap.get(row.id);
      return q ? getMonthKey(q.date) === selectedMonthKey : false;
    }),
    [allRows, quoteMap, selectedMonthKey],
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

  // KPIs calcules sur le mois courant
  const kpis = useMemo((): KpiData[] => {
    const total = monthRows.length;
    const accepted = monthRows.filter((r) => r.status === "accepté").length;
    const sent = monthRows.filter((r) => r.status === "envoyé").length;
    const rejected = monthRows.filter((r) => r.status === "refusé").length;

    return [
      {
        label: "Devis ce mois",
        value: String(total),
        change: `${total} devis`,
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
        label: "Acceptés",
        value: String(accepted),
        change: `${accepted} accept\u00E9${accepted > 1 ? "s" : ""}`,
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
        change: `${sent} envoy\u00E9${sent > 1 ? "s" : ""}`,
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
        label: "Refusés",
        value: String(rejected),
        change: `${rejected} refus\u00E9${rejected > 1 ? "s" : ""}`,
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
  }, [monthRows]);

  // Colonnes du tableau
  const columns = useMemo((): Column<QuoteRow>[] => [
    {
      key: "number",
      label: "N° Devis",
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
      key: "validUntil",
      label: "Validité",
      sortable: true,
      getValue: (row) => row.validUntil !== " -2014" ? new Date(row.validUntil.split("/").reverse().join("-")).getTime() : 0,
      render: (row) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{row.validUntil}</span>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      align: "right" as const,
      sortable: true,
      getValue: (row) => quoteMap.get(row.id)?.total ?? 0,
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
        <StatusDropdownQuote quoteId={row.id} dbStatus={row.dbStatus} />
      ),
    },
  ], [quoteMap]);

  // Archive
  const archiveData = useMemo(() => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const grouped: Record<number, Record<number, number>> = {};
    for (const q of allQuotes) {
      const d = new Date(q.date);
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
  }, [allQuotes, selectedMonth]);

  const handleArchiveSelect = useCallback((year: number, monthName: string) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const idx = monthNames.indexOf(monthName);
    if (idx >= 0) setSelectedMonth(new Date(year, idx, 1));
  }, []);

  // Ouvrir la modal au clic sur une ligne (vrais brouillons → page d'édition)
  const handleRowClick = useCallback((row: QuoteRow) => {
    const q = quoteMap.get(row.id);
    if (!q) return;

    // Si c'est un vrai brouillon (numéro temporaire), aller vers l'édition
    if (row.dbStatus === "DRAFT" && q.number.startsWith("BROUILLON-")) {
      router.push(`/dashboard/quotes/${row.id}/edit`);
      return;
    }

    // Sinon, ouvrir la modal de prévisualisation
    setPreviewQuote(q);
    setPreviewOpen(true);
  }, [quoteMap, router]);

  // Édition directe (toujours vers la page d'édition)
  const handleEdit = useCallback((row: QuoteRow) => {
    router.push(`/dashboard/quotes/${row.id}/edit`);
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
        title="Devis"
        subtitle="Créez et gérez vos devis"
        ctaLabel="Nouveau devis"
        ctaHref="/dashboard/quotes/new"
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
        <DataTable<QuoteRow>
          data={filteredRows}
          columns={columns}
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
          emptyTitle={isLoading ? "Chargement..." : "Aucun devis trouvé"}
          emptyDescription={
            isLoading
              ? "Récupération des devis en cours..."
              : "Aucun devis ne correspond à votre recherche pour ce mois."
          }
        />
      </div>

      {/* Archive Section */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}

      {/* Modal aperçu */}
      <QuotePreviewModal
        quote={previewQuote}
        open={previewOpen}
        onOpenChange={handlePreviewClose}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis sera définitivement supprimé.
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

export default function QuotesPage() {
  return (
    <Suspense>
      <QuotesPageContent />
    </Suspense>
  );
}
