"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCompanyInfo, updateCompanyInfo } from "@/lib/actions/company";
import type { CompanyInfo } from "@/lib/validations/invoice";

// ─── Hook : informations de l'entreprise (format DB brut) ────────────────────

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

// ─── Hook : infos company mappées au format CompanyInfo (pour forms facture/devis/acompte) ─
// Charge depuis la DB et convertit les noms de champs DB → CompanyInfo
// Retourne null si les champs obligatoires sont vides (name, siret, address, city, email)

export function useCompanyInfoForForms() {
  return useQuery({
    queryKey: ["company", "forms"],
    queryFn: async () => {
      const result = await getCompanyInfo();
      if (!result.success || !result.data) return null;

      const d = result.data;
      // Vérifier que les champs obligatoires sont remplis
      if (!d.companyName || !d.companySiret || !d.companyAddress || !d.companyCity || !d.companyEmail) {
        return null;
      }

      // Mapper les noms DB → CompanyInfo
      return {
        name: d.companyName,
        siret: d.companySiret,
        address: d.companyAddress,
        zipCode: d.companyPostalCode ?? undefined,
        city: d.companyCity,
        email: d.companyEmail,
        phone: d.companyPhone ?? undefined,
      } as CompanyInfo;
    },
    staleTime: 5 * 60 * 1000,
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