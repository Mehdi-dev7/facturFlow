"use client"

// src/components/onboarding/onboarding-tutorial.tsx
// Guided tour en 3 modes selon l'état :
//
// [Welcome] activeStep === -1
//   → Modal centré + overlay. Présentation des 3 étapes. Bouton "Commencer".
//
// [Spotlight] activeStep >= 0, pas sur la page cible
//   → Overlay sombre + sidebar surélevée. Card positionnée à droite de la sidebar.
//   → Bouton "M'y emmener" pour naviguer directement. "Passer cette étape" pour skip.
//
// [Pill] activeStep >= 0, sur la page cible
//   → Pas d'overlay. Petite card compacte fixée bas-droite.
//   → L'user travaille librement. "Suivant →" ou "Passer" pour avancer.

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, CreditCard, Paintbrush, X, CheckCircle2,
  ArrowRight, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { markOnboardingComplete } from "@/lib/actions/onboarding"
import { useOnboardingStore } from "@/stores/use-onboarding-store"

// ─── Étapes (ordre : Entreprise → Apparence → Paiements) ──────────────────────

const STEPS = [
  {
    icon: Building2,
    title: "Mon entreprise",
    href: "/dashboard/company",
    description: "Renseignez le nom, SIRET, adresse et logo de votre entreprise. Ces infos apparaîtront sur tous vos documents.",
    pageMessage: "Renseignez vos informations puis sauvegardez. Cliquez sur « Suivant » quand c'est bon.",
    color: "text-violet-500",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    icon: Paintbrush,
    title: "Apparence",
    href: "/dashboard/appearance",
    description: "Couleur de marque, police et logo : vos factures refléteront votre identité visuelle.",
    pageMessage: "Personnalisez l'apparence de vos documents. Cliquez sur « Suivant » ou passez cette étape.",
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    href: "/dashboard/payments",
    description: "Connectez Stripe, PayPal ou GoCardless (SEPA) pour encaisser directement sur vos factures.",
    pageMessage: "Connectez au moins un moyen de paiement. Cliquez sur « Terminer » quand c'est fait.",
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
]

const TOTAL = STEPS.length

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialCompleted: boolean
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function OnboardingTutorial({ initialCompleted }: Props) {
  const { activeStep, setActiveStep } = useOnboardingStore()
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [mounted, setMounted] = useState(false)
  // xs = 400px — détermine si on peut positionner la card spotlight à droite de la sidebar
  const [isXs, setIsXs] = useState(false)
  // ref pour les contraintes de drag du pill (lg+)
  const dragConstraintsRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsXs(window.innerWidth >= 400)
    check()
    window.addEventListener("resize", check)

    if (initialCompleted) {
      // Onboarding terminé en DB → nettoyer le localStorage au cas où
      setActiveStep(null)
    } else if (activeStep === null) {
      // Pas encore démarré (localStorage vide) → lancer le welcome
      setActiveStep(-1)
    }
    // Si activeStep >= 0 : l'user était en cours (ex: parti créer son compte Stripe),
    // on garde le step persisté sans le réinitialiser.

    return () => window.removeEventListener("resize", check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted || activeStep === null) return null

  // ─ Données de l'étape courante (null pendant le welcome) ─────────────────────
  const step = activeStep >= 0 ? STEPS[activeStep] : null
  const StepIcon = step?.icon ?? null
  const isLastStep = activeStep === TOTAL - 1
  const isOnPage = step ? pathname.startsWith(step.href) : false

  // ─ Handlers ──────────────────────────────────────────────────────────────────

  /** Avance à l'étape suivante — pas de redirect auto, l'user navigue via "M'y emmener" */
  function handleNext() {
    if (isLastStep) {
      setShowFinal(true)
    } else {
      setActiveStep((activeStep ?? 0) + 1)
    }
  }

  /** Démarre le tour depuis l'écran de bienvenue */
  function handleStart() {
    setActiveStep(0)
    // Pas de redirect ici : on laisse le spotlight guider vers sidebar
  }

  /** Navigue directement vers la page cible (bouton "M'y emmener") */
  function handleNavigate() {
    if (step) router.push(step.href)
  }

  /** Abandonne l'onboarding */
  async function handleAbort() {
    setLoading(true)
    await markOnboardingComplete()
    setActiveStep(null)
  }

  /** Valide, ferme et redirige vers le dashboard */
  async function handleFinish() {
    setLoading(true)
    await markOnboardingComplete()
    setActiveStep(null)
    router.push("/dashboard")
  }

  // ─ Render ─────────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence mode="wait">

      {/* ══════════════════════════════════════════════════════════
          MODE FINAL — modal centré succès
      ══════════════════════════════════════════════════════════ */}
      {showFinal && (
        <OverlayWrapper key="final-overlay">
          <CenteredCard>
            {/* Header */}
            <GradientHeader>
              <span className="text-white font-semibold text-sm">Configuration terminée</span>
              <CloseButton onClick={handleAbort} loading={loading} />
            </GradientHeader>

            {/* Body */}
            <div className="px-4 xs:px-6 py-5 xs:py-8 flex flex-col items-center text-center gap-3 xs:gap-4">
              <div className="flex h-12 w-12 xs:h-16 xs:w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-6 w-6 xs:h-8 xs:w-8 text-emerald-500" />
              </div>
              <h2 className="text-base xs:text-lg font-bold text-slate-900 dark:text-slate-100">
                Vous êtes prêt !
              </h2>
              <p className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Tout est configuré. Créez votre première facture dès maintenant.
              </p>
            </div>

            {/* Footer */}
            <div className="px-4 xs:px-6 pb-4 xs:pb-6 flex justify-center">
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={loading}
                className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accéder au dashboard
              </Button>
            </div>
          </CenteredCard>
        </OverlayWrapper>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE WELCOME — modal centré (step -1)
      ══════════════════════════════════════════════════════════ */}
      {!showFinal && activeStep === -1 && (
        <OverlayWrapper key="welcome-overlay">
          <CenteredCard maxWidth="max-w-md">
            {/* Header */}
            <GradientHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/80" />
                <span className="text-white font-semibold text-sm">Premiers pas</span>
              </div>
              <CloseButton onClick={handleAbort} loading={loading} />
            </GradientHeader>

            {/* Body */}
            <div className="px-4 xs:px-6 py-4 xs:py-6 flex flex-col gap-3 xs:gap-5">
              <div>
                <h2 className="text-base xs:text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Bienvenue sur FacturNow !
                </h2>
                <p className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Configurez votre espace en 3 étapes rapides pour créer votre première facture.
                </p>
              </div>

              {/* Aperçu des 3 étapes */}
              <div className="flex flex-col gap-1.5 xs:gap-2">
                {STEPS.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={i} className="flex items-center gap-2 xs:gap-3 p-2 xs:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className={`flex h-7 w-7 xs:h-8 xs:w-8 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                        <Icon className={`h-3.5 w-3.5 xs:h-4 xs:w-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs xs:text-sm font-medium text-slate-800 dark:text-slate-200">{s.title}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{i + 1}/{TOTAL}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 xs:px-6 pb-4 xs:pb-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <button
                onClick={handleAbort}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-violet-500 transition-colors cursor-pointer"
              >
                Passer la configuration
              </button>
              <Button
                size="sm"
                onClick={handleStart}
                disabled={loading}
                className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-2"
              >
                Commencer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CenteredCard>
        </OverlayWrapper>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE SPOTLIGHT — card à droite de la sidebar (step ≥ 0, pas sur la page)
      ══════════════════════════════════════════════════════════ */}
      {!showFinal && activeStep >= 0 && !isOnPage && step && StepIcon && (
        <>
          {/* Overlay sombre */}
          <motion.div
            key="spotlight-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm pointer-events-none"
            aria-hidden
          />

          {/* Card spotlight
              < xs (< 400px) : centrée, inset-x-4, pas de flèche
              xs+             : positionnée à droite de la sidebar, flèche pointant vers elle */}
          <motion.div
            key={`spotlight-card-${activeStep}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed z-50 pointer-events-auto"
            style={
              isXs
                ? {
                    left: "clamp(1rem, calc(280px + 2rem), calc(100vw - 22rem))",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "20rem",
                  }
                : {
                    left: "1rem",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }
            }
            role="dialog"
            aria-modal="true"
            aria-label="Tutoriel de démarrage"
          >
            <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-2xl shadow-violet-500/20 overflow-hidden">

              {/* Header */}
              <GradientHeader>
                <StepProgress activeStep={activeStep} />
                <CloseButton onClick={handleAbort} loading={loading} />
              </GradientHeader>

              {/* Body */}
              <div className="px-4 xs:px-5 py-4 xs:py-5 flex flex-col gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${step.bg}`}>
                  <StepIcon className={`h-5 w-5 ${step.color}`} />
                </div>
                <h2 className="text-sm xs:text-base font-bold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h2>
                <p className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Footer */}
              <div className="px-4 xs:px-5 pb-4 xs:pb-5 flex items-center justify-between gap-2">
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-violet-500 transition-colors cursor-pointer shrink-0"
                >
                  Passer cette étape
                </button>
                <Button
                  size="sm"
                  onClick={handleNavigate}
                  disabled={loading}
                  className="bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-2 shrink-0"
                >
                  M'y emmener
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Flèche vers la sidebar — xs+ uniquement */}
              {isXs && (
                <div
                  className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pointer-events-none"
                  aria-hidden
                >
                  <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[10px] border-t-transparent border-b-transparent border-r-white dark:border-r-slate-900" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE PILL — sur la page cible (step ≥ 0, isOnPage)
          < lg  : slim banner fixée sous la topbar (pleine largeur, ne cache pas le bas)
          lg+   : pill draggable bas-droite
      ══════════════════════════════════════════════════════════ */}
      {!showFinal && activeStep >= 0 && isOnPage && step && StepIcon && (
        <>
          {/* ── BANNER mobile / tablette (< lg) ─────────────────────
              Positionnée juste sous la topbar (top-14 = 56px).
              Pleine largeur, ne cache aucun bouton en bas de page. */}
          <motion.div
            key={`banner-${activeStep}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="lg:hidden fixed top-14 left-0 right-0 z-40 pointer-events-auto"
            role="status"
            aria-label="Avancement onboarding"
          >
            <div className="bg-linear-to-r from-violet-600 to-indigo-600 px-3 xs:px-4 py-2 flex items-center gap-2 shadow-md shadow-violet-900/30">
              {/* Icon + titre */}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${step.bg}`}>
                <StepIcon className={`h-3 w-3 ${step.color}`} />
              </div>
              <span className="text-white text-xs font-medium truncate flex-1 min-w-0">
                {step.title}
                <span className="text-white/60 ml-1">· {activeStep + 1}/{TOTAL}</span>
              </span>
              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="text-white/60 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Passer
                </button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={loading}
                  className="relative h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer gap-1"
                >
                  <span className="absolute inset-0 rounded-md ring-2 ring-white/80 animate-pulse" aria-hidden />
                  {isLastStep ? "Terminer" : "Suivant"}
                  {!isLastStep && <ArrowRight className="h-3 w-3" />}
                </Button>
                <CloseButton onClick={handleAbort} loading={loading} />
              </div>
            </div>
          </motion.div>

          {/* ── PILL draggable desktop (lg+) ─────────────────────────
              Conteneur invisible plein écran = zone de drag.
              Le pill est positionné en bas-droite par défaut
              et peut être déplacé partout à l'écran. */}
          <div
            ref={dragConstraintsRef}
            className="hidden lg:block fixed inset-0 pointer-events-none z-50"
            aria-hidden
          >
            <motion.div
              key={`pill-${activeStep}`}
              drag
              dragConstraints={dragConstraintsRef}
              dragMomentum={false}
              dragElastic={0}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="absolute bottom-4 right-4 w-72 pointer-events-auto cursor-grab active:cursor-grabbing"
              role="dialog"
              aria-label="Avancement onboarding"
            >
              <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-xl shadow-violet-500/20 overflow-hidden select-none">

                {/* Header compact — zone de drag principale */}
                <div className="bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${step.bg}`}>
                      <StepIcon className={`h-3.5 w-3.5 ${step.color}`} />
                    </div>
                    <span className="text-white text-sm font-medium truncate">{step.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StepProgress activeStep={activeStep} compact />
                    <CloseButton onClick={handleAbort} loading={loading} />
                  </div>
                </div>

                {/* Message */}
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.pageMessage}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center justify-between gap-2">
                  <button
                    onClick={handleNext}
                    disabled={loading}
                    className="text-xs text-slate-400 hover:text-violet-500 transition-colors cursor-pointer shrink-0"
                  >
                    Passer cette étape
                  </button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={loading}
                    className="relative bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 cursor-pointer gap-1.5 shrink-0"
                  >
                    <span className="absolute inset-0 rounded-md ring-2 ring-violet-500/80 animate-pulse" aria-hidden />
                    {isLastStep ? "Terminer" : "Suivant"}
                    {!isLastStep && <ArrowRight className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

    </AnimatePresence>
  )
}

// ─── Sous-composants réutilisables ────────────────────────────────────────────

/** Overlay sombre centré pour les modals welcome / final */
function OverlayWrapper({ children, key: _key }: { children: React.ReactNode; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
    >
      {children}
    </motion.div>
  )
}

/** Card centrée (welcome / final) */
function CenteredCard({ children, maxWidth = "max-w-sm" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`w-full ${maxWidth} rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-2xl shadow-violet-500/30 overflow-hidden`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </motion.div>
  )
}

/** Header dégradé violet commun */
function GradientHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between gap-2">
      {children}
    </div>
  )
}

/** Bouton de fermeture × */
function CloseButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
      aria-label="Quitter le tutoriel"
    >
      <X className="h-4 w-4" />
    </button>
  )
}

/** Barre de progression des étapes */
function StepProgress({ activeStep, compact = false }: { activeStep: number; compact?: boolean }) {
  if (compact) {
    return (
      <span className="text-white/70 text-xs shrink-0">
        {activeStep + 1}/{TOTAL}
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeStep ? "w-6 bg-white" : i < activeStep ? "w-3 bg-white/70" : "w-3 bg-white/30"
            }`}
          />
        ))}
      </div>
      <span className="text-white/80 text-xs ml-1">
        Étape {activeStep + 1}/{TOTAL}
      </span>
    </div>
  )
}
