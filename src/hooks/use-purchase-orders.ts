"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	getPurchaseOrders,
	getPurchaseOrder,
	createPurchaseOrder,
	saveDraftPurchaseOrder,
	updatePurchaseOrder,
	updatePurchaseOrderStatus,
	deletePurchaseOrder,
	duplicatePurchaseOrder,
	createInvoiceFromPurchaseOrder,
	type SavedPurchaseOrder,
} from "@/lib/actions/purchase-orders";
import type { PurchaseOrderFormData } from "@/lib/validations/purchase-order";
import { useUpgradeStore } from "@/stores/use-upgrade-store";

// Re-exports pour simplifier les imports depuis d'autres fichiers
export type { SavedPurchaseOrder };
export { saveDraftPurchaseOrder };

// ─── Hook : liste des bons de commande ──────────────────────────────────────

/**
 * Récupère tous les bons de commande, avec un filtre optionnel par mois ("YYYY-MM").
 */
export function usePurchaseOrders(filters?: { month?: string }) {
	return useQuery({
		queryKey: ["purchase-orders", filters ?? {}],
		queryFn: async (): Promise<SavedPurchaseOrder[]> => {
			const result = await getPurchaseOrders(filters);
			if (!result.success) throw new Error(result.error);
			return result.data as SavedPurchaseOrder[];
		},
		staleTime: 30_000,
	});
}

// ─── Hook : un bon de commande par ID ───────────────────────────────────────

/**
 * Récupère un bon de commande par son ID. Ne fait rien si l'ID est null.
 */
export function usePurchaseOrder(id: string | null) {
	return useQuery({
		queryKey: ["purchase-orders", id],
		queryFn: async (): Promise<SavedPurchaseOrder> => {
			const result = await getPurchaseOrder(id!);
			if (!result.success || !result.data) {
				throw new Error(result.error ?? "Bon de commande introuvable");
			}
			return result.data;
		},
		enabled: !!id,
		staleTime: 30_000,
	});
}

// ─── Hook : créer un bon de commande ────────────────────────────────────────

/**
 * Mutation pour créer un nouveau BC.
 * Redirige vers la page de prévisualisation après succès.
 */
export function useCreatePurchaseOrder() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const openUpgradeModal = useUpgradeStore((s) => s.openUpgradeModal);

	return useMutation({
		mutationFn: ({ data, draftId }: { data: PurchaseOrderFormData; draftId?: string }) =>
			createPurchaseOrder(data, draftId),
		onSuccess: (result) => {
			if (result.success && result.data) {
				queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
				toast.success("Bon de commande créé !");
				router.push(`/dashboard/purchase-orders?preview=${result.data.id}`);
			} else if (!result.success) {
				// Rediriger vers la modale d'upgrade si limite plan atteinte
				if (result.error?.includes("Limite") || result.error?.includes("plan Pro")) {
					openUpgradeModal("unlimited_documents");
					return;
				}
				const details = (result as { details?: { message: string }[] }).details;
				const detail = details?.[0]?.message;
				toast.error(result.error ?? "Erreur lors de la création", {
					description: detail ?? undefined,
				});
			}
		},
		onError: () => toast.error("Erreur lors de la création du bon de commande"),
	});
}

// ─── Hook : mettre à jour un bon de commande ────────────────────────────────

export function useUpdatePurchaseOrder() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: PurchaseOrderFormData }) =>
			updatePurchaseOrder(id, data),
		onSuccess: (result, { id }) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
				queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
				router.refresh();
				toast.success("Bon de commande mis à jour !");
			} else {
				toast.error(result.error ?? "Erreur lors de la mise à jour");
			}
		},
		onError: () => toast.error("Erreur lors de la mise à jour"),
	});
}

// ─── Hook : changer le statut d'un BC ───────────────────────────────────────

/**
 * Mutation pour changer le statut d'un BC (transitions validées côté serveur).
 */
export function useUpdatePurchaseOrderStatus() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			updatePurchaseOrderStatus(id, status),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
				router.refresh();
			} else {
				toast.error(result.error ?? "Erreur lors du changement de statut");
			}
		},
		onError: () => toast.error("Erreur lors du changement de statut"),
	});
}

// ─── Hook : supprimer un BC ──────────────────────────────────────────────────

/**
 * Mutation pour supprimer un bon de commande.
 */
export function useDeletePurchaseOrder() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (id: string) => deletePurchaseOrder(id),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
				router.refresh();
				toast.success("Bon de commande supprimé");
			} else {
				toast.error(result.error ?? "Erreur lors de la suppression");
			}
		},
		onError: () => toast.error("Erreur lors de la suppression"),
	});
}

// ─── Hook : dupliquer un BC ──────────────────────────────────────────────────

/**
 * Mutation pour dupliquer un BC existant.
 * Redirige vers la page d'édition du duplicata après succès.
 */
export function useDuplicatePurchaseOrder() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (id: string) => duplicatePurchaseOrder(id),
		onSuccess: (result) => {
			if (result.success && result.data) {
				queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
				toast.success("Bon de commande dupliqué !");
				router.push(`/dashboard/purchase-orders/${result.data.id}/edit`);
			} else {
				toast.error(result.error ?? "Erreur lors de la duplication");
			}
		},
		onError: () => toast.error("Erreur lors de la duplication"),
	});
}

// ─── Hook : convertir un BC en facture ──────────────────────────────────────

/**
 * Mutation pour créer une facture depuis un BC accepté.
 * Redirige vers la prévisualisation de la facture créée.
 */
export function useCreateInvoiceFromPurchaseOrder() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const openUpgradeModal = useUpgradeStore((s) => s.openUpgradeModal);

	return useMutation({
		mutationFn: (id: string) => createInvoiceFromPurchaseOrder(id),
		onSuccess: (result) => {
			if (result.success && result.data) {
				// Invalider les deux listes (BC + factures)
				queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
				queryClient.invalidateQueries({ queryKey: ["invoices"] });
				toast.success("Facture créée depuis le bon de commande !");
				router.push(`/dashboard/invoices?preview=${result.data.id}`);
			} else if (!result.success) {
				if (result.error?.includes("Limite") || result.error?.includes("plan Pro")) {
					openUpgradeModal("unlimited_documents");
					return;
				}
				toast.error(result.error ?? "Erreur lors de la conversion");
			}
		},
		onError: () => toast.error("Erreur lors de la création de la facture"),
	});
}
