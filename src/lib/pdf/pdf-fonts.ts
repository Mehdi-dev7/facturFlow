// src/lib/pdf/pdf-fonts.ts
// Enregistrement centralisé des fonts pour react-pdf
// Les fichiers sont dans /public/fonts/ → servis par Next.js sans CORS

import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Enregistre les polices custom pour react-pdf.
 * Appelé une seule fois (idempotent grâce au flag `registered`).
 * Les polices sont servies localement depuis /public/fonts/ — aucun CDN.
 */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({ family: "Playfair Display",       src: "/fonts/playfair-display-700.woff2" });
  Font.register({ family: "Dancing Script",          src: "/fonts/dancing-script-700.woff2" });
  Font.register({ family: "Orbitron",                src: "/fonts/orbitron-700.woff2" });
  Font.register({ family: "Sour Gummy",              src: "/fonts/sour-gummy-700.woff2" });
  Font.register({ family: "Shadows Into Light Two",  src: "/fonts/shadows-into-light-two-400.woff2" });
  Font.register({ family: "Kanit",                   src: "/fonts/kanit-700.woff2" });
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
