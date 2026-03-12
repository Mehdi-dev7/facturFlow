"use client"

// src/components/landing/reviews-carousel.tsx
// Carousel infini d'avis — avis réels DB + avis fictifs pour remplir le track.

import { Star, Quote } from "lucide-react"

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

// ─── Avis fictifs (placeholder) ───────────────────────────────────────────────

const PLACEHOLDER_REVIEWS: ReviewItem[] = [
  { id: "p1", rating: 5, displayName: "Thomas Renard",   submittedAt: "", comment: "Fini les relances manuelles ! FacturNow envoie les rappels automatiquement, j'ai récupéré 3 factures impayées en une semaine." },
  { id: "p2", rating: 5, displayName: "Camille Dubois",  submittedAt: "", comment: "L'interface est vraiment propre et intuitive. En 10 minutes j'avais créé ma première facture et envoyé le lien de paiement Stripe." },
  { id: "p3", rating: 5, displayName: "Antoine Moreau",  submittedAt: "", comment: "Le prélèvement SEPA automatique a changé ma vie. Mes clients récurrents sont prélevés sans que j'aie à faire quoi que ce soit." },
  { id: "p4", rating: 4, displayName: "Sophie Laurent",  submittedAt: "", comment: "Très bon outil pour gérer mes devis et factures. Le suivi des statuts en temps réel est super pratique pour savoir où en sont mes paiements." },
  { id: "p5", rating: 5, displayName: "Nicolas Petit",   submittedAt: "", comment: "J'ai migré depuis un autre logiciel et franchement c'est le jour et la nuit. Tout est fluide, les PDF sont élégants et le support répond vite." },
  { id: "p6", rating: 5, displayName: "Léa Fontaine",    submittedAt: "", comment: "Parfait pour mon activité de consultante. Les templates métiers sont bien pensés et les exports comptables me font gagner un temps fou." },
  { id: "p7", rating: 4, displayName: "Marc Girard",     submittedAt: "", comment: "Très satisfait après 3 mois d'utilisation. L'outil couvre tous mes besoins : devis, factures, avoirs, relances. Rien ne manque." },
  { id: "p8", rating: 5, displayName: "Julie Bernard",   submittedAt: "", comment: "La fonctionnalité de factures récurrentes est excellente. Mes abonnés sont facturés automatiquement chaque mois, zéro intervention de ma part." },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "from-violet-500 to-purple-600",  light: "bg-violet-50",  text: "text-violet-600"  },
  { bg: "from-indigo-500 to-blue-600",    light: "bg-indigo-50",  text: "text-indigo-600"  },
  { bg: "from-emerald-500 to-teal-600",   light: "bg-emerald-50", text: "text-emerald-600" },
  { bg: "from-amber-500 to-orange-500",   light: "bg-amber-50",   text: "text-amber-600"   },
  { bg: "from-rose-500 to-pink-600",      light: "bg-rose-50",    text: "text-rose-600"    },
  { bg: "from-sky-500 to-cyan-600",       light: "bg-sky-50",     text: "text-sky-600"     },
  { bg: "from-fuchsia-500 to-violet-600", light: "bg-fuchsia-50", text: "text-fuchsia-600" },
  { bg: "from-teal-500 to-emerald-600",   light: "bg-teal-50",    text: "text-teal-600"    },
]

function getColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getFirstName(name: string): string {
  return name.trim().split(" ")[0]
}

// ─── Carte d'avis ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewItem }) {
  const color = getColor(review.displayName)

  return (
    <div className="flex-shrink-0 w-96 mx-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Bandeau coloré */}
      <div className={`h-1 w-full bg-linear-to-r ${color.bg}`} />

      <div className="p-6 flex flex-col gap-4">
        {/* Quote + étoiles */}
        <div className="flex items-start justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color.light}`}>
            <Quote className={`h-4 w-4 ${color.text}`} />
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3.5 w-3.5 ${
                  s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Commentaire */}
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1 min-h-[3.5rem]">
          &ldquo;{review.comment ?? "Très bonne expérience avec FacturNow !"}&rdquo;
        </p>

        {/* Auteur */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${color.bg} text-white text-xs font-bold shrink-0 shadow-sm`}>
            {getInitials(review.displayName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{getFirstName(review.displayName)}</p>
            <p className="text-xs text-slate-400">Utilisateur FacturNow</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  // Avis réels d'abord, puis placeholders pour compléter jusqu'à ~8 cartes
  const placeholdersNeeded = Math.max(0, 8 - reviews.length)
  const allReviews = [...reviews, ...PLACEHOLDER_REVIEWS.slice(0, placeholdersNeeded)]

  if (allReviews.length === 0) return null

  // Doubler pour la boucle infinie (invisible à l'utilisateur avec 8+ cartes)
  const doubled = [...allReviews, ...allReviews]

  return (
    <section className="relative bg-slate-50 py-20">

      {/* ── Titre ── */}
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%] text-center mb-14">
        
        <h2 className="text-3xl xs:text-4xl md:text-5xl mb-4">
          <span className="text-slate-900">Ce qu&apos;ils disent de </span>
          <span className="text-gradient">FacturNow</span>
        </h2>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Des freelances et entrepreneurs qui nous font confiance au quotidien.
        </p>
      </div>

      {/* ── Carousel ── */}
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%]">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Masques de fondu */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-linear-to-r from-slate-50 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-linear-to-l from-slate-50 to-transparent" />

          {/* Track animé — pause au survol */}
          <div
            className="flex w-max py-4"
            style={{ animation: "reviews-scroll 50s linear infinite" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = "running" }}
          >
            {doubled.map((review, i) => (
              <ReviewCard key={`${review.id}-${i}`} review={review} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes reviews-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
