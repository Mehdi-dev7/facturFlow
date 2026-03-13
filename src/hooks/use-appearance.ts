"use client";

// Hook qui charge les réglages d'apparence (themeColor + companyFont) depuis la DB
// Les polices sont pré-chargées via @font-face dans globals.css
// Utilise TanStack Query pour mettre en cache les données (évite un fetch à chaque montage)

import { useQuery } from "@tanstack/react-query";
import { getAppearanceSettings } from "@/lib/actions/appearance";
import { DEFAULT_THEME, DEFAULT_FONT } from "@/components/appearance/theme-config";

export function useAppearance() {
  const { data } = useQuery({
    queryKey: ["appearance"],
    queryFn: () => getAppearanceSettings(),
    // Les paramètres d'apparence changent rarement — cache 10 minutes
    staleTime: 10 * 60 * 1000,
  });

  return {
    themeColor:  data?.themeColor  ?? DEFAULT_THEME.primary,
    companyFont: data?.companyFont ?? DEFAULT_FONT.id,
    companyLogo: data?.companyLogo ?? null,
    companyName: data?.companyName ?? "",
  };
}
