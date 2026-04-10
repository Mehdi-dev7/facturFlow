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
import { Download, Loader2, AlertCircle, X } from "lucide-react";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Retourne l'élément react-pdf à rendre (appelé à chaque ouverture) */
  getDocument: () => ReactElement;
  filename?: string;
  title?: string;
}

// Hauteur fixe du header en pixels — utilisée pour calculer la hauteur de l'iframe
const HEADER_HEIGHT = 52;

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

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = async () => {
    if (!pdfUrl) return;

    // File System Access API — permet à l'utilisateur de choisir le dossier de destination
    // Supporté sur Chrome/Edge ; fallback <a download> sur Firefox/Safari
    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = await (window as Window & typeof globalThis & {
          showSaveFilePicker: (opts?: unknown) => Promise<FileSystemFileHandle>;
        }).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
        });
        const blob = await fetch(pdfUrl).then((r) => r.blob());
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        // L'utilisateur a annulé la boîte de dialogue → ne rien faire
        if ((err as Error).name === "AbortError") return;
        // Autre erreur → fallback ci-dessous
      }
    }

    // Fallback : téléchargement direct dans le dossier par défaut du navigateur
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        - w-[92vw] max-w-5xl : large sur desktop, quasi plein écran sur mobile
        - h-[78dvh] : hauteur explicite réelle sur laquelle on va calculer l'iframe
        - p-0 overflow-hidden : on gère le layout nous-mêmes
      */}
      <DialogContent
        className="p-0 overflow-hidden flex flex-col gap-0"
        style={{ width: "55vw", maxWidth: "720px", height: "78dvh" }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Header fixe */}
        <div
          className="shrink-0 flex items-center justify-between gap-3 px-4 border-b border-slate-200 dark:border-violet-500/20 bg-white dark:bg-[#1a1438]"
          style={{ height: HEADER_HEIGHT }}
        >
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
            {title}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {pdfUrl && (
              <Button
                size="sm"
                onClick={handleDownload}
                className="gap-1.5 text-xs cursor-pointer bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white"
              >
                <Download size={13} />
                Télécharger
              </Button>
            )}

            {/* Bouton fermer custom */}
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/*
          Zone PDF — hauteur calculée explicitement en CSS pour que l'iframe
          ait une hauteur réelle résolue (évite le bug h-full dans flex).
          calc(78dvh - HEADER_HEIGHT px)
        */}
        <div
          className="w-full bg-slate-100 dark:bg-slate-900/60 relative"
          style={{ height: `calc(78dvh - ${HEADER_HEIGHT}px)` }}
        >
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-violet-300">
              <Loader2 className="animate-spin size-7" />
              <p className="text-sm">Génération du PDF…</p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-rose-500">
              <AlertCircle size={22} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Iframe PDF — #view=FitH force le zoom "fit width" dans Chrome/Edge/Firefox */}
          {pdfUrl && !isLoading && (
            <iframe
              src={`${pdfUrl}#view=FitH&toolbar=0`}
              title={title}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
