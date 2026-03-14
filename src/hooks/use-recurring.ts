"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  getRecurrings,
  createRecurring,
  toggleRecurring,
  deleteRecurring,
} from "@/lib/actions/recurring"
import type { SavedRecurring } from "@/lib/actions/recurring"
import type { RecurringFormData } from "@/lib/validations/recurring"

// Re-export pour faciliter l'import
export type { SavedRecurring }

// ─── Hook : liste des récurrences ───────────────────────────────────────────

/**
 * Récupère toutes les récurrences de l'utilisateur connecté.
 */
export function useRecurrings() {
  return useQuery({
    queryKey: ["recurrings"],
    queryFn: async () => {
      const result = await getRecurrings()
      if (!result.success) throw new Error(result.error)
      return result.data as SavedRecurring[]
    },
    staleTime: 30_000,
  })
}

// ─── Hook : créer une récurrence ────────────────────────────────────────────

/**
 * Mutation pour créer une nouvelle récurrence.
 */
export function useCreateRecurring() {
  const qc = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RecurringFormData) => createRecurring(data),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["recurrings"] })
        router.refresh()
        toast.success("Récurrence créée !")
      } else {
        toast.error(result.error ?? "Erreur lors de la création")
      }
    },
    onError: () => toast.error("Erreur inattendue"),
  })
}

// ─── Hook : pause / reprendre une récurrence ────────────────────────────────

/**
 * Mutation pour activer ou désactiver une récurrence (toggle).
 */
export function useToggleRecurring() {
  const qc = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) => toggleRecurring(id),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["recurrings"] })
        router.refresh()
        toast.success("Récurrence mise à jour")
      } else {
        toast.error(result.error ?? "Erreur")
      }
    },
    onError: () => toast.error("Erreur inattendue"),
  })
}

// ─── Hook : supprimer une récurrence ────────────────────────────────────────

/**
 * Mutation pour supprimer une récurrence.
 */
export function useDeleteRecurring() {
  const qc = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) => deleteRecurring(id),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["recurrings"] })
        router.refresh()
        toast.success("Récurrence supprimée")
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression")
      }
    },
    onError: () => toast.error("Erreur inattendue"),
  })
}
