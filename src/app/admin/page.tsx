// src/app/admin/page.tsx
// Dashboard admin : stats + table utilisateurs avec accès invité.

import { Suspense } from "react";
import { getAdminStats, getAdminUsers } from "@/lib/actions/admin";
import { getReviews } from "@/lib/actions/reviews";
import AdminDashboardClient from "./admin-dashboard-client";
import { Users, Crown, Sparkles, Gift, Timer } from "lucide-react";

// ─── Stats cards (Server) ────────────────────────────────────────────────────

async function StatsCards() {
  const result = await getAdminStats();
  if (!result.success || !result.data) return null;

  const { total, free, pro, business, invited, trial } = result.data;

  const cards = [
    { label: "Total users", value: total, icon: Users, color: "text-slate-300", bg: "bg-slate-800" },
    { label: "FREE", value: free, icon: Crown, color: "text-slate-400", bg: "bg-slate-800" },
    { label: "PRO", value: pro, icon: Sparkles, color: "text-violet-400", bg: "bg-violet-950/50 border-violet-800/50" },
    { label: "BUSINESS", value: business, icon: Crown, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/40" },
    { label: "Invités", value: invited, icon: Gift, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/40" },
    { label: "En trial", value: trial, icon: Timer, color: "text-amber-300", bg: "bg-amber-950/30 border-amber-800/30" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border border-slate-700/50 ${card.bg} p-4 flex flex-col gap-2`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{card.label}</span>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const search = params.search ?? "";
  const planFilter = params.plan ?? "";

  const [usersResult, reviewsResult] = await Promise.all([
    getAdminUsers({ page, search, planFilter }),
    getReviews(),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Gestion des utilisateurs FacturNow</p>
      </div>

      {/* Stats */}
      <Suspense fallback={<div className="h-20 mb-8 rounded-xl bg-slate-800 animate-pulse" />}>
        <StatsCards />
      </Suspense>

      {/* Table utilisateurs (Client Component pour les interactions) */}
      <AdminDashboardClient
        initialUsers={usersResult.data?.users ?? []}
        totalPages={usersResult.data?.pages ?? 1}
        totalUsers={usersResult.data?.total ?? 0}
        currentPage={page}
        currentSearch={search}
        currentPlan={planFilter}
        initialReviews={reviewsResult.data ?? []}
      />
    </div>
  );
}
