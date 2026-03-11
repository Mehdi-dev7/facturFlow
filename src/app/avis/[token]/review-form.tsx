"use client"

// src/app/avis/[token]/review-form.tsx
// Formulaire client de soumission d'avis (étoiles + commentaire optionnel).

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Send, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitReview } from "@/lib/actions/reviews"

interface ReviewFormProps {
  token: string
}

export function ReviewForm({ token }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─ Labels selon la note ───────────────────────────────────────────────────

  const ratingLabels: Record<number, string> = {
    1: "Décevant",
    2: "Passable",
    3: "Bien",
    4: "Très bien",
    5: "Excellent !",
  }

  // ─ Soumission ────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (rating === 0) {
      setError("Veuillez sélectionner une note.")
      return
    }
    setLoading(true)
    setError(null)

    const result = await submitReview(token, rating, comment || undefined)

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error ?? "Une erreur est survenue.")
    }
    setLoading(false)
  }

  // ─ Confirmation ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 text-center py-8"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Merci pour votre avis !</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xs">
            Votre témoignage nous aide à améliorer FacturNow et à aider d&apos;autres entrepreneurs à se lancer.
          </p>
        </div>
      </motion.div>
    )
  }

  const displayRating = hovered || rating

  return (
    <div className="flex flex-col gap-6">
      {/* Étoiles interactives */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-9 w-9 transition-colors duration-150 ${
                  star <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Label de la note */}
        <AnimatePresence mode="wait">
          {displayRating > 0 && (
            <motion.span
              key={displayRating}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm font-medium text-slate-700"
            >
              {ratingLabels[displayRating]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Commentaire optionnel */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          Votre commentaire <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Qu'est-ce que vous aimez particulièrement ? Qu'est-ce qu'on pourrait améliorer ?"
          className="resize-none min-h-24 text-sm"
          maxLength={1000}
        />
        <span className="text-xs text-slate-400 text-right">{comment.length}/1000</span>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Bouton */}
      <Button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity cursor-pointer gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {loading ? "Envoi en cours..." : "Envoyer mon avis"}
      </Button>
    </div>
  )
}
