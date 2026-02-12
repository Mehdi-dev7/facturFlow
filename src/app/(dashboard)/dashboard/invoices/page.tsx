"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
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
  parseDate,
  parseAmount,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import type { InvoiceStatus } from "@/components/dashboard/status-badge";
import { mockInvoices } from "@/lib/mock-data/invoices";
import type { Invoice } from "@/lib/mock-data/invoices";

const statusOrder: Record<InvoiceStatus, number> = {
  impayée: 0,
  "en attente": 1,
  payée: 2,
};

function getMonthKey(dateStr: string): string {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}`;
}

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleMonthChange = useCallback((date: Date) => {
    setSelectedMonth(date);
  }, []);

  const handleEdit = useCallback((invoice: Invoice) => {
    // TODO: navigate to edit page
    console.log("Edit invoice:", invoice.id);
  }, []);

  const handleDelete = useCallback((invoice: Invoice) => {
    // TODO: handle delete
    console.log("Delete invoice:", invoice.id);
  }, []);

  const selectedMonthKey = useMemo(() => {
    const m = (selectedMonth.getMonth() + 1).toString().padStart(2, "0");
    const y = selectedMonth.getFullYear().toString();
    return `${y}-${m}`;
  }, [selectedMonth]);

  // Filter invoices by selected month
  const monthInvoices = useMemo(() => {
    return mockInvoices.filter((inv) => getMonthKey(inv.date) === selectedMonthKey);
  }, [selectedMonthKey]);

  // Search filtering
  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return monthInvoices;
    const q = search.toLowerCase();
    return monthInvoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
    );
  }, [monthInvoices, search]);

  // KPI values computed from current month invoices
  const kpis = useMemo((): KpiData[] => {
    const total = monthInvoices.length;
    const paid = monthInvoices.filter((i) => i.status === "payée").length;
    const pending = monthInvoices.filter((i) => i.status === "en attente").length;
    const unpaid = monthInvoices.filter((i) => i.status === "impayée").length;

    const pendingAmount = monthInvoices
      .filter((i) => i.status === "en attente")
      .reduce((sum, i) => sum + parseAmount(i.amount), 0);
    const unpaidAmount = monthInvoices
      .filter((i) => i.status === "impayée")
      .reduce((sum, i) => sum + parseAmount(i.amount), 0);

    const paidPct = total > 0 ? ((paid / total) * 100).toFixed(1) + "%" : "0%";
    const fmtPending = pendingAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " \u20AC";
    const fmtUnpaid = unpaidAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " \u20AC";

    return [
      {
        label: "Factures ce mois",
        value: String(total),
        change: `${total} facture${total > 1 ? "s" : ""}`,
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
        label: "Payées",
        value: String(paid),
        change: paidPct,
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
        value: String(pending),
        change: fmtPending,
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
        label: "Impayées",
        value: String(unpaid),
        change: fmtUnpaid,
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
  }, [monthInvoices]);

  // Table columns
  const columns = useMemo((): Column<Invoice>[] => [
    {
      key: "id",
      label: "N\u00B0 Facture",
      render: (inv) => (
        <span className="text-xs lg:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors">
          {inv.id}
        </span>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (inv) => (
        <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300">{inv.client}</span>
      ),
    },
    {
      key: "date",
      label: "\u00C9mission",
      sortable: true,
      getValue: (inv) => parseDate(inv.date),
      render: (inv) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{inv.date}</span>
      ),
    },
    {
      key: "echeance",
      label: "\u00C9ch\u00E9ance",
      sortable: true,
      getValue: (inv) => parseDate(inv.echeance),
      render: (inv) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{inv.echeance}</span>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      align: "right" as const,
      sortable: true,
      getValue: (inv) => parseAmount(inv.amount),
      render: (inv) => (
        <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.amount}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      align: "center" as const,
      sortable: true,
      getValue: (inv) => statusOrder[inv.status],
      render: (inv) => <StatusBadge status={inv.status} />,
    },
  ], []);

  // Archive data computed from all invoices
  const archiveData = useMemo(() => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const grouped: Record<number, Record<number, number>> = {};
    for (const inv of mockInvoices) {
      const [, month, year] = inv.date.split("/");
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      if (!grouped[y]) grouped[y] = {};
      grouped[y][m] = (grouped[y][m] || 0) + 1;
    }

    // Exclude current month from archives
    const currentYear = selectedMonth.getFullYear();
    const currentMonthNum = selectedMonth.getMonth() + 1;

    return Object.entries(grouped)
      .map(([yearStr, months]) => ({
        year: parseInt(yearStr, 10),
        months: Object.entries(months)
          .filter(([mStr]) => {
            const y = parseInt(yearStr, 10);
            const m = parseInt(mStr, 10);
            return !(y === currentYear && m === currentMonthNum);
          })
          .map(([mStr, count]) => ({
            month: monthNames[parseInt(mStr, 10) - 1],
            count,
          }))
          .sort((a, b) => monthNames.indexOf(b.month) - monthNames.indexOf(a.month)),
      }))
      .filter((y) => y.months.length > 0)
      .sort((a, b) => b.year - a.year);
  }, [selectedMonth]);

  const handleArchiveSelect = useCallback((year: number, monthName: string) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex >= 0) {
      setSelectedMonth(new Date(year, monthIndex, 1));
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Factures"
        subtitle="Gérez vos factures"
        ctaLabel="Nouvelle facture"
        ctaHref="/dashboard/invoices/new"
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
        <DataTable<Invoice>
          data={filteredInvoices}
          columns={columns}
          getRowId={(inv) => inv.id}
          mobileFields={["id", "client"]}
          actions={(inv) => (
            <ActionButtons
              onEdit={() => handleEdit(inv)}
              onDelete={() => handleDelete(inv)}
            />
          )}
          mobileActions={(inv) => (
            <ActionMenuMobile
              onEdit={() => handleEdit(inv)}
              onDelete={() => handleDelete(inv)}
            />
          )}
          emptyTitle="Aucune facture trouvée"
          emptyDescription="Aucune facture ne correspond à votre recherche pour ce mois."
        />
      </div>

      {/* Archive Section */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}
    </div>
  );
}
