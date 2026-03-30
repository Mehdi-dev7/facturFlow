// src/app/partner/[token]/page.tsx
// Portail partenaire public (sans authentification).
// Accessible via /partner/[token] — le token est secret et unique par partenaire.

import { notFound } from "next/navigation";
import { getPartnerByToken } from "@/lib/actions/partners";
import { CheckCircle2, Clock, Users2, Euro, TrendingUp, Calendar } from "lucide-react";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Mon espace partenaire — FacturNow",
  robots: { index: false, follow: false }, // Jamais indexé
};

// ─── Helpers visuels ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Badge statut commission
function CommissionBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
        <CheckCircle2 className="h-3 w-3" /> Payé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">
      <Clock className="h-3 w-3" /> En attente
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartnerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Récupérer les données partenaire via le token
  const result = await getPartnerByToken(token);

  if (!result.success || !result.data) {
    notFound();
  }

  const { partner, referrals, commissions, totalDue, totalPaid } = result.data;

  // Stats cards
  const stats = [
    {
      label: "Users référés",
      value: referrals.length,
      icon: Users2,
      color: "text-violet-600",
      bg: "bg-violet-50 border-violet-200",
      format: "number",
    },
    {
      label: "Commissions en attente",
      value: totalDue,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      format: "currency",
    },
    {
      label: "Total perçu",
      value: totalPaid,
      icon: Euro,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
      format: "currency",
    },
    {
      label: "Commissions générées",
      value: commissions.length,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      format: "number",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Logo FacturNow */}
              <span className="text-lg font-black tracking-tight text-violet-700">FacturNow</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-medium text-gray-500">Espace partenaire</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{partner.name}</h1>
          </div>

          {/* Code partenaire */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Votre code</span>
            <span className="font-mono text-lg font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1">
              {partner.code}
            </span>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.bg} p-4 flex flex-col gap-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className={`text-2xl font-bold ${stat.color}`}>
                {stat.format === "currency"
                  ? formatCurrency(stat.value as number)
                  : stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Message de versement */}
        {totalDue > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {formatCurrency(totalDue)} en attente de versement
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Votre prochain versement sera calculé et effectué par virement manuel en fin de mois.
                {partner.iban && ` IBAN enregistré : ${partner.iban}`}
              </p>
            </div>
          </div>
        )}

        {/* Tableau des referrals */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users2 className="h-4 w-4 text-violet-500" />
            Users référés ({referrals.length})
          </h2>

          {referrals.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <Users2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Aucun user référé pour l'instant. Partagez votre code <strong>{partner.code}</strong> !
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cycle</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Montant/période</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Votre taux</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Depuis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            referral.plan === "BUSINESS"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-violet-100 text-violet-700"
                          }`}>
                            {referral.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{referral.billingCycle}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {formatCurrency(referral.monthlyAmount)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-violet-600">{referral.commissionRate}%</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${
                            referral.status === "ACTIVE" ? "text-emerald-600" : "text-gray-400"
                          }`}>
                            {referral.status === "ACTIVE" ? "Actif" : "Annulé"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(referral.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Tableau des commissions */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Euro className="h-4 w-4 text-emerald-500" />
            Historique des commissions ({commissions.length})
          </h2>

          {commissions.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <Euro className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Les commissions apparaîtront ici au fil des renouvellements d'abonnement.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Période</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Montant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Payé le</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Généré le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          Période {commission.periodIndex}/12
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {formatCurrency(commission.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <CommissionBadge status={commission.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {commission.paidAt ? formatDate(commission.paidAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {formatDate(commission.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Footer informatif */}
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
          <p>
            Espace partenaire FacturNow · Commission Monthly {partner.commissionMonthly}% (max 12 mois) ·
            Commission Yearly {partner.commissionYearly}% (max 12 renouvellements)
          </p>
          <p className="mt-1">
            Questions ? Contactez-nous à{" "}
            <a href="mailto:contact@facturnow.fr" className="text-violet-600 hover:underline">
              contact@facturnow.fr
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
