// src/stores/use-upgrade-store.ts
// Store global pour déclencher l'UpgradeModal depuis n'importe quel hook ou action.

import { create } from "zustand";
import type { Feature } from "@/lib/feature-gate";

interface UpgradeStore {
  open: boolean;
  feature: Feature;
  openUpgradeModal: (feature?: Feature) => void;
  closeUpgradeModal: () => void;
}

export const useUpgradeStore = create<UpgradeStore>((set) => ({
  open: false,
  feature: "unlimited_documents",
  openUpgradeModal: (feature = "unlimited_documents") =>
    set({ open: true, feature }),
  closeUpgradeModal: () => set({ open: false }),
}));
