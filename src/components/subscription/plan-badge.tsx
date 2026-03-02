// src/components/subscription/plan-badge.tsx
// Badge compact affichant le plan actuel de l'utilisateur.
// Variantes : FREE (gris), TRIAL (violet animé), PRO (violet), BUSINESS (doré).

import { Crown, Sparkles, Star } from "lucide-react";

interface PlanBadgeProps {
  plan: string;
  effectivePlan: string;
  trialDaysLeft?: number | null;
}

export function PlanBadge({ plan, effectivePlan, trialDaysLeft }: PlanBadgeProps) {
  // Trial actif : plan DB = FREE mais effectivePlan = PRO
  const isTrial = plan === "FREE" && effectivePlan === "PRO";

  if (isTrial) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-600 animate-pulse">
        <Sparkles className="h-3 w-3 shrink-0" />
        Pro Trial
        {trialDaysLeft != null && trialDaysLeft > 0 && (
          <span className="ml-0.5">— J-{trialDaysLeft}</span>
        )}
      </span>
    );
  }

  if (effectivePlan === "BUSINESS") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600">
        <Crown className="h-3 w-3 shrink-0" />
        Business
      </span>
    );
  }

  if (effectivePlan === "PRO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-600">
        <Sparkles className="h-3 w-3 shrink-0" />
        Pro
      </span>
    );
  }

  // FREE
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      <Star className="h-3 w-3 shrink-0" />
      Gratuit
    </span>
  );
}
