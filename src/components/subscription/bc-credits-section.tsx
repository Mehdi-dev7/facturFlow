"use client";
// src/components/subscription/bc-credits-section.tsx
// Section "Crédits d'extraction BC" sur la page Abonnement.
// Affiche le solde mensuel inclus + crédit acheté + boutons de recharge.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBcRechargeCheckout } from "@/lib/actions/subscription";
import { BC_PAGE_PACKS, type BcPackPages } from "@/lib/bc-packs";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BC_PAGES_INCLUDED = 150;
const WARNING_THRESHOLD = 20; // Alerte si moins de 20 pages restantes

interface Props {
  bcPagesUsedThisMonth: number;
  bcPagesCredit: number;
  rechargeDone?: boolean; // ?bc_recharge=success dans l'URL
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function BcCreditsSection({ bcPagesUsedThisMonth, bcPagesCredit, rechargeDone }: Props) {
  const router = useRouter();
  const [loadingPack, setLoadingPack] = useState<BcPackPages | null>(null);

  const pagesIncludedLeft = Math.max(0, BC_PAGES_INCLUDED - bcPagesUsedThisMonth);
  const totalLeft = pagesIncludedLeft + bcPagesCredit;
  const progressPercent = Math.min(100, (bcPagesUsedThisMonth / BC_PAGES_INCLUDED) * 100);
  const isWarning = totalLeft <= WARNING_THRESHOLD && totalLeft > 0;
  const isExhausted = totalLeft === 0;

  const handleRecharge = async (pages: BcPackPages) => {
    setLoadingPack(pages);
    try {
      const result = await createBcRechargeCheckout(pages);
      if (result.success && result.data?.url) {
        router.push(result.data.url);
      } else {
        toast.error(result.error ?? "Erreur lors de la création du paiement");
      }
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 shrink-0">
          <FileSearch className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            Extraction de bons de commande
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Import IA de BC externes — réservé au plan Business
          </p>
        </div>
      </div>

      {/* Bannière succès recharge */}
      {rechargeDone && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          <Zap className="h-4 w-4 shrink-0" />
          Pages créditées avec succès sur votre compte !
        </div>
      )}

      {/* Alerte quota épuisé ou faible */}
      {(isExhausted || isWarning) && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm border ${
          isExhausted
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-700/40 text-red-700 dark:text-red-300"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-300"
        }`}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {isExhausted
            ? "Quota épuisé — rechargez pour continuer d'importer des BC."
            : `Plus que ${totalLeft} pages disponibles ce mois — pensez à recharger.`
          }
        </div>
      )}

      {/* Solde inclus */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            Pages incluses ce mois
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {bcPagesUsedThisMonth} / {BC_PAGES_INCLUDED}
          </span>
        </div>
        {/* Barre de progression */}
        <div className="h-2 rounded-full bg-slate-100 dark:bg-violet-900/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100
                ? "bg-red-500"
                : progressPercent >= 80
                ? "bg-amber-500"
                : "bg-violet-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {pagesIncludedLeft > 0
            ? `${pagesIncludedLeft} pages incluses restantes — se réinitialise le 1er du mois`
            : "Quota mensuel épuisé"
          }
        </p>
      </div>

      {/* Crédit acheté */}
      {bcPagesCredit > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/30 px-3 py-2">
          <span className="text-sm text-violet-700 dark:text-violet-300">
            Crédit supplémentaire
          </span>
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            {bcPagesCredit} pages
          </span>
        </div>
      )}

      {/* Boutons recharge */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Recharger des pages
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BC_PAGE_PACKS.map((pack) => (
            <Button
              key={pack.pages}
              variant="outline"
              size="sm"
              disabled={loadingPack !== null}
              className="cursor-pointer flex flex-col h-auto py-3 border-violet-200 dark:border-violet-500/40 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-400 dark:text-slate-200"
              onClick={() => handleRecharge(pack.pages as BcPackPages)}
            >
              {loadingPack === pack.pages ? (
                <div className="h-4 w-4 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
              ) : (
                <>
                  <span className="font-bold text-violet-600 dark:text-violet-400">
                    {pack.price}€
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {pack.label}
                  </span>
                </>
              )}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          0,02€ / page · Crédit permanent, ne expire pas
        </p>
      </div>
    </div>
  );
}
