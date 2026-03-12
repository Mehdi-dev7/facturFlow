"use client";
// src/components/subscription/pricing-cards.tsx
// Section interactive de la page abonnement : toggle mensuel/annuel + boutons checkout.
// Composant client car il gère le state du toggle et les actions Stripe.

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Star, Zap, Building, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createStripeCheckoutSession, cancelSubscription } from "@/lib/actions/subscription";

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingInterval = "monthly" | "yearly";

interface PricingCardsProps {
  currentPlan: string;
  effectivePlan: string;
  stripeSubId: string | null;
  // Plan à checkout automatiquement à l'arrivée sur la page (depuis landing ou signup)
  pendingCheckout?: string;
}

// ─── Config plans ─────────────────────────────────────────────────────────────

const PLAN_FEATURES = {
  FREE: [
    { label: "10 documents par mois", included: true },
    { label: "5 clients maximum", included: true },
    { label: "Virement bancaire uniquement", included: true },
    { label: "5 factures électroniques/mois", included: true },
    { label: "Essai Pro 7 jours inclus", included: true },
    { label: "Paiements en ligne (Stripe/PayPal)", included: false },
    { label: "Relances automatiques", included: false },
  ],
  PRO: [
    { label: "Documents & clients illimités", included: true },
    { label: "Stripe · PayPal · GoCardless SEPA", included: true },
    { label: "Apparence & templates personnalisés", included: true },
    { label: "Relances automatiques (3 niveaux)", included: true },
    { label: "Factures récurrentes", included: true },
    { label: "Statistiques & export CSV", included: true },
    { label: "Factures électroniques illimitées", included: true },
  ],
  BUSINESS: [
    { label: "Tout ce qui est inclus dans Pro", included: true },
    { label: "3 utilisateurs par compte", included: true },
    { label: "Export FEC comptable", included: true },
    { label: "Rapport mensuel comptable (PDF)", included: true },
    { label: "Bilan annuel & URSSAF", included: true },
    { label: "Archivage légal 10 ans", included: true },
    { label: "API & Webhooks", included: true },
    { label: "Support prioritaire", included: true },
    { label: "Factures électroniques illimitées", included: true },
  ],
};

