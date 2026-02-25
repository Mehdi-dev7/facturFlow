"use client";

// Sélecteur de thème de couleur : 10 swatches prédéfinis + color picker libre

import { Check } from "lucide-react";
import { COLOR_THEMES } from "./theme-config";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ThemePickerProps {
  value: string;            // hex courant
  onChange: (hex: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  // Déterminer si la couleur courante correspond à un thème prédéfini
  const isCustom = !COLOR_THEMES.some((t) => t.primary === value);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
        Couleur du thème
      </label>

      {/* Grille de 5+5 swatches */}
      <div className="grid grid-cols-5 gap-2">
        {COLOR_THEMES.map((theme) => {
          const isActive = theme.primary === value;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.primary)}
              title={theme.name}
              className="relative w-full aspect-square rounded-xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                boxShadow: isActive ? `0 0 0 3px white, 0 0 0 5px ${theme.primary}` : undefined,
              }}
            >
              {isActive && (
                <Check className="absolute inset-0 m-auto text-white drop-shadow-md" size={16} />
              )}
              <span className="sr-only">{theme.name}</span>
            </button>
          );
        })}
      </div>

      {/* Ligne du bas : couleur perso + indicateur */}
      <div className="flex items-center gap-3 pt-1">
        <div className="relative">
          {/* Bouton swatch "Personnalisé" */}
          <button
            type="button"
            className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-slate-400 transition-colors"
            style={{
              background: isCustom ? value : "transparent",
              boxShadow: isCustom ? `0 0 0 3px white, 0 0 0 5px ${value}` : undefined,
            }}
            onClick={() => document.getElementById("custom-color-input")?.click()}
            title="Couleur personnalisée"
          >
            {!isCustom && (
              <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">+</span>
            )}
            {isCustom && (
              <Check className="text-white drop-shadow-md" size={16} />
            )}
          </button>

          {/* Input color caché derrière le bouton */}
          <input
            id="custom-color-input"
            type="color"
            value={isCustom ? value : "#7c3aed"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Personnalisé
          </p>
          {isCustom && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {value.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
