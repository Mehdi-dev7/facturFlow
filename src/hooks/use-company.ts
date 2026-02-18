"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCompanyInfo, updateCompanyInfo } from "@/lib/actions/company";

// ─── Hook : informations de l'entreprise ─────────────────────────────────────

export function useCompanyInfo() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const result = await getCompanyInfo();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Hook : mise à jour des informations ─────────────────────────────────────

export function useUpdateCompanyInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompanyInfo,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["company"] });
        toast.success("Informations de l'entreprise sauvegardées !");
      } else {
        const details = (result as { details?: { message: string }[] }).details;
        const detail = details?.[0]?.message;
        toast.error(result.error ?? "Erreur lors de la sauvegarde", {
          description: detail ?? undefined,
        });
      }
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
}