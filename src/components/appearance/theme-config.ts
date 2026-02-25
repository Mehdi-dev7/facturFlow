// Configuration des thèmes de couleur et des polices

// ─── Thèmes de couleur (10 + personnalisé) ───────────────────────────────────

export interface ColorTheme {
  id: string;
  name: string;
  from: string;  // couleur début du gradient header
  to: string;    // couleur fin du gradient header
  primary: string; // couleur stockée en DB
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: "violet",   name: "Violet",      from: "#7c3aed", to: "#a855f7", primary: "#7c3aed" },
  { id: "blue",     name: "Bleu nuit",   from: "#1d4ed8", to: "#3b82f6", primary: "#1d4ed8" },
  { id: "emerald",  name: "Émeraude",    from: "#059669", to: "#10b981", primary: "#059669" },
  { id: "slate",    name: "Ardoise",     from: "#334155", to: "#64748b", primary: "#334155" },
  { id: "rose",     name: "Rose corail", from: "#e11d48", to: "#f43f5e", primary: "#e11d48" },
  { id: "orange",   name: "Orange chaud",from: "#c2410c", to: "#ea580c", primary: "#c2410c" },
  { id: "indigo",   name: "Indigo",      from: "#4338ca", to: "#6366f1", primary: "#4338ca" },
  { id: "cyan",     name: "Cyan",        from: "#0891b2", to: "#06b6d4", primary: "#0891b2" },
  { id: "bordeaux", name: "Bordeaux",    from: "#9f1239", to: "#e11d48", primary: "#9f1239" },
  { id: "gold",     name: "Or",          from: "#b45309", to: "#d97706", primary: "#b45309" },
];

export const DEFAULT_THEME = COLOR_THEMES[0]; // Violet

// ─── Polices d'écriture (5 très différentes) ─────────────────────────────────

export interface FontOption {
  id: string;
  name: string;
  label: string;        // Texte d'aperçu
  family: string;       // CSS font-family
  googleFont?: string;  // Paramètre Google Fonts (null = système)
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    label: "Moderne & Épuré",
    family: "Inter, system-ui, sans-serif",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    label: "Élégant & Luxe",
    family: "'Playfair Display', serif",
    googleFont: "Playfair+Display:wght@400;700",
  },
  {
    id: "script",
    name: "Dancing Script",
    label: "Manuscrit & Créatif",
    family: "'Dancing Script', cursive",
    googleFont: "Dancing+Script:wght@400;700",
  },
  {
    id: "orbitron",
    name: "Orbitron",
    label: "Tech & Futuriste",
    family: "Orbitron, sans-serif",
    googleFont: "Orbitron:wght@400;700",
  },
  {
    id: "bebas",
    name: "Bebas Neue",
    label: "Impact & Bold",
    family: "'Bebas Neue', sans-serif",
    googleFont: "Bebas+Neue",
  },
];

export const DEFAULT_FONT = FONT_OPTIONS[0]; // Inter

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retourne la famille CSS d'une font par son id */
export function getFontFamily(fontId: string): string {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.family ?? FONT_OPTIONS[0].family;
}

/** Calcule le gradient CSS à partir d'une couleur hex (pour le mode custom) */
export function colorToGradient(hex: string): string {
  // Chercher si c'est un thème prédéfini
  const theme = COLOR_THEMES.find((t) => t.primary === hex);
  if (theme) return `linear-gradient(135deg, ${theme.from}, ${theme.to})`;

  // Sinon, éclaircir la couleur pour le gradient
  const lighter = lightenHex(hex, 0.3);
  return `linear-gradient(135deg, ${hex}, ${lighter})`;
}

/** Éclaircit une couleur hex d'un facteur 0-1 */
function lightenHex(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}
