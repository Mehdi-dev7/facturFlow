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
import type { QuoteStatus } from "@/components/dashboard/status-badge";
import { mockQuotes } from "@/lib/mock-data/quotes";
import type { Quote } from "@/lib/mock-data/quotes";

const statusOrder: Record<QuoteStatus, number> = {
  brouillon: 0,
  "en attente": 1,
  envoyé: 2,
  accepté: 3,
  refusé: 4,
  expiré: 5,
};

function getMonthKey(dateStr: string): string {
  const [, month, year] = dateStr.split("/");
  return `${year}-${month}`;
}

export default function QuotesPage() {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleMonthChange = useCallback((date: Date) => {
    setSelectedMonth(date);
  }, []);

  const handleEdit = useCallback((quote: Quote) => {
    // TODO: navigate to edit page
    console.log("Edit quote:", quote.id);
  }, []);

  const handleDelete = useCallback((quote: Quote) => {
    // TODO: handle delete
    console.log("Delete quote:", quote.id);
  }, []);

  const selectedMonthKey = useMemo(() => {
    const m = (selectedMonth.getMonth() + 1).toString().padStart(2, "0");
    const y = selectedMonth.getFullYear().toString();
    return `${y}-${m}`;
  }, [selectedMonth]);

  // Filter quotes by selected month
  const monthQuotes = useMemo(() => {
    return mockQuotes.filter((q) => getMonthKey(q.date) === selectedMonthKey);
  }, [selectedMonthKey]);

  // Search filtering
  const filteredQuotes = useMemo(() => {
    if (!search.trim()) return monthQuotes;
    const q = search.toLowerCase();
    return monthQuotes.filter(
      (quote) =>
        quote.id.toLowerCase().includes(q) ||
        quote.client.toLowerCase().includes(q) ||
        quote.status.toLowerCase().includes(q)
    );
  }, [monthQuotes, search]);

  // KPI values computed from current month quotes
  const kpis = useMemo((): KpiData[] => {
    const pending = monthQuotes.filter(
      (q) => q.status === "en attente" || q.status === "envoyé"
    ).length;
    const accepted = monthQuotes.filter((q) => q.status === "accepté").length;

    return [
      {
        label: "Devis en attente",
        value: String(pending),
        change: `${pending} devis`,
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
        label: "Devis acceptés",
        value: String(accepted),
        change: `${accepted} accepté${accepted > 1 ? "s" : ""}`,
        changeType: "up",
        icon: "check",
        iconBg: "bg-emerald-500",
        borderAccent: "border-emerald-500/30",
        gradientFrom: "#ecfdf5",
        gradientTo: "#a7f3d0",
        darkGradientFrom: "#1e1b4b",
        darkGradientTo: "#064e3b",
      },
    ];
  }, [monthQuotes]);

  // Table columns
  const columns = useMemo((): Column<Quote>[] => [
    {
      key: "id",
      label: "N\u00B0 Devis",
      render: (q) => (
        <span className="text-xs lg:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors">
          {q.id}
        </span>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (q) => (
        <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300">{q.client}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      getValue: (q) => parseDate(q.date),
      render: (q) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{q.date}</span>
      ),
    },
    {
      key: "validUntil",
      label: "Valide jusqu'au",
      sortable: true,
      getValue: (q) => parseDate(q.validUntil),
      render: (q) => (
        <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{q.validUntil}</span>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      align: "right" as const,
      sortable: true,
      getValue: (q) => parseAmount(q.amount),
      render: (q) => (
        <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">{q.amount}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      align: "center" as const,
      sortable: true,
      getValue: (q) => statusOrder[q.status],
      render: (q) => <StatusBadge status={q.status} />,
    },
  ], []);

  // Archive data computed from all quotes
  const archiveData = useMemo(() => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const grouped: Record<number, Record<number, number>> = {};
    for (const q of mockQuotes) {
      const [, month, year] = q.date.split("/");
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      if (!grouped[y]) grouped[y] = {};
      grouped[y][m] = (grouped[y][m] || 0) + 1;
    }

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
        <DataTable<Quote>
          data={filteredQuotes}
          columns={columns}
          getRowId={(q) => q.id}
          mobileFields={["id", "client"]}
          actions={(q) => (
            <ActionButtons
              onEdit={() => handleEdit(q)}
              onDelete={() => handleDelete(q)}
            />
          )}
          mobileActions={(q) => (
            <ActionMenuMobile
              onEdit={() => handleEdit(q)}
              onDelete={() => handleDelete(q)}
            />
          )}
          emptyTitle="Aucun devis trouvé"
          emptyDescription="Aucun devis ne correspond à votre recherche pour ce mois."
        />
      </div>

      {/* Archive Section */}
      {archiveData.length > 0 && (
        <ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
      )}
    </div>
  );
}
