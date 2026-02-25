"use client";

// Page Apparence — split layout desktop / sticky preview mobile
// Gère l'état local et sauvegarde via server action

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Palette } from "lucide-react";
import { InvoicePreview } from "./invoice-preview";
import { ThemePicker } from "./theme-picker";
import { FontPicker } from "./font-picker";
import { LogoUpload } from "./logo-upload";
import { FONT_OPTIONS, DEFAULT_THEME, DEFAULT_FONT } from "./theme-config";
import { saveAppearance } from "@/lib/actions/appearance";

// ─── Props (données initiales depuis le serveur) ──────────────────────────────

interface AppearancePageContentProps {
  initial: {
    themeColor: string | null;
    companyFont: string | null;
    companyName: string | null;
    companyLogo: string | null;
  };
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AppearancePageContent({ initial }: AppearancePageContentProps) {
  // État local — synchronisé avec les données DB initiales
  const [themeColor,   setThemeColor]   = useState(initial.themeColor  ?? DEFAULT_THEME.primary);
  const [companyFont,  setCompanyFont]  = useState(initial.companyFont  ?? DEFAULT_FONT.id);
  const [companyName,  setCompanyName]  = useState(initial.companyName  ?? "");
  const [logo,         setLogo]         = useState<string | null>(initial.companyLogo);
  const [isSaving,     setIsSaving]     = useState(false);

  // ── Chargement des Google Fonts nécessaires ────────────────────────────────

  useEffect(() => {
    const googleFonts = FONT_OPTIONS
      .filter((f) => f.googleFont)
      .map((f) => `family=${f.googleFont}`)
      .join("&");

    const url = `https://fonts.googleapis.com/css2?${googleFonts}&display=swap`;

    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }, []);

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const result = await saveAppearance({ themeColor, companyFont, companyName, companyLogo: logo });
    if (result.success) {
      toast.success("Apparence sauvegardée !");
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde");
    }
    setIsSaving(false);
  }, [themeColor, companyFont, companyName, logo]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">

      {/* ── Header de page ── */}
      <div className="flex items-center gap-3 mb-6 lg:mb-8">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20">
          <Palette size={18} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Apparence</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personnalisez le style de vos documents
          </p>
        </div>
      </div>

      {/* ── Mobile : mini preview sticky ── */}
      <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-white/80 dark:bg-[#0f0c1e]/80 backdrop-blur-md border-b border-slate-200 dark:border-violet-500/20 mb-6">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 text-center uppercase tracking-wide font-medium">
          Aperçu en temps réel
        </p>
        <InvoicePreview
          themeColor={themeColor}
          companyFont={companyFont}
          companyName={companyName}
          logo={logo}
          mini
        />
      </div>

      {/* ── Layout principal : settings + preview ── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* ── Panneau de settings (gauche, scrollable) ── */}
        <div className="w-full lg:flex-1 space-y-7">

          {/* Couleur du thème */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-5 shadow-sm">
            <ThemePicker value={themeColor} onChange={setThemeColor} />
          </section>

          {/* Nom de l'entreprise */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-5 shadow-sm space-y-3">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Nom affiché sur les documents
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Votre Entreprise"
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-violet-500/30 bg-slate-50 dark:bg-[#2a2254]/50 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
            />
            <p className="text-[10px] text-slate-400">
              S&apos;affiche dans le header de toutes vos factures, devis et acomptes.
            </p>
          </section>

          {/* Logo */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-5 shadow-sm">
            <LogoUpload value={logo} onChange={setLogo} />
          </section>

          {/* Police */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-5 shadow-sm">
            <FontPicker value={companyFont} companyName={companyName} onChange={setCompanyFont} />
          </section>

          {/* Bouton Enregistrer */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-violet-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={16} />
            {isSaving ? "Sauvegarde en cours…" : "Enregistrer l'apparence"}
          </button>
        </div>

        {/* ── Aperçu live (droite, sticky — desktop uniquement) ── */}
        <div className="hidden lg:block w-[440px] xl:w-[500px] shrink-0">
          <div className="sticky top-6 space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">
              Aperçu en temps réel
            </p>
            <InvoicePreview
              themeColor={themeColor}
              companyFont={companyFont}
              companyName={companyName}
              logo={logo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
