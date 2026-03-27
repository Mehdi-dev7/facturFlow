"use client";

// ─── SkeletonTable ────────────────────────────────────────────────────────────
// Skeleton réutilisable pour les pages dashboard avec header + cards KPI + tableau
// Variantes :
//   "table"  → header + 4 cards KPI + tableau (factures, devis, acomptes, etc.)
//   "cards"  → header + grille de cards (paiements, abonnement, etc.)
//   "form"   → header + blocs de champs formulaire (settings, compte, etc.)

interface SkeletonTableProps {
  variant?: "table" | "cards" | "form";
  /** Nombre de lignes dans le tableau (variant "table") */
  rows?: number;
  /** Nombre de cards KPI (variant "table" et "cards") */
  cardCount?: number;
}

// ─── Atom : bloc gris animé ───────────────────────────────────────────────────
function Pulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700/60 ${className}`}
    />
  );
}

// ─── Header page (titre + bouton CTA) ────────────────────────────────────────
function SkeletonHeader() {
  return (
    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-8">
      <div className="space-y-2">
        <Pulse className="h-7 w-40" />
        <Pulse className="h-4 w-56 opacity-60" />
      </div>
      <Pulse className="h-10 w-36 rounded-xl" />
    </div>
  );
}

// ─── Cards KPI ────────────────────────────────────────────────────────────────
function SkeletonKpiCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1438]/60 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-9 w-9 rounded-xl" />
          </div>
          <Pulse className="h-8 w-16" />
          <Pulse className="h-3 w-20 opacity-50" />
        </div>
      ))}
    </div>
  );
}

// ─── Barre recherche + sélecteur mois ────────────────────────────────────────
function SkeletonFilters() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Pulse className="h-10 flex-1 rounded-xl" />
      <Pulse className="h-10 w-36 rounded-xl" />
    </div>
  );
}

// ─── Tableau ──────────────────────────────────────────────────────────────────
function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] overflow-hidden mb-8">
      {/* En-tête colonnes */}
      <div className="flex gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-700/40">
        {[80, 120, 70, 70, 80, 90].map((w, i) => (
          <Pulse key={i} className={`h-3`} style={{ width: w }} />
        ))}
      </div>
      {/* Lignes */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 items-center px-5 py-4 border-b last:border-0 border-slate-50 dark:border-slate-700/20"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <Pulse className="h-4 w-20" />
          <Pulse className="h-4 w-28" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16 ml-auto" />
          <Pulse className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Cards génériques (variante "cards") ─────────────────────────────────────
function SkeletonCardGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1438]/60 p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Pulse className="h-10 w-10 rounded-xl" />
            <Pulse className="h-5 w-32" />
          </div>
          <Pulse className="h-3 w-full opacity-60" />
          <Pulse className="h-3 w-4/5 opacity-40" />
          <Pulse className="h-9 w-full rounded-xl mt-2" />
        </div>
      ))}
    </div>
  );
}

// ─── Formulaire (variante "form") ─────────────────────────────────────────────
function SkeletonForm() {
  return (
    <div className="space-y-6">
      {/* Section 1 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1438]/60 p-6 space-y-5">
        <Pulse className="h-5 w-40 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      {/* Section 2 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1438]/60 p-6 space-y-4">
        <Pulse className="h-5 w-32 mb-2" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      {/* Bouton submit */}
      <div className="flex justify-end">
        <Pulse className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function SkeletonTable({
  variant = "table",
  rows = 6,
  cardCount = 4,
}: SkeletonTableProps) {
  return (
    <div>
      <SkeletonHeader />

      {variant === "table" && (
        <>
          <SkeletonKpiCards count={cardCount} />
          <SkeletonFilters />
          <SkeletonRows rows={rows} />
        </>
      )}

      {variant === "cards" && (
        <SkeletonCardGrid count={cardCount} />
      )}

      {variant === "form" && (
        <SkeletonForm />
      )}
    </div>
  );
}
