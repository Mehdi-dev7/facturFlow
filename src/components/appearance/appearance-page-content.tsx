"use client";

// Page Apparence — split layout desktop / sticky preview mobile
// Gère l'état local et sauvegarde via server action

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Save, Palette, Plus } from "lucide-react";
import { InvoicePreview } from "./invoice-preview";
import { ThemePicker } from "./theme-picker";
import { FontPicker } from "./font-picker";
import { LogoUpload } from "./logo-upload";
import { DEFAULT_THEME, DEFAULT_FONT } from "./theme-config";
import { saveAppearance } from "@/lib/actions/appearance";
// ─── Props (données initiales depuis le serveur) ──────────────────────────────

interface AppearancePageContentProps {
  initial: {
    themeColor:    string | null;
    companyFont:   string | null;
    companyName:   string | null;
    companyLogo:   string | null;
    invoiceFooter: string | null;
  };
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AppearancePageContent({ initial }: AppearancePageContentProps) {
  // État local — synchronisé avec les données DB initiales
  const [themeColor,     setThemeColor]     = useState(initial.themeColor    ?? DEFAULT_THEME.primary);
  const [companyFont,    setCompanyFont]    = useState(initial.companyFont    ?? DEFAULT_FONT.id);
  const [companyName,    setCompanyName]    = useState(initial.companyName    ?? "");
  const [logo,           setLogo]           = useState<string | null>(initial.companyLogo);
  const [invoiceFooter,  setInvoiceFooter]  = useState(initial.invoiceFooter  ?? "");
  const [isSaving,       setIsSaving]       = useState(false);

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const result = await saveAppearance({ themeColor, companyFont, companyName, companyLogo: logo, invoiceFooter, headerTextColor: "auto" });
    if (result.success) {
      toast.success("Apparence sauvegardée !");
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde");
    }
    setIsSaving(false);
  }, [themeColor, companyFont, companyName, logo, invoiceFooter]);

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
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-3 sm:p-5 shadow-sm">
            <ThemePicker value={themeColor} onChange={setThemeColor} />
          </section>

          {/* Nom de l'entreprise */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-3 sm:p-5 shadow-sm space-y-3">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Nom affiché sur les documents
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Votre Entreprise"
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-violet-500/30 bg-slate-50 dark:bg-[#2a2254]/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
            />
            <p className="text-[10px] text-slate-400">
              S&apos;affiche dans le header de toutes vos factures, devis et acomptes.
            </p>
          </section>

          {/* Logo */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-3 sm:p-5 shadow-sm">
            <LogoUpload value={logo} onChange={setLogo} />
          </section>

          {/* Police */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-3 sm:p-5 shadow-sm">
            <FontPicker value={companyFont} companyName={companyName} onChange={setCompanyFont} />
          </section>

          {/* Footer PDF */}
          <section className="bg-white dark:bg-[#1a1438] rounded-2xl border border-slate-200 dark:border-violet-500/20 p-3 sm:p-5 shadow-sm space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                Footer de vos PDF
              </label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Affiché en bas de toutes vos factures, devis et documents. Idéal pour vos mentions légales, IBAN ou un message personnalisé.
              </p>
            </div>

            {/* Chips d'insertion rapide */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Franchise TVA", snippet: "TVA non applicable, art. 293 B du CGI" },
                { label: "IBAN",          snippet: "[Votre IBAN]" },
                { label: "Merci de votre confiance", snippet: "Merci de votre confiance !" },
              ].map(({ label, snippet }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setInvoiceFooter((prev) =>
                      prev ? `${prev} — ${snippet}` : snippet
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              placeholder={"Ex : TVA non applicable, art. 293 B du CGI — IBAN : FR76 3000 1234 5678 — Merci de votre confiance !"}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-violet-500/30 bg-slate-50 dark:bg-[#2a2254]/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right">{invoiceFooter.length}/300</p>
          </section>

          {/* Bouton Enregistrer — pleine largeur mobile, 1/3 à partir de md */}
          <div className="md:ml-auto md:w-1/2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-11 flex items-center justify-center gap-2 px-6 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-violet-500/25 transition-all duration-300 hover:scale-103 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save size={16} />
              {isSaving ? "Sauvegarde en cours…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* ── Aperçu live (droite, sticky — desktop uniquement) ── */}
        <div className="hidden lg:block w-[500px] xl:w-[580px] 2xl:w-[720px] shrink-0">
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
