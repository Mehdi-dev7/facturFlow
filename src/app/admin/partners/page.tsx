// src/app/admin/partners/page.tsx
// Page admin — gestion du système d'affiliation / partenaires.
// Server Component : récupère les données et les passe au Client Component.

import { getPartners } from "@/lib/actions/partners";
import PartnersClient from "./partners-client";
import { Users2, Euro, Clock, CheckCircle2 } from "lucide-react";

// ─── Stats cards ─────────────────────────────────────────────────────────────

async function PartnerStatsCards() {
  const result = await getPartners();
  if (!result.success || !result.data) return null;

  const partners = result.data;

  // Calculer les agrégats globaux
  const totalPartners = partners.length;
  const totalReferrals = partners.reduce((sum, p) => sum + p.referralsCount, 0);
  const totalDue = partners.reduce((sum, p) => sum + p.totalDue, 0);
  const totalPaid = partners.reduce((sum, p) => sum + p.totalPaid, 0);

  const cards = [
    {
      label: "Partenaires actifs",
      value: totalPartners,
      icon: Users2,
      color: "text-violet-400",
      bg: "bg-violet-950/50 border-violet-800/50",
      format: "number",
    },
    {
      label: "Users référés",
      value: totalReferrals,
      icon: Users2,
      color: "text-blue-400",
      bg: "bg-blue-950/40 border-blue-800/40",
      format: "number",
    },
    {
      label: "Commissions dues",
      value: totalDue,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-800/40",
      format: "currency",
    },
    {
      label: "Total payé",
      value: totalPaid,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-800/40",
      format: "currency",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.bg} p-4 flex flex-col gap-2`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {card.label}
            </span>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <span className={`text-2xl font-bold ${card.color}`}>
            {card.format === "currency"
              ? `${card.value.toFixed(2)} €`
              : card.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartnersPage() {
  const result = await getPartners();
  const partners = result.data ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Partenaires & Affiliation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les partenaires et leurs commissions d'affiliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Euro className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Monthly 10% · Yearly 15% · Max 12 périodes</span>
        </div>
      </div>

      {/* Stats */}
      <PartnerStatsCards />

      {/* Table partenaires (Client Component pour les interactions) */}
      <PartnersClient initialPartners={partners} />
    </div>
  );
}
