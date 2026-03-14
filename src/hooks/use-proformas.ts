"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	getProformas,
	getProforma,
	createProforma,
	saveDraftProforma,
	updateProforma,
	updateProformaStatus,
	deleteProforma,
	duplicateProforma,
	sendProforma,
	convertProformaToInvoice,
	type SavedProforma,
} from "@/lib/actions/proformas";
import { sendProformaEmail } from "@/lib/actions/send-proforma-email";
import type { InvoiceFormData } from "@/lib/validations/invoice";
import { useUpgradeStore } from "@/stores/use-upgrade-store";

// Re-export pour faciliter les imports
export type { SavedProforma };
export { saveDraftProforma };

// ─── Hook : liste des proformas ──────────────────────────────────────────────

export function useProformas() {
	return useQuery({
		queryKey: ["proformas"],
		queryFn: async (): Promise<SavedProforma[]> => {
			const result = await getProformas();
			if (!result.success) throw new Error(result.error);
			return result.data as SavedProforma[];
		},
		staleTime: 30_000,
	});
}

// ─── Hook : une proforma par ID ──────────────────────────────────────────────

export function useProforma(id: string | null) {
	return useQuery({
		queryKey: ["proforma", id],
		queryFn: async (): Promise<SavedProforma> => {
			const result = await getProforma(id!);
			if (!result.success || !result.data)
				throw new Error(result.error ?? "Proforma introuvable");
			return result.data;
		},
		enabled: !!id,
		staleTime: 30_000,
	});
}

// ─── Hook : créer une proforma ───────────────────────────────────────────────

export function useCreateProforma() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const openUpgradeModal = useUpgradeStore((s) => s.openUpgradeModal);

	return useMutation({
		mutationFn: ({
			data,
			draftId,
		}: {
			data: InvoiceFormData;
			draftId?: string;
		}) => createProforma(data, draftId),
		onSuccess: (result) => {
			if (result.success && result.data) {
				// Envoyer l'email automatiquement après création (status → SENT)
				sendProformaEmail(result.data.id)
					.then(() => queryClient.invalidateQueries({ queryKey: ["proformas"] }))
					.catch((err) => console.error("[proforma] Erreur envoi email:", err));

				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				toast.success("Proforma créée et envoyée !");
				router.push(`/dashboard/proformas?preview=${result.data.id}`);
			} else if (!result.success) {
				if (
					result.error?.includes("Limite") ||
					result.error?.includes("plan Pro")
				) {
					openUpgradeModal("unlimited_documents");
					return;
				}
				const details = (
					result as { details?: { message: string }[] }
				).details;
				const detail = details?.[0]?.message;
				toast.error(result.error ?? "Erreur lors de la création", {
					description: detail ?? undefined,
				});
			}
		},
		onError: () => toast.error("Erreur lors de la création de la proforma"),
	});
}

// ─── Hook : mettre à jour une proforma ──────────────────────────────────────

export function useUpdateProforma() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: InvoiceFormData;
		}) => updateProforma(id, data),
		onSuccess: (result, { id }) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				queryClient.invalidateQueries({ queryKey: ["proforma", id] });
				router.refresh();
				toast.success("Proforma mise à jour !");
			} else {
				toast.error(result.error ?? "Erreur lors de la mise à jour");
			}
		},
		onError: () => toast.error("Erreur lors de la mise à jour"),
	});
}

// ─── Hook : changer le statut d'une proforma ────────────────────────────────

export function useUpdateProformaStatus() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: string;
		}) => updateProformaStatus(id, status),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				router.refresh();
			} else {
				toast.error(result.error ?? "Erreur lors du changement de statut");
			}
		},
		onError: () => toast.error("Erreur lors du changement de statut"),
	});
}

// ─── Hook : supprimer une proforma ──────────────────────────────────────────

export function useDeleteProforma() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (id: string) => deleteProforma(id),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				router.refresh();
				toast.success("Proforma supprimée");
			} else {
				toast.error(result.error ?? "Erreur lors de la suppression");
			}
		},
		onError: () => toast.error("Erreur lors de la suppression"),
	});
}

// ─── Hook : dupliquer une proforma ──────────────────────────────────────────

export function useDuplicateProforma() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (id: string) => duplicateProforma(id),
		onSuccess: (result) => {
			if (result.success && result.data) {
				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				toast.success("Proforma dupliquée !");
				router.push(`/dashboard/proformas/${result.data.id}/edit`);
			} else {
				toast.error(result.error ?? "Erreur lors de la duplication");
			}
		},
		onError: () => toast.error("Erreur lors de la duplication"),
	});
}

// ─── Hook : envoyer une proforma (status DRAFT → SENT) ──────────────────────

export function useSendProforma() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (id: string) => sendProforma(id),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				router.refresh();
				toast.success("Proforma envoyée !");
			} else {
				toast.error(result.error ?? "Erreur lors de l'envoi");
			}
		},
		onError: () => toast.error("Erreur lors de l'envoi"),
	});
}

// ─── Hook : convertir une proforma en facture ────────────────────────────────

export function useConvertProformaToInvoice() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: (proformaId: string) =>
			convertProformaToInvoice(proformaId),
		onSuccess: (result) => {
			if (result.success && result.data) {
				queryClient.invalidateQueries({ queryKey: ["proformas"] });
				queryClient.invalidateQueries({ queryKey: ["invoices"] });
				router.refresh();
				toast.success(
					`Facture ${result.data.invoiceNumber} créée avec succès !`,
				);
			} else {
				toast.error(result.error ?? "Erreur lors de la conversion");
			}
		},
		onError: () => toast.error("Erreur lors de la conversion en facture"),
	});
}
