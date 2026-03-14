"use client";

// Hooks TanStack Query pour les bons de livraison
// Pattern identique à use-credit-notes.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getDeliveryNotes,
  deleteDeliveryNote,
} from "@/lib/actions/delivery-notes";
import type { SavedDeliveryNote } from "@/lib/types/delivery-notes";

// Re-export pour faciliter les imports dans les pages
export type { SavedDeliveryNote };

// ─── Hook : liste des bons de livraison ──────────────────────────────────────

export function useDeliveryNotes() {
  return useQuery({
    queryKey: ["delivery-notes"],
    queryFn: async (): Promise<SavedDeliveryNote[]> => {
      const result = await getDeliveryNotes();
      if (!result.success) throw new Error(result.error);
      return result.data as SavedDeliveryNote[];
    },
    staleTime: 30_000,
  });
}

// ─── Hook : supprimer un bon de livraison ────────────────────────────────────

export function useDeleteDeliveryNote() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteDeliveryNote(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
        router.refresh();
        toast.success("Bon de livraison supprimé");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    },
    onError: () => toast.error("Erreur lors de la suppression du bon de livraison"),
  });
}
