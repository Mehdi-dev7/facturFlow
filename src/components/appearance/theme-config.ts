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
  weight?: number;      // Weight disponible (par défaut 700 pour bold)
  googleFont?: string;  // Paramètre Google Fonts (null = système)
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    label: "Moderne & Épuré",
    family: "Inter, system-ui, sans-serif",
    weight: 700,
  },
  {
    id: "playfair",
    name: "Playfair Display",
    label: "Élégant & Luxe",
    family: "'Playfair Display', serif",
    weight: 700,
    // Police locale chargée via globals.css @font-face
  },
  {
    id: "script",
    name: "Dancing Script",
    label: "Manuscrit & Créatif",
    family: "'Dancing Script', cursive",
    weight: 700,
    // Police locale chargée via globals.css @font-face
  },
  {
    id: "orbitron",
    name: "Orbitron",
    label: "Tech & Futuriste",
    family: "Orbitron, sans-serif",
    weight: 700,
    // Police locale chargée via globals.css @font-face
  },
  {
    id: "sour-gummy",
    name: "Sour Gummy",
    label: "Ludique & Fun",
    family: "'Sour Gummy', sans-serif",
    weight: 700,
    // Police locale chargée via globals.css @font-face
  },
  {
    id: "shadows",
    name: "Shadows Into Light Two",
    label: "Manuscrit & Léger",
    family: "'Shadows Into Light Two', cursive",
    weight: 400,  // Cette police n'a que weight 400
    // Police locale chargée via globals.css @font-face
  },
  {
    id: "kanit",
    name: "Kanit",
    label: "Moderne & Expansé",
    family: "Kanit, sans-serif",
    weight: 700,
    // Police locale chargée via globals.css @font-face
  },
];

export const DEFAULT_FONT = FONT_OPTIONS[0]; // Inter

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retourne la famille CSS d'une font par son id */
export function getFontFamily(fontId: string): string {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.family ?? FONT_OPTIONS[0].family;
}

/** Retourne le weight CSS d'une font par son id (pour le nom entreprise en bold) */
export function getFontWeight(fontId: string): number {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.weight ?? 700;
}

/**
 * Résout la couleur du texte du header selon le réglage et la couleur de fond.
 * "auto" → détection automatique par luminosité (noir si fond clair, blanc si fond foncé)
 * "white" → force blanc
 * "black" → force noir
 */
export function resolveHeaderTextColor(
  themeColor: string,
  setting: string | null | undefined,
): string {
  if (setting === "white") return "#ffffff";
  if (setting === "black") return "#000000";
  // Auto : calcul de luminosité relative (formule WCAG)
  const hex = themeColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.45 ? "#000000" : "#ffffff";
}

/**
 * Assure qu'une couleur est assez sombre pour être lisible sur fond blanc.
 * Utilisé pour les textes dans la zone de contenu (tableau, totaux, titres de section).
 * Si la luminosité dépasse 0.45, la couleur est assombrie proportionnellement.
 */
export function resolveContentColor(themeColor: string): string {
  const hex = themeColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance <= 0.45) return themeColor; // déjà assez sombre
  // Assombrir pour atteindre une luminance cible de 0.35
  const factor = 0.35 / luminance;
  const dr = Math.round(r * factor).toString(16).padStart(2, "0");
  const dg = Math.round(g * factor).toString(16).padStart(2, "0");
  const db = Math.round(b * factor).toString(16).padStart(2, "0");
  return `#${dr}${dg}${db}`;
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
