"use client";
// Helper de téléchargement PDF pour les proformas
// Réutilise InvoicePdfDocument avec documentLabel="PROFORMA"

import { pdf } from "@react-pdf/renderer";
import type { SavedInvoice } from "@/lib/actions/invoices";
import InvoicePdfDocument from "./invoice-pdf-document";

export async function downloadProformaPDF(proforma: SavedInvoice) {
  try {
    const blob = await pdf(
      <InvoicePdfDocument invoice={proforma} documentLabel="PROFORMA" />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proforma.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[PDF] Erreur génération proforma:", err);
    const { toast } = await import("sonner");
    toast.error("Impossible de générer le PDF. Réessayez.");
    throw err;
  }
}
