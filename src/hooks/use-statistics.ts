"use client";

import { useQuery } from "@tanstack/react-query";
import { getStats, type StatsData } from "@/lib/actions/statistics";

/**
 * Récupère les statistiques agrégées pour une année donnée.
 */
export function useStatistics(year: number) {
  return useQuery({
    queryKey: ["statistics", year],
    queryFn: async (): Promise<StatsData> => {
      const result = await getStats(year);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Erreur statistiques");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
