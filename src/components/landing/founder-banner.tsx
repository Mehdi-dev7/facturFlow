// src/components/landing/founder-banner.tsx
// Bannière offre Fondateur — Server Component (fetch au rendu, revalidate 1h).
// Disparaît automatiquement quand les 50 places sont épuisées.

import Link from "next/link";

async function getFounderSpots(): Promise<{ remaining: number; total: number }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/founder-spots`, { next: { revalidate: 3600 } });
    if (!res.ok) return { remaining: 50, total: 50 };
    return res.json();
  } catch {
    return { remaining: 50, total: 50 };
  }
}

export async function FounderBannerLanding() {
  const { remaining, total } = await getFounderSpots();

  // Plus de places disponibles → on n'affiche rien
  if (remaining <= 0) return null;

  return (
    <div className="w-full px-4 sm:px-[8%] xl:px-[12%] py-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 dark:border-amber-700/50 p-5 sm:p-6 shadow-lg shadow-amber-100/60 dark:shadow-amber-950/30">
          {/* Décoration fond */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 dark:bg-amber-700/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
            {/* Icône */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 shrink-0">
              <span className="text-2xl">⭐</span>
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Offre de lancement
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200">
                  {remaining}/{total} places restantes
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg leading-tight">
                Fondateur — Pro à{" "}
                <span className="text-amber-600 dark:text-amber-400">6,99€/mois à vie</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Pour les {total} premiers · Au lieu de 9,99€/mois · 7 jours d&apos;essai inclus
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/signup?plan=pro&promo=FONDATEUR"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/40"
            >
              En profiter →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
