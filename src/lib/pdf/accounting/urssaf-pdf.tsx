"use client";
// src/lib/pdf/accounting/urssaf-pdf.tsx
// Wrapper client — génère et télécharge le PDF URSSAF dans le navigateur

import { pdf } from "@react-pdf/renderer";
import UrssafPdfDocument from "./urssaf-pdf-document";
import type { UrssafPdfData } from "@/lib/actions/accounting";

export async function downloadUrssafPdf(data: UrssafPdfData) {
  const blob = await pdf(<UrssafPdfDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `urssaf-${data.year}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
