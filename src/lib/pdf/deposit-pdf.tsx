"use client";
// src/lib/pdf/deposit-pdf.tsx
// Wrapper client-side pour le téléchargement PDF navigateur des acomptes

import { pdf } from "@react-pdf/renderer";
import type { SavedDeposit } from "@/lib/types/deposits";
import DepositPdfDocument from "./deposit-pdf-document";

// Re-export du composant pour rétro-compatibilité
export { default } from "./deposit-pdf-document";

/**
 * Génère le PDF de l'acompte et déclenche le téléchargement navigateur.
 * À importer via dynamic import côté client uniquement.
 */
export async function downloadDepositPDF(deposit: SavedDeposit) {
  // Fallback émetteur : si la DB n'a pas les infos, lire le localStorage
  let enriched = deposit;
  if (!deposit.user.companyName) {
    try {
      const saved = localStorage.getItem("facturnow_company");
      const appearance = localStorage.getItem("facturnow_appearance");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; siret?: string; address?: string; city?: string; email?: string; zipCode?: string };
        const a = appearance ? JSON.parse(appearance) as { themeColor?: string; companyFont?: string; companyLogo?: string } : {};
        enriched = {
          ...deposit,
          user: {
            ...deposit.user,
            companyName: c.name ?? null,
            companySiret: c.siret ?? null,
            companyAddress: c.address ?? null,
            companyCity: c.city ?? null,
            companyPostalCode: c.zipCode ?? null,
            companyEmail: c.email ?? null,
            themeColor: deposit.user.themeColor ?? a.themeColor ?? null,
            companyFont: deposit.user.companyFont ?? a.companyFont ?? null,
            companyLogo: deposit.user.companyLogo ?? a.companyLogo ?? null,
          },
        };
      }
    } catch {
      // ignore localStorage errors
    }
  }

  try {
    const blob = await pdf(<DepositPdfDocument deposit={enriched} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acompte-${enriched.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[PDF] Erreur génération acompte:", err);
    const { toast } = await import("sonner");
    toast.error("Impossible de générer le PDF. Réessayez.");
    throw err;
  }
}