// ─── Sous-composant : FeatureRow ──────────────────────────────────────────────

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5 ${included ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
        {included
          ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          : <X className="h-3 w-3 text-slate-400" />
        }
      </div>
      <span className={`text-sm ${included ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function PricingCards({ currentPlan, effectivePlan, stripeSubId, pendingCheckout }: PricingCardsProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<"PRO" | "BUSINESS" | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Checkout automatique si l'utilisateur arrive depuis la landing page ou après inscription
  useEffect(() => {
    if (!pendingCheckout) return;
    const plan = pendingCheckout.toUpperCase() as "PRO" | "BUSINESS";
    if (plan !== "PRO" && plan !== "BUSINESS") return;
    const timer = setTimeout(() => handleCheckout(plan), 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prix selon l'intervalle
  const proPrice = interval === "yearly" ? "7,99€" : "9,99€";
  const businessPrice = interval === "yearly" ? "19,99€" : "25€";
  const proAnnualNote = interval === "yearly" ? "facturé 95,88€/an" : null;
  const businessAnnualNote = interval === "yearly" ? "facturé 239,88€/an" : null;

  const handleCheckout = useCallback(async (plan: "PRO" | "BUSINESS") => {
    setLoadingPlan(plan);
    try {
      const result = await createStripeCheckoutSession(plan, interval);
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error((result as { error?: string }).error ?? "Impossible de créer la session de paiement.");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoadingPlan(null);
    }
  }, [interval]);

  const handleCancel = useCallback(async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu'à la fin de la période en cours.")) return;
    setCancelling(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        toast.success("Abonnement annulé — actif jusqu'à la fin de la période.");
      } else {
        toast.error((result as { error?: string }).error ?? "Erreur lors de l'annulation.");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setCancelling(false);
    }
  }, []);

  const isFree = effectivePlan === "FREE";
  const isPro = effectivePlan === "PRO" && currentPlan === "PRO";
  const isBusiness = effectivePlan === "BUSINESS";

  return (
    <div className="space-y-8">
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${interval === "monthly" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
          Mensuel
        </span>

        <button
          role="switch"
          aria-checked={interval === "yearly"}
          onClick={() => setInterval((v) => v === "monthly" ? "yearly" : "monthly")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${interval === "yearly" ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${interval === "yearly" ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>

        <span className={`text-sm font-medium ${interval === "yearly" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
          Annuel
        </span>

        {interval === "yearly" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          >
            -20%
          </motion.span>
        )}
      </div>

      {/* Grille des 3 plans — items-stretch pour hauteur uniforme */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-5 xl:gap-8 items-stretch">

        {/* ── FREE ── */}
        {/* pt-6 réserve l'espace pour le badge au-dessus de la card */}
        <div className="relative pt-4 flex flex-col">
          {isFree && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Plan actuel
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className={`flex-1 rounded-2xl border-2 overflow-hidden shadow-sm transition-all flex flex-col ${
              isFree
                ? "border-emerald-400 dark:border-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/20"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 space-y-5 flex flex-col flex-1">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 mb-2">
                  <Star className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Gratuit</h3>
                <p className="text-xs text-slate-500">Découverte · Essai inclus</p>
                <div className="pt-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">0€</span>
                  <span className="text-slate-500 text-sm ml-1">/ mois</span>
                </div>
                <p className="text-xs text-slate-500">7 jours d&apos;essai Pro inclus</p>
              </div>

              {/* Features */}
              <div className="space-y-2 flex-1">
                {PLAN_FEATURES.FREE.map((f) => <FeatureRow key={f.label} {...f} />)}
              </div>

              {/* CTA — toujours en bas grâce à mt-auto */}
              <Button variant="outline" className="w-full mt-auto cursor-not-allowed dark:text-slate-200" disabled>
                {isFree ? "Plan actuel" : "Non disponible"}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* ── PRO ── */}
        <div className="relative pt-4 flex flex-col">
          {!isPro && (
            <div className="absolute top-[-2] left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
              <div className="bg-primary text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Le plus populaire
              </div>
            </div>
          )}
          {isPro && (
            <div className="absolute top-[-2] left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Plan actuel
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`flex-1 rounded-2xl border-2 overflow-hidden shadow-lg transition-all flex flex-col lg:scale-[1.03] ${
              isPro
                ? "border-emerald-400 dark:border-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/20"
                : "border-primary/50 dark:border-primary/70 ring-2 ring-primary/20 dark:ring-primary/30"
            }`}
          >
            <div className="bg-linear-to-br from-primary/10 via-violet-50 to-primary/5 dark:from-primary/20 dark:via-[#1e1845] dark:to-primary/10 p-6 space-y-5 flex flex-col flex-1">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/20 dark:bg-primary/30 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pro</h3>
                <p className="text-xs text-slate-500">Freelances · Auto-entrepreneurs · PME</p>
                <div className="pt-2">
                  <span className="text-3xl font-bold text-gradient">{proPrice}</span>
                  <span className="text-slate-500 text-sm ml-1">/ mois</span>
                </div>
                {proAnnualNote && (
                  <p className="text-xs text-slate-400">{proAnnualNote}</p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2 flex-1">
                {PLAN_FEATURES.PRO.map((f) => <FeatureRow key={f.label} {...f} />)}
              </div>

              {/* CTA */}
              {isPro ? (
                <Button variant="outline" className="w-full mt-auto cursor-not-allowed" disabled>
                  Plan actuel
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  className="w-full gap-2 mt-auto cursor-pointer"
                  disabled={loadingPlan === "PRO"}
                  onClick={() => handleCheckout("PRO")}
                >
                  {loadingPlan === "PRO" ? "Redirection..." : "Choisir ce plan"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── BUSINESS ── */}
        <div className="relative pt-4 flex flex-col">
          {isBusiness && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Plan actuel
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex-1 rounded-2xl border-2 overflow-hidden shadow-sm transition-all flex flex-col ${
              isBusiness
                ? "border-emerald-400 dark:border-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/20"
                : "border-amber-300 dark:border-amber-700"
            }`}
          >
            <div className="bg-linear-to-br from-amber-50 via-white to-blue-50 dark:from-amber-950/20 dark:via-slate-900 dark:to-blue-950/20 p-6 space-y-5 flex flex-col flex-1">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 mb-2">
                  <Building className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Business</h3>
                <p className="text-xs text-slate-500">Entreprises B2B · Équipes</p>
                <div className="pt-2">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{businessPrice}</span>
                  <span className="text-slate-500 text-sm ml-1">/ mois</span>
                </div>
                {businessAnnualNote && (
                  <p className="text-xs text-slate-400">{businessAnnualNote}</p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2 flex-1">
                {PLAN_FEATURES.BUSINESS.map((f) => <FeatureRow key={f.label} {...f} />)}
              </div>

              {/* CTA */}
              {isBusiness ? (
                <Button variant="outline" className="w-full mt-auto cursor-not-allowed" disabled>
                  Plan actuel
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mt-auto cursor-pointer border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  disabled={loadingPlan === "BUSINESS"}
                  onClick={() => handleCheckout("BUSINESS")}
                >
                  {loadingPlan === "BUSINESS" ? "Redirection..." : "Choisir ce plan"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Boutons gestion abonnement actif */}
      {stripeSubId && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={async () => {
              const { getStripePortalUrl } = await import("@/lib/actions/subscription");
              const result = await getStripePortalUrl();
              if (result.success && result.data?.url) {
                window.location.href = result.data.url;
              } else {
                toast.error("Impossible d'ouvrir le portail de facturation.");
              }
            }}
          >
            Gérer la facturation Stripe
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={cancelling}
            onClick={handleCancel}
            className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            {cancelling ? "Annulation..." : "Annuler l'abonnement"}
          </Button>
        </div>
      )}

      {/* Note bas de page */}
      <div className="text-center space-y-1 pt-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paiement sécurisé Stripe · Sans engagement · Annulable à tout moment
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Tous les prix sont HT. TVA applicable selon votre localisation.
        </p>
      </div>
    </div>
  );
}
