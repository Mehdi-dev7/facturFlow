"use client";
// src/components/shared/pdf-preview-modal.tsx
// Modal générique d'aperçu PDF — utilisée sur toutes les pages de création

import { useState, useEffect, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Retourne l'élément react-pdf à rendre (appelé à chaque ouverture) */
  getDocument: () => ReactElement;
  filename?: string;
  title?: string;
}

export function PdfPreviewModal({
  open,
  onOpenChange,
  getDocument,
  filename = "document.pdf",
  title = "Aperçu PDF",
}: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Génère le PDF à chaque ouverture, révoque l'URL à la fermeture
  useEffect(() => {
    if (!open) {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const { pdf } = await import("@react-pdf/renderer");
        const element = getDocument();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = await pdf(element as any).toBlob();
        if (!cancelled) setPdfUrl(URL.createObjectURL(blob));
      } catch (err) {
        if (!cancelled) {
          console.error("[PdfPreviewModal]", err);
          setError("Impossible de générer l'aperçu PDF.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // volontairement limité à `open` — on régénère à chaque ouverture

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90dvh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-violet-500/20 bg-white/90 dark:bg-[#1a1438] shrink-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
            {title}
          </p>
          {pdfUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Download size={13} />
              Télécharger
            </Button>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900/60">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 dark:text-violet-300">
              <Loader2 className="animate-spin size-7" />
              <p className="text-sm">Génération du PDF…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-rose-500">
              <AlertCircle size={22} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {pdfUrl && !isLoading && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
