"use client";
// src/components/subscription/feature-gate.tsx
// Wrapper qui bloque visuellement les features non disponibles.
// Si l'user a la feature → children normaux.
// Sinon → overlay semi-transparent avec cadenas + badge plan requis + clic ouvre UpgradeModal.

import { useState } from "react";
import { Lock } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";
import { canUseFeature } from "@/lib/feature-gate";
import type { Feature } from "@/lib/feature-gate";

interface FeatureGateProps {
  feature: Feature;
  effectivePlan: string;
  plan: string;
  children: React.ReactNode;
  // Composant alternatif affiché à la place (si fourni, pas d'overlay, juste fallback)
  fallback?: React.ReactNode;
}

// Plan requis minimum par feature
const FEATURE_REQUIRED_PLAN: Partial<Record<Feature, "PRO" | "BUSINESS">> = {
  unlimited_documents: "PRO",
  unlimited_clients:   "PRO",
  custom_appearance:   "PRO",
  payment_stripe:      "PRO",
  payment_paypal:      "PRO",
  payment_gocardless:  "PRO",
  auto_reminders:      "PRO",
  recurring_invoices:  "PRO",
  statistics:          "PRO",
  business_templates:  "PRO",
  csv_export:          "PRO",
  einvoice_100:        "PRO",
  einvoice_unlimited:  "BUSINESS",
  fec_export:          "BUSINESS",
  monthly_accounting_report: "BUSINESS",
  annual_report:       "BUSINESS",
  legal_archiving:     "BUSINESS",
  api_webhooks:        "BUSINESS",
  priority_support:    "BUSINESS",
  multi_users:         "BUSINESS",
};

export function FeatureGate({
  feature,
  effectivePlan,
  plan,
  children,
  fallback,
}: FeatureGateProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Construire un pseudo-user pour canUseFeature
  const hasAccess = canUseFeature(
    { plan: effectivePlan, trialEndsAt: null },
    feature
  );

  // L'user a accès → on rend directement les enfants
  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback explicite fourni → l'afficher à la place
  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredPlan = FEATURE_REQUIRED_PLAN[feature] ?? "PRO";
  const badgeLabel = requiredPlan === "BUSINESS" ? "Business" : "Pro";
  const badgeClass = requiredPlan === "BUSINESS"
    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600"
    : "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600";

  return (
    <>
      {/* Overlay + children */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Fonctionnalité ${badgeLabel} — cliquez pour en savoir plus`}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setModalOpen(true); }}
        className="relative cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        {/* Children avec flou */}
        <div className="pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay semi-transparent */}
        <div className="absolute inset-0 rounded-xl bg-white/60 dark:bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 transition-opacity group-hover:bg-white/50 dark:group-hover:bg-slate-900/60">
          {/* Icône cadenas */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md">
            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>

          {/* Badge plan requis */}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
            {badgeLabel}
          </span>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cliquez pour en savoir plus
          </p>
        </div>
      </div>

      {/* Modale upgrade */}
      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        feature={feature}
        plan={plan}
      />
    </>
  );
}
