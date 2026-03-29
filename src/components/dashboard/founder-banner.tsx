"use client";
// src/components/dashboard/founder-banner.tsx
// Bannière offre Fondateur dans le dashboard — visible uniquement pour les utilisateurs FREE/trial.
// Déclenche directement le checkout Stripe avec le code promo FONDATEUR.

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createStripeCheckoutSession } from "@/lib/actions/subscription";

interface FounderBannerDashboardProps {
  effectivePlan: string;
}

export function FounderBannerDashboard({ effectivePlan }: FounderBannerDashboardProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Récupérer les places restantes au montage
  useEffect(() => {
    fetch("/api/founder-spots")
      .then((r) => r.json())
      .then((d: { remaining: number }) => setRemaining(d.remaining))
      .catch(() => setRemaining(50));
  }, []);

  // Ne pas afficher si déjà sur un plan payant ou s'il n'y a plus de places
  if (effectivePlan !== "FREE" || remaining === 0) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const result = await createStripeCheckoutSession("PRO", "monthly", "FONDATEUR");
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error((result as { error?: string }).error ?? "Impossible de créer la session de paiement.");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-300 dark:border-amber-700/50 bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 p-4 shadow-sm shadow-amber-100/60 dark:shadow-amber-950/30">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">⭐</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
            Offre Fondateur —{" "}
            <span className="text-amber-600 dark:text-amber-400">Pro 6,99€/mois à vie</span>
            {" "}·{" "}
            <span className="text-amber-600 dark:text-amber-400">Business 17€/mois à vie</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {remaining !== null && remaining < 15
              ? `⚠️ Plus que ${remaining} place${remaining > 1 ? "s" : ""} !`
              : "Places limitées"}{" "}
            · Code{" "}
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">FONDATEUR</span>
          </p>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          {loading ? "Chargement..." : "En profiter"}
        </button>
      </div>
    </div>
  );
}
