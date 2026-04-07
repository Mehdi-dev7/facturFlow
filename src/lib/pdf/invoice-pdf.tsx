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
      const saved = localStorage.getItem("facturnow_company");
      const appearance = localStorage.getItem("facturnow_appearance");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; siret?: string; address?: string; city?: string; email?: string; zipCode?: string };
        const a = appearance ? JSON.parse(appearance) as { themeColor?: string; companyFont?: string; companyLogo?: string } : {};
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
            themeColor: invoice.user.themeColor ?? a.themeColor ?? null,
            companyFont: invoice.user.companyFont ?? a.companyFont ?? null,
            companyLogo: invoice.user.companyLogo ?? a.companyLogo ?? null,
          },
        };
      }
    } catch { /* ignore */ }
  }

  try {
    const blob = await pdf(<InvoicePdfDocument invoice={enriched} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[PDF] Erreur génération facture:", err);
    const { toast } = await import("sonner");
    toast.error("Impossible de générer le PDF. Réessayez.");
    throw err;
  }
}
