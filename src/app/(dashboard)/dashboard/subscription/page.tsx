// src/app/(dashboard)/dashboard/subscription/page.tsx
// Page de gestion de l'abonnement — Server Component.
// Charge les données d'abonnement et rend les cards de pricing (composant client).

import { redirect } from "next/navigation";
import { Crown, Sparkles, CheckCircle, Clock, AlertTriangle, ShieldCheck, Lock, RefreshCcw } from "lucide-react";
import Image from "next/image";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { PricingCards } from "@/components/subscription/pricing-cards";

export const metadata = {
  title: "Abonnement | FacturNow",
  description: "Gérez votre plan FacturNow",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  // checkout = plan à déclencher automatiquement (ex: "pro", "business")
  const { checkout } = await searchParams;

  const result = await getCurrentSubscription();

  // Non authentifié → redirection login
  if (!result.success) redirect("/login");

  const { plan, effectivePlan, trialDaysLeft, trialEndsAt, planExpiresAt, stripeSubId } = result.data;

  const isTrial = plan === "FREE" && effectivePlan === "PRO";
  const hasActiveSub = plan === "PRO" || plan === "BUSINESS";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">
          Abonnement
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
        </p>

        {/* Badge plan actuel */}
        <div className="flex justify-center">
          <PlanBadge
            plan={plan}
            effectivePlan={effectivePlan}
            trialDaysLeft={trialDaysLeft}
          />
        </div>
      </div>

      {/* ── Card Trial actif ── */}
      {isTrial && trialDaysLeft != null && (
        <div className="flex items-start gap-4 bg-violet-50 dark:bg-violet-950/40 border border-violet-300 dark:border-violet-600 rounded-2xl p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 shrink-0">
            <Clock className="h-5 w-5 text-violet-600 dark:text-violet-300" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-violet-800 dark:text-violet-200">
              Vous êtes en période d'essai Pro
            </p>
            <p className="text-sm text-violet-600 dark:text-violet-300">
              Profitez de toutes les fonctionnalités Pro sans restriction.{" "}
              <span className="font-bold">
                Il vous reste {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""}.
              </span>
            </p>
            {trialEndsAt && (
              <p className="text-xs text-violet-500 dark:text-violet-400">
                Fin de l'essai le{" "}
                {new Date(trialEndsAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* ── Plan actuel — actif et renouvelable ── */}
      {hasActiveSub && !planExpiresAt && (
        <div className="flex items-start gap-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">
              Abonnement {plan === "PRO" ? "Pro" : "Business"} actif
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-300">
              Votre abonnement se renouvelle automatiquement chaque mois.
            </p>
          </div>
        </div>
      )}

      {/* ── Plan actuel — annulé, actif jusqu'à l'échéance ── */}
      {hasActiveSub && planExpiresAt && (
        <div className="flex items-start gap-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-2xl p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Abonnement {plan === "PRO" ? "Pro" : "Business"} actif — annulation programmée
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Vous conservez l'accès à toutes les fonctionnalités jusqu'au{" "}
              <span className="font-bold">
                {new Date(planExpiresAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>. Aucun renouvellement ne sera effectué.
            </p>
          </div>
        </div>
      )}

      {/* ── Séparateur ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Choisir un plan
        </span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* ── Bandeau sécurité + branding FacturNow ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-5 py-4">
        {/* Logo FacturNow */}
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/logo/icon.svg" alt="FacturNow" width={28} height={28} />
          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">FacturNow</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">© 2026</span>
        </div>

        {/* Séparateur vertical */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Badges sécurité */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            Paiement SSL chiffré
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Sécurisé par Stripe
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <RefreshCcw className="h-3.5 w-3.5 text-emerald-500" />
            Sans engagement
          </div>
        </div>
      </div>

      {/* ── Cards pricing (client) ── */}
      <PricingCards
        currentPlan={plan}
        effectivePlan={effectivePlan}
        stripeSubId={stripeSubId}
        pendingCheckout={checkout}
      />
    </div>
  );
}
