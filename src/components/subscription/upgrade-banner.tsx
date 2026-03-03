"use client";
// src/components/subscription/upgrade-banner.tsx
// Bannière intelligente et dismissible affichée selon l'état du plan.
// - Trial actif : rappel violet avec compte à rebours
// - FREE peu de docs : info discrète bleue
// - FREE proche limite : orange
// - FREE limite atteinte : rouge bloquant

import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, AlertTriangle, Ban } from "lucide-react";

const DISMISS_KEY = "upgrade_banner_dismissed_at";
// Délai de ré-affichage après fermeture : 24h
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

interface UpgradeBannerProps {
  plan: string;
  effectivePlan: string;
  trialDaysLeft?: number | null;
  documentsThisMonth: number;
}

type BannerVariant = "trial" | "info" | "warning" | "danger";

interface BannerConfig {
  variant: BannerVariant;
  message: string;
  cta: string;
  dismissible: boolean;
}

function getBannerConfig(
  plan: string,
  effectivePlan: string,
  trialDaysLeft: number | null | undefined,
  docs: number
): BannerConfig | null {
  // Plan payant actif → pas de bannière
  if (effectivePlan === "PRO" && plan === "PRO") return null;
  if (effectivePlan === "BUSINESS") return null;

  // Trial actif
  if (effectivePlan === "PRO" && plan === "FREE") {
    return {
      variant: "trial",
      message: `Vous profitez de l'essai Pro — Plus que ${trialDaysLeft ?? 0} jour${(trialDaysLeft ?? 0) > 1 ? "s" : ""}`,
      cta: "S'abonner",
      dismissible: true,
    };
  }

  // Plan FREE — selon le nb de documents
  if (docs >= 5) {
    return {
      variant: "danger",
      message: "Limite atteinte — Vous ne pouvez plus créer de documents ce mois-ci",
      cta: "Passer au Pro",
      dismissible: false, // Bloquant : pas de fermeture
    };
  }

  if (docs === 4) {
    return {
      variant: "warning",
      message: "Plus qu'1 document gratuit ce mois-ci",
      cta: "Passer au Pro",
      dismissible: true,
    };
  }

  // docs < 4 → info discrète
  return {
    variant: "info",
    message: `Plan Gratuit — ${docs}/5 documents ce mois`,
    cta: "Passer au Pro",
    dismissible: true,
  };
}

// Styles par variante
const VARIANT_STYLES: Record<BannerVariant, string> = {
  trial: "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-600 text-violet-800 dark:text-violet-200",
  info:  "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200",
  warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200",
  danger:  "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200",
};

const VARIANT_BUTTON_STYLES: Record<BannerVariant, string> = {
  trial:   "bg-violet-600 hover:bg-violet-700 text-white",
  info:    "bg-blue-600 hover:bg-blue-700 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  danger:  "bg-red-600 hover:bg-red-700 text-white",
};

const VARIANT_ICONS: Record<BannerVariant, React.ReactNode> = {
  trial:   <Sparkles className="h-4 w-4 shrink-0" />,
  info:    <Sparkles className="h-4 w-4 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
  danger:  <Ban className="h-4 w-4 shrink-0" />,
};

export function UpgradeBanner({ plan, effectivePlan, trialDaysLeft, documentsThisMonth }: UpgradeBannerProps) {
  // Initialisation lazy : lire localStorage directement lors du premier rendu client.
  // typeof window check empêche l'erreur SSR.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(DISMISS_KEY);
    return stored ? Date.now() - parseInt(stored, 10) < DISMISS_TTL_MS : false;
  });

  // Évite le flash SSR : on ne rend la bannière qu'après l'hydratation côté client.
  // On utilise setTimeout(0) pour différer le setState hors du corps de l'effet (pattern projet).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const config = getBannerConfig(plan, effectivePlan, trialDaysLeft, documentsThisMonth);

  // Pas de config → pas de bannière
  if (!config) return null;
  // Avant hydratation → éviter le flash
  if (!mounted) return null;
  // Dismissible et fermé
  if (config.dismissible && dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  const handleUpgrade = () => {
    window.location.href = "/dashboard/subscription";
  };

  return (
    <div
      role="banner"
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 border rounded-xl text-xs lg-text-sm mb-4 ${VARIANT_STYLES[config.variant]}`}
    >
      {/* Ligne 1 : icône + message + fermeture (mobile) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {VARIANT_ICONS[config.variant]}
        <span className="flex-1 font-medium">{config.message}</span>
        {/* Bouton fermeture aligné à droite sur mobile */}
        {config.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Ligne 2 mobile / inline desktop : CTA + fermeture */}
      <div className="flex items-center gap-2 sm:gap-2">
        <button
          onClick={handleUpgrade}
          className={`flex-1 sm:flex-none  flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${VARIANT_BUTTON_STYLES[config.variant]}`}
        >
          {config.cta}
          <ArrowRight className="h-3 w-3" />
        </button>
        {/* Bouton fermeture visible seulement sur desktop */}
        {config.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity hidden sm:block"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
