"use client";
// src/lib/pdf/quote-pdf.tsx
// Wrapper client-side pour le téléchargement PDF navigateur des devis

import { pdf } from "@react-pdf/renderer";
import type { SavedQuote } from "@/hooks/use-quotes";
import QuotePdfDocument from "./quote-pdf-document";

// Re-export du composant pour rétro-compatibilité
export { default } from "./quote-pdf-document";

/**
 * Génère le PDF du devis et déclenche le téléchargement navigateur.
 * À importer via dynamic import côté client uniquement.
 */
export async function downloadQuotePDF(quote: SavedQuote) {
  // Fallback émetteur : si la DB n'a pas les infos, lire le localStorage
  let enriched = quote;
  if (!quote.user.companyName) {
    try {
      const saved = localStorage.getItem("facturflow_company");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; siret?: string; address?: string; city?: string; email?: string; zipCode?: string };
        enriched = {
          ...quote,
          user: {
            ...quote.user,
            companyName: c.name ?? null,
            companySiret: c.siret ?? null,
            companyAddress: c.address ?? null,
            companyCity: c.city ?? null,
            companyPostalCode: c.zipCode ?? null,
            companyEmail: c.email ?? null,
          },
        };
      }
    } catch {
      // ignore localStorage errors
    }
  }

  const blob = await pdf(<QuotePdfDocument quote={enriched} />).toBlob();
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `devis-${enriched.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}