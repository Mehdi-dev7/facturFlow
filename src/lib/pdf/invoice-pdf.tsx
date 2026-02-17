"use client";
// src/lib/pdf/invoice-pdf.tsx
// Wrapper client-side pour le téléchargement PDF navigateur

import { pdf } from "@react-pdf/renderer";
import type { SavedInvoice } from "@/lib/actions/invoices";
import InvoicePdfDocument from "./invoice-pdf-document";

// Re-export du composant pour rétro-compatibilité
export { default } from "./invoice-pdf-document";

/**
 * Génère le PDF de la facture et déclenche le téléchargement navigateur.
 * À importer via dynamic import côté client uniquement.
 */
export async function downloadInvoicePDF(invoice: SavedInvoice) {
  // Fallback émetteur : si la DB n'a pas les infos, lire le localStorage
  let enriched = invoice;
  if (!invoice.user.companyName) {
    try {
      const saved = localStorage.getItem("facturflow_company");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; siret?: string; address?: string; city?: string; email?: string; zipCode?: string };
        enriched = {
          ...invoice,
          user: {
            ...invoice.user,
            companyName: c.name ?? null,
            companySiret: c.siret ?? null,
            companyAddress: c.address ?? null,
            companyPostalCode: c.zipCode ?? null,
            companyCity: c.city ?? null,
            companyEmail: c.email ?? null,
          },
        };
      }
    } catch { /* ignore */ }
  }

  const blob = await pdf(<InvoicePdfDocument invoice={enriched} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
