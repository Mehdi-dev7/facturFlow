"use client";

// src/app/admin/avis/reviews-admin-client.tsx
// Client component — liste des avis avec actions Approuver / Rejeter.

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveReview, rejectReview } from "@/lib/actions/reviews";
import {
  Star,
  Check,
  ThumbsDown,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  submittedAt: string | null;
  user: { name: string; email: string };
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return (
      <span className="rounded-full border bg-emerald-900/40 text-emerald-300 border-emerald-700/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        Approuvé
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="rounded-full border bg-red-900/30 text-red-400 border-red-700/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        Rejeté
      </span>
    );
  return (
    <span className="rounded-full border bg-amber-900/30 text-amber-300 border-amber-700/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      En attente
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReviewsAdminClient({
  reviews,
}: {
  reviews: AdminReview[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleApprove = useCallback(
    async (id: string) => {
      setLoadingId(id);
      const result = await approveReview(id);
      setLoadingId(null);
      if (result.success) {
        toast.success("Avis approuvé — il apparaît maintenant sur la landing page");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
    [router]
  );

  const handleReject = useCallback(
    async (id: string) => {
      setLoadingId(id);
      const result = await rejectReview(id);
      setLoadingId(null);
      if (result.success) {
        toast.success("Avis rejeté");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
    [router]
  );

  const pending = reviews.filter((r) => r.status === "PENDING");
  const others = reviews.filter((r) => r.status !== "PENDING");
  const sorted = [...pending, ...others];

  // ─ Empty state ──────────────────────────────────────────────────────────────

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-20 gap-3 text-slate-500">
        <MessageSquare className="h-8 w-8 opacity-30" />
        <p className="text-sm">Aucun avis soumis pour l&apos;instant</p>
      </div>
    );
  }

  // ─ List ─────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Compteurs */}
      <div className="flex items-center gap-4 border-b border-slate-800 px-5 py-3 text-xs text-slate-500">
        <span>{reviews.length} avis soumis</span>
        {pending.length > 0 && (
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            {pending.length} en attente
          </span>
        )}
        <span className="text-emerald-400">
          {reviews.filter((r) => r.status === "APPROVED").length} approuvé
          {reviews.filter((r) => r.status === "APPROVED").length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Lignes */}
      <div className="divide-y divide-slate-800">
        {sorted.map((review) => (
          <div
            key={review.id}
            className={`flex flex-wrap items-start gap-4 p-5 transition-colors ${
              review.status === "PENDING" ? "bg-amber-950/10" : ""
            }`}
          >
            {/* Info utilisateur + avis */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Avatar initiales */}
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-700 text-[11px] font-semibold text-white shrink-0">
                  {review.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-slate-100">
                  {review.user.name}
                </span>
                <span className="text-xs text-slate-500">{review.user.email}</span>
              </div>

              {/* Étoiles + statut */}
              <div className="flex items-center gap-2 flex-wrap">
                <StarRating rating={review.rating} />
                <StatusBadge status={review.status} />
                {review.submittedAt && (
                  <span className="text-[11px] text-slate-600">
                    {new Date(review.submittedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Commentaire */}
              {review.comment ? (
                <p className="text-sm text-slate-300 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-slate-600 italic">Sans commentaire</p>
              )}
            </div>

            {/* Actions — uniquement sur PENDING */}
            {review.status === "PENDING" && (
              <div className="flex items-center gap-2 shrink-0 pt-1">
                {loadingId === review.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApprove(review.id)}
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 text-xs h-8 px-3 cursor-pointer gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Valider
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(review.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-8 px-3 cursor-pointer gap-1.5"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      Rejeter
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
