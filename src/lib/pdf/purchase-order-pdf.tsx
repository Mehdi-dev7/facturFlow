"use client";
// src/lib/pdf/purchase-order-pdf.tsx
// Wrapper client-side pour le téléchargement PDF navigateur des bons de commande

import { pdf } from "@react-pdf/renderer";
import type { SavedPurchaseOrder } from "./purchase-order-pdf-document";
import PurchaseOrderPdfDocument from "./purchase-order-pdf-document";

// Re-export du type pour usage externe
export type { SavedPurchaseOrder };

// Re-export du composant pour import direct si besoin
export { default } from "./purchase-order-pdf-document";

/**
 * Génère le PDF du bon de commande et déclenche le téléchargement navigateur.
 * À importer via dynamic import côté client uniquement.
 */
export async function downloadPurchaseOrderPDF(purchaseOrder: SavedPurchaseOrder) {
  // Fallback émetteur : si la DB n'a pas les infos, lire le localStorage
  let enriched = purchaseOrder;
  if (!purchaseOrder.user.companyName) {
    try {
      const saved = localStorage.getItem("facturnow_company");
      const appearance = localStorage.getItem("facturnow_appearance");
      if (saved) {
        const c = JSON.parse(saved) as {
          name?: string;
          siret?: string;
          address?: string;
          city?: string;
          email?: string;
          zipCode?: string;
        };
        const a = appearance
          ? (JSON.parse(appearance) as { themeColor?: string; companyFont?: string; companyLogo?: string })
          : {};
        enriched = {
          ...purchaseOrder,
          user: {
            ...purchaseOrder.user,
            companyName: c.name ?? null,
            companySiret: c.siret ?? null,
            companyAddress: c.address ?? null,
            companyCity: c.city ?? null,
            companyPostalCode: c.zipCode ?? null,
            companyEmail: c.email ?? null,
            // Les BC ignorent le thème user, mais on garde companyFont/Logo
            companyFont: purchaseOrder.user.companyFont ?? a.companyFont ?? null,
            companyLogo: purchaseOrder.user.companyLogo ?? a.companyLogo ?? null,
          },
        };
      }
    } catch {
      // ignore localStorage errors
    }
  }

  const blob = await pdf(<PurchaseOrderPdfDocument purchaseOrder={enriched} />).toBlob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `bon-commande-${enriched.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
