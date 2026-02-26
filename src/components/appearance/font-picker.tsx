"use client";

// Sélecteur de police pour le nom de l'entreprise (5 options très différentes)

import { FONT_OPTIONS, getFontWeight } from "./theme-config";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FontPickerProps {
  value: string;             // font id courant
  companyName: string;       // pour l'aperçu en temps réel
  onChange: (id: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function FontPicker({ value, companyName, onChange }: FontPickerProps) {
  const displayName = companyName.trim() || "Votre Entreprise";

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
        Police du nom d&apos;entreprise
      </label>

      <div className="space-y-2">
        {FONT_OPTIONS.map((font) => {
          const isActive = font.id === value;
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onChange(font.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 md:px-3 md:py-2.5 lg:px-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                isActive
                  ? "border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-500/10"
                  : "border-slate-200 dark:border-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/40 bg-white dark:bg-[#1a1438]"
              }`}
            >
              {/* Aperçu du nom avec la police */}
              <span
                style={{ fontFamily: font.family, fontWeight: getFontWeight(font.id) }}
                className={`text-xs sm:text-base truncate max-w-[60%] ${
                  isActive
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {displayName}
              </span>

              {/* Label descriptif */}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                {font.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
