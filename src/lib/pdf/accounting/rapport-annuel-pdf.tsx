"use client";
// src/lib/pdf/accounting/rapport-annuel-pdf.tsx
// Wrapper client — génère et télécharge le PDF Rapport Annuel dans le navigateur

import { pdf } from "@react-pdf/renderer";
import RapportAnnuelPdfDocument from "./rapport-annuel-pdf-document";
import type { AnnualReportPdfData } from "@/lib/actions/accounting";

export async function downloadRapportAnnuelPdf(data: AnnualReportPdfData) {
  const blob = await pdf(<RapportAnnuelPdfDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-annuel-${data.year}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
