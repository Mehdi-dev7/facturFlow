"use client";

// Hook qui charge les réglages d'apparence (themeColor + companyFont) depuis la DB
// Les polices sont pré-chargées via @font-face dans globals.css

import { useState, useEffect } from "react";
import { getAppearanceSettings } from "@/lib/actions/appearance";
import { DEFAULT_THEME, DEFAULT_FONT } from "@/components/appearance/theme-config";

export function useAppearance() {
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME.primary);
  const [companyFont, setCompanyFont] = useState(DEFAULT_FONT.id);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    getAppearanceSettings().then((settings) => {
      if (!settings) return;

      if (settings.themeColor) setThemeColor(settings.themeColor);
      if (settings.companyFont) setCompanyFont(settings.companyFont);
      if (settings.companyLogo) setCompanyLogo(settings.companyLogo);
      if (settings.companyName) setCompanyName(settings.companyName);
    });
  }, []);

  return { themeColor, companyFont, companyLogo, companyName };
}
