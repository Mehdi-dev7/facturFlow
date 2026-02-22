"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getReceipts,
  createReceipt,
  deleteReceipt,
} from "@/lib/actions/receipts";
import type { SavedReceipt } from "@/lib/types/receipts";

// Re-export pour faciliter les imports
export type { SavedReceipt };

// ─── Hook : liste des reçus ──────────────────────────────────────────────────

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: async (): Promise<SavedReceipt[]> => {
      const result = await getReceipts();
      if (!result.success) throw new Error(result.error);
      return result.data as SavedReceipt[];
    },
    staleTime: 30_000,
  });
}

// ─── Hook : créer un reçu manuel ────────────────────────────────────────────

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReceipt,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["receipts"] });
        toast.success("Reçu créé !");
      } else {
        toast.error(result.error ?? "Erreur lors de la création");
      }
    },
    onError: () => toast.error("Erreur lors de la création du reçu"),
  });
}

// ─── Hook : supprimer un reçu ────────────────────────────────────────────────

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReceipt(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["receipts"] });
        toast.success("Reçu supprimé");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
