"use client"

// src/components/landing/reviews-carousel.tsx
// Carousel infini horizontal d'avis clients approuvés.
// Utilise une animation CSS keyframe pour le défilement automatique.
// Duplique le tableau d'avis pour créer l'effet de boucle continue.

import { Star } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  displayName: string
  submittedAt: string
}

interface ReviewsCarouselProps {
  reviews: ReviewItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Génère une couleur d'avatar déterministe selon le nom */
function getAvatarColor(name: string): string {
  const colors = [
    "bg-violet-500",
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-sky-500",
    "bg-teal-500",
    "bg-fuchsia-500",
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

/** Extrait les initiales (max 2 lettres) */
function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// ─── Carte d'avis ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewItem }) {
  const initials = getInitials(review.displayName)
  const avatarColor = getAvatarColor(review.displayName)

  return (
    <div className="flex-shrink-0 w-72 rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 p-5 mx-3 flex flex-col gap-3">
      {/* Étoiles */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${
              s <= review.rating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Commentaire */}
      {review.comment && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      {/* Auteur */}
      <div className="flex items-center gap-2.5 mt-auto pt-2 border-t border-slate-100">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ${avatarColor}`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{review.displayName}</p>
          <p className="text-xs text-slate-400">Client FacturNow</p>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  // Duplique les avis pour créer le scroll infini (deux passes)
  const doubled = [...reviews, ...reviews]

  if (reviews.length === 0) return null

  return (
    <section className="py-20 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
        <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">
          Témoignages
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Ce que disent nos utilisateurs
        </h2>
        <p className="mt-4 text-slate-500 max-w-xl mx-auto text-base">
          Des freelances et entrepreneurs qui font confiance à FacturNow au quotidien.
        </p>
      </div>

      {/* Masques de fondu sur les bords */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-linear-to-r from-slate-50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-linear-to-l from-slate-50 to-transparent pointer-events-none" />

        {/* Track animé — pause au survol */}
        <div
          className="flex"
          style={{
            animation: "reviews-scroll 35s linear infinite",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused"
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "running"
          }}
        >
          {doubled.map((review, i) => (
            <ReviewCard key={`${review.id}-${i}`} review={review} />
          ))}
        </div>
      </div>

      {/* Keyframe CSS inline — translateX de 0 à -50% (une passe) */}
      <style>{`
        @keyframes reviews-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
