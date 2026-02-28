// src/lib/pdf/pdf-fonts.ts
// Enregistrement centralisé des fonts pour react-pdf
// Les fichiers sont dans /public/fonts/ → servis par Next.js sans CORS

import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Résout le chemin absolu d'un fichier de police.
 * - Navigateur : URL absolue basée sur window.location.origin
 * - Serveur (Node.js) : URL file:// basée sur le répertoire du projet
 */
function fontSrc(filename: string): string {
  if (typeof window !== "undefined") {
    // Côté client : le navigateur connaît l'origine
    return `${window.location.origin}/fonts/${filename}`;
  }
  // Côté serveur : chemin absolu sur le système de fichiers
  return `file://${process.cwd()}/public/fonts/${filename}`;
}

/**
 * Enregistre les polices custom pour react-pdf.
 * Appelé une seule fois (idempotent grâce au flag `registered`).
 * Les polices sont servies localement depuis /public/fonts/ — aucun CDN.
 */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  // TTF utilisé à la place de woff2 — react-pdf/fontkit a des problèmes
  // avec la décompression Brotli du format woff2.
  Font.register({ family: "Playfair Display",       src: fontSrc("playfair-display-700.ttf") });
  Font.register({ family: "Dancing Script",          src: fontSrc("dancing-script-700.ttf") });
  Font.register({ family: "Orbitron",                src: fontSrc("orbitron-700.ttf") });
  Font.register({ family: "Sour Gummy",              src: fontSrc("sour-gummy-700.ttf") });
  Font.register({ family: "Shadows Into Light Two",  src: fontSrc("shadows-into-light-two-400.ttf") });
  Font.register({ family: "Kanit",                   src: fontSrc("kanit-700.ttf") });
}

/** Mappe l'id font (apparence) → famille react-pdf */
export function getPdfFontFamily(fontId: string | null | undefined): string {
  switch (fontId) {
    case "playfair": return "Playfair Display";
    case "script":   return "Dancing Script";
    case "orbitron": return "Orbitron";
    case "sour-gummy": return "Sour Gummy";
    case "shadows":    return "Shadows Into Light Two";
    case "kanit":      return "Kanit";
    default:           return "Helvetica-Bold";
  }
}
