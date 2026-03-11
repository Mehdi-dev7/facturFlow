// src/app/avis/[token]/page.tsx
// Page publique de soumission d'avis — accessible sans authentification.
// Récupère le Review par token et affiche soit le formulaire, soit une confirmation.

import { prisma } from "@/lib/prisma"
import { ReviewForm } from "./review-form"
import { Star, XCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Votre avis — FacturNow",
  description: "Partagez votre expérience avec FacturNow",
  robots: "noindex", // ne pas indexer les pages d'avis individuelles
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function AvisPage({ params }: Props) {
  const { token } = await params

  // Récupérer le Review associé au token
  const review = await prisma.review.findUnique({
    where: { token },
    select: { submittedAt: true, rating: true },
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Marque */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            FacturNow
          </span>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-violet-500/10 p-6 sm:p-8">

          {/* Token invalide */}
          {!review && (
            <div className="flex flex-col items-center gap-4 text-center py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Lien invalide</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Ce lien de demande d&apos;avis est invalide ou a expiré.
                </p>
              </div>
            </div>
          )}

          {/* Avis déjà soumis */}
          {review?.submittedAt && (
            <div className="flex flex-col items-center gap-4 text-center py-6">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-7 w-7 ${
                      star <= review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Merci pour votre avis !</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Vous avez déjà partagé votre expérience. Nous apprécions votre retour.
                </p>
              </div>
            </div>
          )}

          {/* Formulaire — avis non encore soumis */}
          {review && !review.submittedAt && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Votre expérience avec FacturNow</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Notez votre expérience et laissez un commentaire si vous le souhaitez. Merci !
                </p>
              </div>
              <ReviewForm token={token} />
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Email envoyé via FacturNow · Votre avis reste confidentiel jusqu&apos;à validation
        </p>
      </div>
    </div>
  )
}
