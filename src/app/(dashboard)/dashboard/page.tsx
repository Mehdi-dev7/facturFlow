"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import {
  ChartIcon,
  TrendUpIcon,
  KpiCard,
  DataTable,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import type { InvoiceStatus } from "@/components/dashboard/status-badge";
import { StatusDropdown } from "@/components/dashboard/status-dropdown";
import { useInvoices, type SavedInvoice } from "@/hooks/use-invoices";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";
// Lazy load : chargé seulement au premier clic sur une ligne de facture
import dynamic from "next/dynamic";
const InvoicePreviewModal = dynamic(
  () => import("@/components/factures/invoice-preview-modal").then((m) => ({ default: m.InvoicePreviewModal })),
  { ssr: false }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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


interface InvoiceRow {
  id: string;
  number: string;
  client: string;
  date: string;
  echeance: string;
  amount: string;
  rawDate: number;
  status: InvoiceStatus;
  dbStatus: string;
}

const statusOrder: Record<InvoiceStatus, number> = {
  relancée: 0, impayée: 1, "sepa en cours": 2, envoyée: 3, "en attente": 4, "à envoyer": 5, payée: 6,
};

function toRow(inv: SavedInvoice, currency: string): InvoiceRow {
  return {
    id: inv.id,
    number: inv.number,
    client: getClientName(inv.client),
    date: formatDateFR(inv.date),
    echeance: formatDateFR(inv.dueDate),
    amount: formatCurrency(inv.total, currency),
    rawDate: inv.date ? new Date(inv.date).getTime() : 0,
    status: mapDocStatus(inv.status),
    dbStatus: inv.status,
  };
}

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const router = useRouter();
  const [tableVisible, setTableVisible] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<SavedInvoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: session } = useSession();

  const { currency } = useAppearance();

  // Vraies données
  const { data: allInvoices = [], isLoading } = useInvoices();

  // Map id → SavedInvoice pour accès rapide au clic
  const invoiceMap = useMemo(() => {
    const m = new Map<string, SavedInvoice>();
    for (const inv of allInvoices) m.set(inv.id, inv);
    return m;
  }, [allInvoices]);

  useEffect(() => {
    const timer = setTimeout(() => setTableVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Clic sur une ligne : brouillon → édition, sinon → prévisualisation
  const handleRowClick = useCallback((inv: InvoiceRow) => {
    const full = invoiceMap.get(inv.id);
    if (!full) return;
    if (inv.dbStatus === "DRAFT" && full.number.startsWith("BROUILLON-")) {
      router.push(`/dashboard/invoices/${inv.id}/edit`);
      return;
    }
    setPreviewInvoice(full);
    setPreviewOpen(true);
  }, [invoiceMap, router]);

  // 10 factures les plus récentes
  const recentRows = useMemo(() => {
    const rows = allInvoices.map((inv) => toRow(inv, currency));
    // Trier par date desc pour afficher les plus récentes d'abord
    return rows.sort((a, b) => b.rawDate - a.rawDate).slice(0, 10);
  }, [allInvoices, currency]);

  // Colonnes identiques à la page /dashboard/invoices
  const columns = useMemo((): Column<InvoiceRow>[] => [
    {
      key: "number",
      label: "N° Facture",
      headerClassName: "md:w-[120px] lg:w-auto",
      cellClassName: "md:w-[120px] lg:w-auto overflow-hidden",
      render: (row) => (
        <span className="text-[11px] lg:text-xs xl:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors block truncate md:max-w-[100px] lg:max-w-none">
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
        <span className="text-[11px] lg:text-xs xl:text-sm text-slate-700 dark:text-slate-300 block truncate md:max-w-[100px] lg:max-w-none">{row.client}</span>
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

  // KPIs calculés sur le mois courant
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const kpis = useMemo((): KpiData[] => {
    const thisMonth = allInvoices.filter((inv) => {
      if (!inv.date) return false;
      const d = new Date(inv.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const total   = thisMonth.length;
    const paid    = thisMonth.filter((r) => r.status === "PAID").length;
    const pending = thisMonth.filter((r) => r.status === "SENT").length;
    const unpaid  = thisMonth.filter((r) => r.status === "OVERDUE").length;

    const pendingAmount = thisMonth.filter((r) => r.status === "SENT").reduce((s, r) => s + r.total, 0);
    const unpaidAmount  = thisMonth.filter((r) => r.status === "OVERDUE").reduce((s, r) => s + r.total, 0);
    const paidPct = total > 0 ? ((paid / total) * 100).toFixed(1) + "%" : "0%";

    return [
      { label: "Factures ce mois", value: String(total), change: `${total} facture${total > 1 ? "s" : ""}`, changeType: "up", icon: "file", iconBg: "bg-blue-500", borderAccent: "border-blue-500/30", gradientFrom: "#eff6ff", gradientTo: "#bfdbfe", darkGradientFrom: "#1e1b4b", darkGradientTo: "#1e3a5f" },
      { label: "Payées", value: String(paid), change: paidPct, changeType: "up", icon: "check", iconBg: "bg-emerald-500", borderAccent: "border-emerald-500/30", gradientFrom: "#ecfdf5", gradientTo: "#a7f3d0", darkGradientFrom: "#1e1b4b", darkGradientTo: "#064e3b" },
      { label: "En attente", value: String(pending), change: formatCurrency(pendingAmount, currency), changeType: "neutral", icon: "clock", iconBg: "bg-amber-500", borderAccent: "border-amber-500/30", gradientFrom: "#fffbeb", gradientTo: "#fde68a", darkGradientFrom: "#1e1b4b", darkGradientTo: "#78350f" },
      { label: "Impayées", value: String(unpaid), change: formatCurrency(unpaidAmount, currency), changeType: "down", icon: "alert", iconBg: "bg-red-500", borderAccent: "border-red-500/30", gradientFrom: "#fef2f2", gradientTo: "#fecaca", darkGradientFrom: "#1e1b4b", darkGradientTo: "#7f1d1d" },
    ];
  }, [allInvoices, currentYear, currentMonth, currency]);

  // CA annuel = somme des factures payées de l'année en cours
  const caAnnuel = useMemo(() => {
    return allInvoices
      .filter((inv) => {
        if (inv.status !== "PAID" || !inv.date) return false;
        return new Date(inv.date).getFullYear() === currentYear;
      })
      .reduce((s, inv) => s + inv.total, 0);
  }, [allInvoices, currentYear]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Utilisateur";

  // Skeleton — affiché tant que les données ne sont pas chargées (après tous les hooks)
  if (isLoading) return <SkeletonTable variant="table" rows={5} cardCount={4} />;

  return (
    <div>
      {/* ── Header + CA Hero ── */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Bonjour,<span className="text-gradient"> {firstName}</span> 👋
        </h1>
        <p className="mt-1 text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400">
          « Facturation, devis et suivi clients — tout est ici »
        </p>

        {/* CA + Nouvelle facture */}
        <div className="mt-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5">
          {/* CA Annuel */}
          <div
            className="relative overflow-hidden rounded-2xl border border-violet-200/50 dark:border-violet-800/50 p-4 sm:p-6 w-full lg:w-1/2"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(168,85,247,0.05) 50%, rgba(255,255,255,0.8) 100%)", backdropFilter: "blur(16px)" }}
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500 opacity-10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/25 shrink-0">
                <ChartIcon />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  Chiffre d&apos;affaires {currentYear}
                </p>
                {isLoading ? (
                  <div className="h-8 w-40 bg-slate-200 dark:bg-violet-800/40 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {formatCurrency(caAnnuel, currency)}
                  </p>
                )}
              </div>
              <div className="sm:ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 w-fit">
                <TrendUpIcon />
                Factures payées
              </div>
            </div>
          </div>

          {/* Nouvelle facture */}
          <div className="lg:ml-auto">
            <Button variant="gradient" size="lg" className="h-11 sm:h-12 px-6 sm:px-8 font-ui text-sm sm:text-base transition-all duration-300 cursor-pointer hover:scale-105 w-auto" asChild>
              <Link href="/dashboard/invoices/new">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
                Nouvelle facture
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* ── Tableau factures récentes ── */}
      <div
        className={`rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden transition-all duration-700 ease-out ${tableVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-violet-500/20 dark:bg-[#1a1438]">
          <div>
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100">Factures récentes</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isLoading ? "Chargement…" : `${recentRows.length} dernière${recentRows.length > 1 ? "s" : ""} facture${recentRows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/dashboard/invoices"
            className="text-xs sm:text-sm font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-300 transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-violet-500/10 dark:hover:bg-violet-500/20 cursor-pointer"
          >
            Voir tout →
          </Link>
        </div>

        <DataTable<InvoiceRow>
          data={recentRows}
          columns={columns}
          getRowId={(row) => row.id}
          mobileFields={["number", "client"]}
          mobileStatusKey="status"
          mobileAmountKey="amount"
          onRowClick={handleRowClick}
          emptyTitle={isLoading ? "Chargement…" : "Aucune facture"}
          emptyDescription={isLoading ? "Récupération des factures en cours…" : "Créez votre première facture pour commencer."}
        />
      </div>

      {/* Modal prévisualisation facture */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewInvoice(null);
        }}
      />
    </div>
  );
}
