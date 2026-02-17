"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  type SavedClient,
} from "@/lib/actions/clients";
import type { ClientFormData } from "@/lib/validations/client";

// Re-export pour faciliter l'import
export type { SavedClient };

// ─── Hook : liste des clients ───────────────────────────────────────────────

export function useClients(filters?: { search?: string }) {
  return useQuery({
    queryKey: ["clients", filters ?? {}],
    queryFn: async (): Promise<SavedClient[]> => {
      const result = await getClients(filters);
      if (!result.success) throw new Error(result.error);
      return result.data as SavedClient[];
    },
    staleTime: 30_000,
  });
}

// ─── Hook : un client par ID ────────────────────────────────────────────────

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async (): Promise<SavedClient> => {
      const result = await getClient(id!);
      if (!result.success || !result.data) throw new Error(result.error ?? "Client introuvable");
      return result.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Hook : créer un client ────────────────────────────────────────────────

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientFormData) => createClient(data),
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast.success("Client créé !");
      } else if (!result.success) {
        const details = (result as { details?: { message: string }[] }).details;
        const detail = details?.[0]?.message;
        toast.error(result.error ?? "Erreur lors de la création", {
          description: detail ?? undefined,
        });
      }
    },
    onError: () => toast.error("Erreur lors de la création du client"),
  });
}

// ─── Hook : mettre à jour un client ────────────────────────────────────────

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) => updateClient(id, data),
    onSuccess: (result, { id }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["clients", id] });
        toast.success("Client mis à jour !");
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
      }
    },
    onError: () => toast.error("Erreur lors de la mise à jour du client"),
  });
}

// ─── Hook : supprimer un client ─────────────────────────────────────────────

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast.success("Client supprimé");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    },
    onError: () => toast.error("Erreur lors de la suppression du client"),
  });
}
