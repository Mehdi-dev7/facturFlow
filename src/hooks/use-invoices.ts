"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  duplicateInvoice,
  type SavedInvoice,
} from "@/lib/actions/invoices";

// Re-export pour faciliter l'import depuis d'autres fichiers
export type { SavedInvoice };

// ─── Hook : liste des factures ────────────────────────────────────────────────

/**
 * Récupère toutes les factures, avec un filtre optionnel par mois ("YYYY-MM").
 */
export function useInvoices(filters?: { month?: string }) {
  return useQuery({
    queryKey: ["invoices", filters ?? {}],
    queryFn: async (): Promise<SavedInvoice[]> => {
      const result = await getInvoices(filters);
      if (!result.success) throw new Error(result.error);
      return result.data as SavedInvoice[];
    },
    staleTime: 30_000, // 30 secondes
  });
}

// ─── Hook : une facture par ID ────────────────────────────────────────────────

/**
 * Récupère une facture par son ID. Ne fait rien si l'ID est null.
 */
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async (): Promise<SavedInvoice> => {
      const result = await getInvoice(id!);
      if (!result.success || !result.data) throw new Error(result.error ?? "Facture introuvable");
      return result.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Hook : créer une facture ─────────────────────────────────────────────────

/**
 * Mutation pour créer une nouvelle facture.
 * Redirige vers la page de prévisualisation après succès.
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      data,
      draftId,
    }: {
      data: Parameters<typeof createInvoice>[0];
      draftId?: string;
    }) => createInvoice(data, draftId),
    onSuccess: async (result) => {
      if (result.success && result.data) {
        // Invalider la liste ET la facture spécifique pour forcer le refresh
        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
        await queryClient.invalidateQueries({ queryKey: ["invoices", result.data.id] });
        toast.success("Facture créée !");
        // Petit délai pour s'assurer que les données sont rafraîchies
        setTimeout(() => {
          router.push(`/dashboard/invoices?preview=${result.data.id}`);
        }, 100);
      } else if (!result.success) {
        // Si des détails Zod sont présents, afficher la première erreur précise
        const details = (result as { details?: { message: string }[] }).details;
        const detail = details?.[0]?.message;
        toast.error(result.error ?? "Erreur lors de la création", {
          description: detail ?? undefined,
        });
        console.error("[createInvoice] Erreur serveur:", result.error, details);
      }
    },
    onError: () => toast.error("Erreur lors de la création de la facture"),
  });
}

// ─── Hook : mettre à jour une facture ────────────────────────────────────────

/**
 * Mutation pour mettre à jour une facture existante.
 * Invalide le cache de la liste et du détail après succès.
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateInvoice>[1];
    }) => updateInvoice(id, data),
    onSuccess: (result, { id }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["invoices", id] });
        toast.success("Facture mise à jour !");
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
      }
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

// ─── Hook : changer le statut d'une facture ───────────────────────────────────

/**
 * Mutation pour changer le statut d'une facture (transitions validées côté serveur).
 */
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateInvoiceStatus(id, status),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else {
        toast.error(result.error ?? "Erreur lors du changement de statut");
      }
    },
    onError: () => toast.error("Erreur lors du changement de statut"),
  });
}

// ─── Hook : supprimer une facture ─────────────────────────────────────────────

/**
 * Mutation pour supprimer une facture.
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        toast.success("Facture supprimée");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

// ─── Hook : dupliquer une facture ─────────────────────────────────────────────

/**
 * Mutation pour dupliquer une facture existante.
 * Redirige vers la page d'édition du duplicata après succès.
 */
export function useDuplicateInvoice() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => duplicateInvoice(id),
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        toast.success("Facture dupliquée !");
        router.push(`/dashboard/invoices/${result.data.id}/edit`);
      } else {
        toast.error(result.error ?? "Erreur lors de la duplication");
      }
    },
    onError: () => toast.error("Erreur lors de la duplication"),
  });
}
