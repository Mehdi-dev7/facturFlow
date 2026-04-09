// src/stores/use-onboarding-store.ts
// Store Zustand pour le guided tour d'onboarding.
// Persisté dans localStorage : survit aux rechargements de page et aux navigations
// hors de l'app (ex: créer un compte Stripe, revenir sur /dashboard/payments).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingStore {
  /**
   * Étape active :
   * -1 = écran de bienvenue
   *  0 = Mon entreprise
   *  1 = Apparence
   *  2 = Paiements
   * null = terminé / fermé
   */
  activeStep: number | null
  setActiveStep: (step: number | null) => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      activeStep: null,
      setActiveStep: (step) => set({ activeStep: step }),
    }),
    { name: 'onboarding-step' }
  )
)
