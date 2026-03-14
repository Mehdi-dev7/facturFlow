"use client";

// Hooks TanStack Query pour les avoirs
// Pattern identique à use-receipts.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getCreditNotes,
  deleteCreditNote,
} from "@/lib/actions/credit-notes";
import type { SavedCreditNote } from "@/lib/types/credit-notes";

// Re-export pour faciliter les imports dans les pages
export type { SavedCreditNote };

// ─── Hook : liste des avoirs ─────────────────────────────────────────────────

export function useCreditNotes() {
  return useQuery({
    queryKey: ["credit-notes"],
    queryFn: async (): Promise<SavedCreditNote[]> => {
      const result = await getCreditNotes();
      if (!result.success) throw new Error(result.error);
      return result.data as SavedCreditNote[];
    },
    staleTime: 30_000,
  });
}

// ─── Hook : supprimer un avoir ───────────────────────────────────────────────

export function useDeleteCreditNote() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteCreditNote(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
        router.refresh();
        toast.success("Avoir supprimé");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    },
    onError: () => toast.error("Erreur lors de la suppression de l'avoir"),
  });
}
