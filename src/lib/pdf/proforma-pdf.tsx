// Helper de téléchargement PDF pour les proformas
// Réutilise InvoicePdfDocument avec documentLabel="PROFORMA"

import { pdf } from "@react-pdf/renderer";
import type { SavedInvoice } from "@/lib/actions/invoices";
import InvoicePdfDocument from "./invoice-pdf-document";

export async function downloadProformaPDF(proforma: SavedInvoice) {
  const blob = await pdf(
    <InvoicePdfDocument invoice={proforma} documentLabel="PROFORMA" />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proforma.number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
