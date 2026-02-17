"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	getQuotes,
	getQuote,
	createQuote,
	updateQuote,
	updateQuoteStatus,
	deleteQuote,
	duplicateQuote,
	type SavedQuote,
	type CreateQuoteInput,
} from "@/lib/actions/quotes";

// Re-export pour faciliter l'import depuis d'autres fichiers
export type { SavedQuote };

// ─── Hook : liste des devis ─────────────────────────────────────────────────

/**
 * Récupère tous les devis, avec un filtre optionnel par mois ("YYYY-MM").
 */
export function useQuotes(filters?: { month?: string }) {
	return useQuery({
		queryKey: ["quotes", filters ?? {}],
		queryFn: async (): Promise<SavedQuote[]> => {
			const result = await getQuotes(filters);
			if (!result.success) throw new Error(result.error);
			return result.data as SavedQuote[];
		},
		staleTime: 30_000,
	});
}

// ─── Hook : un devis par ID ─────────────────────────────────────────────────

/**
 * Récupère un devis par son ID. Ne fait rien si l'ID est null.
 */
export function useQuote(id: string | null) {
	return useQuery({
		queryKey: ["quotes", id],
		queryFn: async (): Promise<SavedQuote> => {
			const result = await getQuote(id!);
			if (!result.success || !result.data) throw new Error(result.error ?? "Devis introuvable");
			return result.data;
		},
		enabled: !!id,
		staleTime: 30_000,
	});
}

// ─── Hook : créer un devis ──────────────────────────────────────────────────

/**
 * Mutation pour créer un nouveau devis.
 * Redirige vers la page de prévisualisation après succès.
 */
export function useCreateQuote() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (data: CreateQuoteInput) => createQuote(data),
		onSuccess: (result) => {
			if (result.success && result.data) {
				queryClient.invalidateQueries({ queryKey: ["quotes"] });
				toast.success("Devis créé !");
				router.push(`/dashboard/quotes?preview=${result.data.id}`);
			} else if (!result.success) {
				const details = (result as { details?: { message: string }[] }).details;
				const detail = details?.[0]?.message;
				toast.error(result.error ?? "Erreur lors de la création", {
					description: detail ?? undefined,
				});
				console.error("[createQuote] Erreur serveur:", result.error, details);
			}
		},
		onError: () => toast.error("Erreur lors de la création du devis"),
	});
}

// ─── Hook : mettre à jour un devis ──────────────────────────────────────────

export function useUpdateQuote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: CreateQuoteInput }) =>
			updateQuote(id, data),
		onSuccess: (result, { id }) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["quotes"] });
				queryClient.invalidateQueries({ queryKey: ["quotes", id] });
				toast.success("Devis mis à jour !");
			} else {
				toast.error(result.error ?? "Erreur lors de la mise à jour");
			}
		},
		onError: () => toast.error("Erreur lors de la mise à jour"),
	});
}

// ─── Hook : changer le statut d'un devis ────────────────────────────────────

/**
 * Mutation pour changer le statut d'un devis (transitions validées côté serveur).
 */
export function useUpdateQuoteStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			updateQuoteStatus(id, status),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["quotes"] });
			} else {
				toast.error(result.error ?? "Erreur lors du changement de statut");
			}
		},
		onError: () => toast.error("Erreur lors du changement de statut"),
	});
}

// ─── Hook : supprimer un devis ──────────────────────────────────────────────

/**
 * Mutation pour supprimer un devis.
 */
export function useDeleteQuote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteQuote(id),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["quotes"] });
				toast.success("Devis supprimé");
			} else {
				toast.error(result.error ?? "Erreur lors de la suppression");
			}
		},
		onError: () => toast.error("Erreur lors de la suppression"),
	});
}

// ─── Hook : dupliquer un devis ──────────────────────────────────────────────

/**
 * Mutation pour dupliquer un devis existant.
 * Redirige vers la page d'édition du duplicata après succès.
 */
export function useDuplicateQuote() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (id: string) => duplicateQuote(id),
		onSuccess: (result) => {
			if (result.success && result.data) {
				queryClient.invalidateQueries({ queryKey: ["quotes"] });
				toast.success("Devis dupliqué !");
				router.push(`/dashboard/quotes/${result.data.id}/edit`);
			} else {
				toast.error(result.error ?? "Erreur lors de la duplication");
			}
		},
		onError: () => toast.error("Erreur lors de la duplication"),
	});
}
