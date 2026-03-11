// src/stores/use-onboarding-store.ts
// Store Zustand pour le guided tour d'onboarding.
// Partagé entre OnboardingTutorial (overlay + carte) et DashboardShell (dimming sidebar).

import { create } from 'zustand'

interface OnboardingStore {
  /** Étape active : 0=Mon entreprise, 1=Paiements, 2=Apparence, null=terminé/fermé */
  activeStep: number | null
  setActiveStep: (step: number | null) => void
}

export const useOnboardingStore = create<OnboardingStore>()((set) => ({
  activeStep: null,
  setActiveStep: (step) => set({ activeStep: step }),
}))
