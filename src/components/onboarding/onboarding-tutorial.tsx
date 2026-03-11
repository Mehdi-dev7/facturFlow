"use client"

// src/components/onboarding/onboarding-tutorial.tsx
// Guided tour avec spotlight — 3 étapes interactives.
//
// COMPORTEMENT :
// — Mode "spotlight" (pas encore sur la page cible) :
//     overlay sombre + sidebar surélevée z-50 + lien ciblé mis en évidence,
//     tous les autres liens sidebar sont atténués (opacity-25 + pointer-events-none).
//     Bouton "Faire plus tard" → passe à l'étape suivante sans visiter.
// — Mode "page" (user a cliqué le lien et est sur la page) :
//     overlay disparaît, sidebar normale, carte montre "Vous y êtes !"
//     + bouton "Étape suivante" ou "Terminer".

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, CreditCard, Paintbrush, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markOnboardingComplete } from "@/lib/actions/onboarding"
import { useOnboardingStore } from "@/stores/use-onboarding-store"

// ─── Définition des étapes ────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Building2,
    title: "Mon entreprise",
    href: "/dashboard/company",
    // Message en mode spotlight (pas encore sur la page)
    description: "Commencez par renseigner les informations de votre entreprise — nom, SIRET, adresse, logo. Ces données apparaîtront sur tous vos documents.",
    // Message quand l'user est sur la page
    pageMessage: "Parfait ! Renseignez vos informations, puis cliquez sur « Étape suivante » quand c'est fait.",
    color: "text-violet-500",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    href: "/dashboard/payments",
    description: "Connectez Stripe, PayPal ou GoCardless (SEPA) pour encaisser directement sur vos factures — zéro intermédiaire.",
    pageMessage: "Connectez au moins un moyen de paiement, puis cliquez sur « Étape suivante ».",
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    icon: Paintbrush,
    title: "Apparence",
    href: "/dashboard/appearance",
    description: "Personnalisez couleur de marque, police et logo. Vos factures refléteront votre identité visuelle.",
    pageMessage: "Personnalisez l'apparence de vos documents, puis cliquez sur « Terminer ».",
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** true si l'onboarding a déjà été terminé côté serveur */
  initialCompleted: boolean
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function OnboardingTutorial({ initialCompleted }: Props) {
  const { activeStep, setActiveStep } = useOnboardingStore()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Init côté client uniquement (évite le mismatch SSR)
  useEffect(() => {
    setMounted(true)
    if (!initialCompleted) {
      setActiveStep(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ne rien rendre si pas monté, déjà terminé ou aucun step actif
  if (!mounted || activeStep === null) return null

  const step = STEPS[activeStep]
  const isLastStep = activeStep === STEPS.length - 1
  const StepIcon = step.icon

  // L'user est actuellement sur la page cible → mode "page" (pas de spotlight)
  const isOnPage = pathname.startsWith(step.href)

  // ─ Handlers ─────────────────────────────────────────────────────────────────

  // Passe à l'étape suivante (depuis le bouton de la carte — mode page ou skip)
  function handleNext() {
    if (isLastStep) {
      setShowFinal(true)
    } else {
      setActiveStep((activeStep ?? 0) + 1)
    }
  }

  // Quitter définitivement le tutoriel (croix en haut)
  async function handleAbort() {
    setLoading(true)
    await markOnboardingComplete()
    setActiveStep(null)
  }

  // Terminer après le message final
  async function handleFinish() {
    setLoading(true)
    await markOnboardingComplete()
    setActiveStep(null)
  }

  // ─ Render ───────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {/* ─ Overlay sombre — visible uniquement en mode spotlight (pas sur la page cible) ─ */}
      {!isOnPage && !showFinal && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // pointer-events-none : l'overlay ne bloque pas les clics
          // (c'est le dimming des NavLinks qui bloque les clics non-autorisés)
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm pointer-events-none"
          aria-hidden
        />
      )}

      {/* ─ Carte de tutoriel ─────────────────────────────────────────────────── */}
      <motion.div
        key={`card-${activeStep}-${String(isOnPage)}-${String(showFinal)}`}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed z-50 pointer-events-auto"
        style={{
          // Positionner la carte à droite de la sidebar (~280px)
          left: "clamp(1rem, calc(280px + 2rem), calc(100vw - 24rem))",
          top: "50%",
          transform: "translateY(-50%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Tutoriel de démarrage"
      >
        <div className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-2xl shadow-violet-500/20 overflow-hidden">

          {/* Header gradient */}
          <div className="bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Barre de progression */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      showFinal
                        ? "w-6 bg-white"
                        : i === activeStep
                        ? "w-6 bg-white"
                        : i < activeStep
                        ? "w-3 bg-white/70"
                        : "w-3 bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-xs ml-1">
                {showFinal ? "Terminé !" : `Étape ${activeStep + 1} / ${STEPS.length}`}
              </span>
            </div>

            {/* Bouton quitter le tutoriel */}
            <button
              onClick={handleAbort}
              disabled={loading}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Quitter le tutoriel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Corps de la carte */}
          <div className="px-5 py-5">
            <AnimatePresence mode="wait">
              {showFinal ? (
                // ─ Message final ─────────────────────────────────────────────
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
                    Tout est prêt ! Vous pouvez dès à présent créer vos premières factures.
                  </p>
                </motion.div>

              ) : isOnPage ? (
                // ─ Mode page (user est sur la page cible) ────────────────────
                <motion.div
                  key={`on-page-${activeStep}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col gap-3"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                    <StepIcon className={`h-6 w-6 ${step.color}`} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Vous y êtes !
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.pageMessage}
                  </p>
                </motion.div>

              ) : (
                // ─ Mode spotlight (pas encore sur la page) ───────────────────
                <motion.div
                  key={`spotlight-${activeStep}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col gap-3"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                    <StepIcon className={`h-6 w-6 ${step.color}`} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                  {/* Indication visuelle : pointer vers la sidebar */}
                  <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
                    Cliquez sur{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {step.title}
                    </strong>{" "}
                    dans la sidebar
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer — actions */}
          <div className="px-5 pb-5 flex items-center justify-between gap-3">
            {showFinal ? (
              <>
                <span />
                <Button
                  size="sm"
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Terminer
                </Button>
              </>
            ) : (
              <>
                {/* "Faire plus tard" en mode spotlight, "Passer" en mode page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={loading}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                >
                  {isOnPage ? "Passer" : "Faire plus tard"}
                </Button>

                {/* Bouton principal — visible uniquement en mode page */}
                {isOnPage && (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-1.5"
                  >
                    {isLastStep ? "Terminer" : "Étape suivante"}
                    <span aria-hidden>→</span>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Flèche pointant vers la sidebar — uniquement en mode spotlight */}
          {!isOnPage && !showFinal && (
            <div
              className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pointer-events-none"
              aria-hidden
            >
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[10px] border-t-transparent border-b-transparent border-r-white dark:border-r-slate-900" />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
