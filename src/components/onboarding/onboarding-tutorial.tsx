"use client"

// src/components/onboarding/onboarding-tutorial.tsx
// Overlay de guidage en 3 étapes pour les nouveaux utilisateurs.
// S'affiche uniquement si onboardingCompletedAt est null.

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, CreditCard, Paintbrush, ArrowRight, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markOnboardingComplete } from "@/lib/actions/onboarding"

// ─── Définition des étapes ────────────────────────────────────────────────────

interface OnboardingStep {
  icon: typeof Building2
  title: string
  description: string
  href: string
  color: string // couleur de l'icône
}

const STEPS: OnboardingStep[] = [
  {
    icon: Building2,
    title: "Mon entreprise",
    description: "Commencez par renseigner les informations de votre entreprise — nom, SIRET, adresse, logo. Ces données apparaîtront sur tous vos documents.",
    href: "/dashboard/company",
    color: "text-violet-500",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    description: "Connectez vos moyens d'encaissement pour recevoir vos paiements directement — Stripe, PayPal ou prélèvement SEPA GoCardless.",
    href: "/dashboard/payments",
    color: "text-emerald-500",
  },
  {
    icon: Paintbrush,
    title: "Apparence",
    description: "Personnalisez vos documents à votre image — couleur, police, logo. Vos factures refléteront votre identité visuelle.",
    href: "/dashboard/appearance",
    color: "text-amber-500",
  },
]

const FINAL_MESSAGE = "Tout est prêt ! Vous pouvez dès à présent créer vos premières factures."

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingTutorialProps {
  /** true si l'onboarding a déjà été terminé (onboardingCompletedAt !== null) */
  initialCompleted: boolean
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function OnboardingTutorial({ initialCompleted }: OnboardingTutorialProps) {
  // Si déjà terminé, on ne monte jamais l'overlay
  const [visible, setVisible] = useState(!initialCompleted)
  // Index de l'étape courante (0, 1, 2) — null après le clic "Terminer"
  const [step, setStep] = useState(0)
  // Étape finale (message de fin avant "Terminer")
  const [showFinal, setShowFinal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Évite l'affichage côté serveur (SSR) — lazy init : typeof window n'existe pas en SSR
  const [mounted] = useState(() => typeof window !== "undefined")

  if (!mounted || !visible) return null

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  // ─ Avancer à l'étape suivante ─────────────────────────────────────────────

  function handleNext() {
    if (isLastStep) {
      // Afficher le message final avant "Terminer"
      setShowFinal(true)
    } else {
      setStep((prev) => prev + 1)
    }
  }

  // ─ Passer l'onboarding ────────────────────────────────────────────────────

  async function handleSkip() {
    setLoading(true)
    await markOnboardingComplete()
    setVisible(false)
  }

  // ─ Terminer et marquer en DB ──────────────────────────────────────────────

  async function handleFinish() {
    setLoading(true)
    await markOnboardingComplete()
    setVisible(false)
  }

  // ─ Render ─────────────────────────────────────────────────────────────────

  const StepIcon = currentStep.icon

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay sombre — pointer-events: none pour laisser la sidebar accessible */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm pointer-events-none"
            aria-hidden="true"
          />

          {/* Carte de tutoriel — positionnée au centre-droite (après la sidebar) */}
          <motion.div
            key="card"
            initial={{ opacity: 0, x: 40, y: "-50%" }}
            animate={{ opacity: 1, x: 0, y: "-50%" }}
            exit={{ opacity: 0, x: 40, y: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed z-50 pointer-events-auto"
            style={{ left: "clamp(1rem, calc(280px + 2rem), calc(100vw - 24rem))", top: "50%", transform: "translateY(-50%)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Tutoriel de démarrage"
          >
            <div className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-2xl shadow-violet-500/20 overflow-hidden">

              {/* Header avec gradient */}
              <div className="bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Numérotation des étapes */}
                  <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          showFinal
                            ? "w-6 bg-white"
                            : i === step
                            ? "w-6 bg-white"
                            : i < step
                            ? "w-3 bg-white/70"
                            : "w-3 bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/80 text-xs ml-1">
                    {showFinal ? "Terminé !" : `Étape ${step + 1} / ${STEPS.length}`}
                  </span>
                </div>
                {/* Bouton passer */}
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Passer le tutoriel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corps */}
              <div className="px-5 py-5">
                <AnimatePresence mode="wait">
                  {showFinal ? (
                    // ─ Message final ───────────────────────────────────────
                    <motion.div
                      key="final"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center text-center gap-3"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Configuration terminée !
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {FINAL_MESSAGE}
                      </p>
                    </motion.div>
                  ) : (
                    // ─ Étape courante ─────────────────────────────────────
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col gap-3"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${currentStep.color}`}>
                        <StepIcon className="h-6 w-6" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {currentStep.title}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {currentStep.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer — actions */}
              <div className="px-5 pb-5 flex items-center justify-between gap-3">
                {/* Passer */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  disabled={loading}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                >
                  Passer cette étape
                </Button>

                {/* Suivant / Terminer */}
                {showFinal ? (
                  <Button
                    size="sm"
                    onClick={handleFinish}
                    disabled={loading}
                    className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity cursor-pointer gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity cursor-pointer gap-1.5"
                  >
                    {isLastStep ? "Voir le résumé" : "Suivant"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Flèche pointant vers la sidebar (côté gauche) */}
              <div
                className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[10px] border-t-transparent border-b-transparent border-r-white dark:border-r-slate-900" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
