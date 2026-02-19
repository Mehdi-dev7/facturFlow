"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDeposits,
  getDeposit,
  createDeposit,
  saveDraftDeposit,
  updateDeposit,
  updateDepositStatus,
  deleteDeposit,
} from "@/lib/actions/deposits";
import type { SavedDeposit } from "@/lib/types/deposits";

// Type aligné sur le server action (date et description optionnels pour la modale rapide)
export interface DepositFormData {
  clientId: string;
  amount: number;
  vatRate: 0 | 5.5 | 10 | 20;
  date?: string;
  dueDate: string;
  description?: string;
  relatedQuoteId?: string;
  notes?: string;
}

// Re-export pour faciliter l'import depuis d'autres fichiers
export type { SavedDeposit };

// ─── Hook : liste des acomptes ─────────────────────────────────────────────

/**
 * Récupère tous les acomptes, avec un filtre optionnel par mois ("YYYY-MM").
 */
export function useDeposits(filters?: { month?: string }) {
  return useQuery({
    queryKey: ["deposits", filters ?? {}],
    queryFn: async (): Promise<SavedDeposit[]> => {
      const result = await getDeposits(filters);
      if (!result.success) throw new Error(result.error);
      return result.data as SavedDeposit[];
    },
    staleTime: 30_000,
  });
}

// ─── Hook : créer un acompte ────────────────────────────────────────────────

/**
 * Mutation pour créer un nouvel acompte.
 */
export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, draftId }: { data: DepositFormData; draftId?: string }) => 
      createDeposit(data, draftId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["deposits"] });
        toast.success("Acompte créé !");
      } else {
        toast.error(result.error ?? "Erreur lors de la création");
      }
    },
    onError: () => toast.error("Erreur lors de la création de l'acompte"),
  });
}

// ─── Hook : changer le statut d'un acompte ──────────────────────────────────

/**
 * Mutation pour changer le statut d'un acompte (transitions validées côté serveur).
 */
export function useUpdateDepositStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateDepositStatus(id, status),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["deposits"] });
      } else {
        toast.error(result.error ?? "Erreur lors du changement de statut");
      }
    },
    onError: () => toast.error("Erreur lors du changement de statut"),
  });
}

// ─── Hook : sauvegarder un brouillon d'acompte ──────────────────────────────

/**
 * Mutation pour sauvegarder un brouillon d'acompte (auto-save).
 */
export function useSaveDraftDeposit() {
  return useMutation({
    mutationFn: ({ data, draftId }: { data: DepositFormData; draftId?: string }) => 
      saveDraftDeposit(data, draftId),
    // Pas de toast pour l'auto-save (silencieux)
  });
}

// ─── Hook : mettre à jour un acompte ────────────────────────────────────────

/**
 * Mutation pour mettre à jour un acompte.
 */
export function useUpdateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & DepositFormData) =>
      updateDeposit(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["deposits"] });
        toast.success("Acompte mis à jour !");
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
      }
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

// ─── Hook : supprimer un acompte ────────────────────────────────────────────

/**
 * Mutation pour supprimer un acompte.
 */
export function useDeleteDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDeposit(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["deposits"] });
        toast.success("Acompte supprimé");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
