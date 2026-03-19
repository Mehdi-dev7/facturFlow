"use client"

// src/components/onboarding/onboarding-tutorial.tsx
// Guided tour avec spotlight — 3 étapes interactives.
//
// DESKTOP : overlay sombre + sidebar surélevée z-50 + lien ciblé mis en évidence.
//           Tous les autres liens sidebar sont atténués (opacity-25 + pointer-events-none).
//           Bouton "Faire plus tard" → passe à l'étape suivante sans visiter.
//
// MOBILE  : pas d'overlay, pas de sidebar visible.
//           Carte positionnée en bas de l'écran (bottom sheet).
//           Bouton "Aller à [page]" navigue directement vers la page cible.
//           Mode "page" identique desktop : "Vous y êtes !" + "Étape suivante".

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, CreditCard, Paintbrush, X, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markOnboardingComplete } from "@/lib/actions/onboarding"
import { useOnboardingStore } from "@/stores/use-onboarding-store"

// ─── Définition des étapes ────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Building2,
    title: "Mon entreprise",
    href: "/dashboard/company",
    description: "Commencez par renseigner les informations de votre entreprise — nom, SIRET, adresse, logo. Ces données apparaîtront sur tous vos documents.",
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
  initialCompleted: boolean
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function OnboardingTutorial({ initialCompleted }: Props) {
  const { activeStep, setActiveStep } = useOnboardingStore()
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Détection mobile après hydratation (< 768px = md breakpoint)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    if (!initialCompleted) {
      setActiveStep(0)
    }

    // Mettre à jour isMobile si la fenêtre est redimensionnée
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted || activeStep === null) return null

  const step = STEPS[activeStep]
  const isLastStep = activeStep === STEPS.length - 1
  const StepIcon = step.icon
  const isOnPage = pathname.startsWith(step.href)

  // En mode spotlight : sur desktop on affiche l'overlay, sur mobile non
  const showOverlay = !isMobile && !isOnPage && !showFinal

  // ─ Handlers ──────────────────────────────────────────────────────────────────

  function handleNext() {
    if (isLastStep) {
      setShowFinal(true)
    } else {
      setActiveStep((activeStep ?? 0) + 1)
    }
  }

  // Sur mobile, naviguer directement vers la page cible
  function handleMobileNavigate() {
    router.push(step.href)
  }

  async function handleAbort() {
    setLoading(true)
    await markOnboardingComplete()
    setActiveStep(null)
  }

  async function handleFinish() {
    setLoading(true)
    await markOnboardingComplete()
    setActiveStep(null)
  }

  // ─ Position de la carte ───────────────────────────────────────────────────────
  // Desktop : à droite de la sidebar (~280px), centré verticalement
  // Mobile  : fixé en bas de l'écran, pleine largeur avec marges

  const cardPositionStyle = isMobile
    ? {} // géré par className sur mobile
    : {
        left: "clamp(1rem, calc(280px + 2rem), calc(100vw - 24rem))",
        top: "50%",
        transform: "translateY(-50%)",
      }

  const cardClassName = isMobile
    ? "fixed bottom-4 left-4 right-4 z-50 pointer-events-auto"
    : "fixed z-50 pointer-events-auto w-96 lg:w-112 "

  // ─ Render ─────────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {/* Overlay sombre — desktop uniquement, mode spotlight */}
      {showOverlay && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm pointer-events-none"
          aria-hidden
        />
      )}

      {/* Carte de tutoriel */}
      <motion.div
        key={`card-${activeStep}-${String(isOnPage)}-${String(showFinal)}`}
        initial={{ opacity: 0, y: isMobile ? 40 : 0, x: isMobile ? 0 : 30 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: isMobile ? 40 : 0, x: isMobile ? 0 : 30 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className={cardClassName}
        style={cardPositionStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Tutoriel de démarrage"
      >
        <div className="w-full rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-2xl shadow-violet-500/20 overflow-hidden">

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
          <div className="px-3 sm:px-5 py-5">
            <AnimatePresence mode="wait">
              {showFinal ? (
                // ─ Message final ───────────────────────────────────────────────
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
                // ─ Mode page (user est sur la page cible) ─────────────────────
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
                // ─ Mode spotlight ──────────────────────────────────────────────
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

                  {/* Indication visuelle : desktop → sidebar | mobile → bouton direct */}
                  {isMobile ? null : (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
                      Cliquez sur{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {step.title}
                      </strong>{" "}
                      dans la sidebar
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer — actions */}
          <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
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
                {/* Bouton secondaire — "Faire plus tard" (spotlight) ou "Passer" (page) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={loading}
                  className="text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:text-violet-300 dark:hover:bg-violet-950/40 cursor-pointer text-xs"
                >
                  {isOnPage ? "Passer" : "Faire plus tard"}
                </Button>

                {/* Bouton principal :
                    - Desktop + page cible   → "Étape suivante" / "Terminer"
                    - Mobile + pas sur page  → "Aller à [titre]" (navigation directe)
                    - Desktop + pas sur page → rien (l'user clique le lien en évidence) */}
                {isOnPage ? (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-1.5"
                  >
                    {isLastStep ? "Terminer" : "Étape suivante"}
                    <span aria-hidden>→</span>
                  </Button>
                ) : isMobile ? (
                  <Button
                    size="sm"
                    onClick={handleMobileNavigate}
                    className="w-full sm:w-auto bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-1.5"
                  >
                    Aller à {step.title}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {/* Flèche vers la sidebar — desktop uniquement, mode spotlight */}
          {!isOnPage && !showFinal && !isMobile && (
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
