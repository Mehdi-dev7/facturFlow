"use client";
// src/components/factures/bc-import-dialog.tsx
// Dialog drag & drop pour importer un bon de commande externe.
// L'IA (Claude) extrait les données du PDF et les stocke dans localStorage
// pour pré-remplir le formulaire de création de facture.

import { useState, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Building2,
  CalendarDays,
  Hash,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BcExtractedData {
  bcReference: string | null;
  clientName: string | null;
  clientAddress: string | null;
  clientSiret: string | null;
  clientEmail: string | null;
  date: string | null;
  dueDate: string | null;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }[];
  notes: string | null;
}

export const BC_IMPORT_LS_KEY = "bc_import_data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

type Step = "upload" | "loading" | "preview" | "upgrade";

// ─── Composant ────────────────────────────────────────────────────────────────

export function BcImportDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputId = useId();

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<BcExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset à la fermeture ────────────────────────────────────────────────────

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setStep("upload");
        setSelectedFile(null);
        setExtracted(null);
        setError(null);
        setIsDragging(false);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  // ─── Gestion fichier ─────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const accepted = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!accepted.includes(file.type)) {
      setError("Format non supporté. Utilisez PDF, PNG ou JPG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 10 MB).");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setStep("loading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-bc", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (res.status === 403) {
        setStep("upgrade");
        return;
      }

      if (!res.ok || !json.success) {
        setError(json.error ?? "Erreur lors de l'extraction.");
        setStep("upload");
        return;
      }

      setExtracted(json.data as BcExtractedData);
      setStep("preview");
    } catch {
      setError("Impossible de contacter le serveur.");
      setStep("upload");
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ─── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ─── Créer la facture ────────────────────────────────────────────────────────

  const handleCreateInvoice = useCallback(() => {
    if (!extracted) return;
    // Stockage en localStorage pour récupérer dans le formulaire
    localStorage.setItem(BC_IMPORT_LS_KEY, JSON.stringify(extracted));
    handleOpenChange(false);
    router.push("/dashboard/invoices/new?from=bc");
    toast.success("Données importées — vérifiez le formulaire avant de sauvegarder.");
  }, [extracted, handleOpenChange, router]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50 rounded-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-500 shrink-0" />
            Importer un bon de commande
          </DialogTitle>
          <DialogDescription className="text-xs xs:text-sm">
            Uploadez le PDF ou l&apos;image d&apos;un BC reçu d&apos;un client — l&apos;IA extrait les
            informations et pré-remplit votre facture.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2 dark:bg-violet-500/20" />

        {/* ── Étape 1 : Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Zone drag & drop */}
            <label
              htmlFor={inputId}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                isDragging
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                  : "border-slate-300 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="rounded-full bg-violet-100 dark:bg-violet-900/40 p-3">
                <Upload className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Glissez le fichier ici
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ou cliquez pour choisir un fichier
                </p>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                PDF, PNG, JPG — max 10 MB
              </p>
            </label>
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={handleInputChange}
            />

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Info plan */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              Fonctionnalité réservée au plan{" "}
              <span className="font-semibold text-violet-500">Business</span>
            </p>
          </div>
        )}

        {/* ── Étape upgrade : plan non Business ── */}
        {step === "upgrade" && (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="rounded-full bg-violet-100 dark:bg-violet-900/40 p-4">
              <Sparkles className="h-8 w-8 text-violet-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Fonctionnalité réservée au plan Business
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                L&apos;import de bons de commande externes est disponible à partir du plan <strong>Business à 20€/mois</strong>.
              </p>
            </div>
            <Button
              size="sm"
              className="cursor-pointer bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              onClick={() => {
                handleOpenChange(false);
                router.push("/dashboard/subscription");
              }}
            >
              Passer au plan Business
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Étape 2 : Chargement ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-5 py-8">
            <div className="relative">
              <div className="rounded-full bg-violet-100 dark:bg-violet-900/40 p-5">
                <FileText className="h-8 w-8 text-violet-500" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-violet-500 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Extraction en cours…
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                L&apos;IA analyse {selectedFile?.name} — quelques secondes
              </p>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Aperçu des données extraites ── */}
        {step === "preview" && extracted && (
          <div className="space-y-4">
            {/* Badge succès */}
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Données extraites — vérifiez avant de créer la facture
            </div>

            {/* Infos générales */}
            <div className="rounded-xl border border-slate-200 dark:border-violet-500/20 bg-white/60 dark:bg-violet-950/20 divide-y divide-slate-100 dark:divide-violet-500/10">
              {/* Référence BC */}
              {extracted.bcReference && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Hash className="h-4 w-4 text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Référence BC</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {extracted.bcReference}
                    </p>
                  </div>
                </div>
              )}

              {/* Client */}
              {extracted.clientName && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Building2 className="h-4 w-4 text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Client</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {extracted.clientName}
                    </p>
                    {extracted.clientSiret && (
                      <p className="text-xs text-slate-400">SIRET : {extracted.clientSiret}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              {(extracted.date || extracted.dueDate) && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <CalendarDays className="h-4 w-4 text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0 flex gap-4">
                    {extracted.date && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Date</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {new Date(extracted.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    )}
                    {extracted.dueDate && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Échéance</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {new Date(extracted.dueDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lignes */}
            {extracted.lines.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {extracted.lines.length} ligne{extracted.lines.length > 1 ? "s" : ""} détectée{extracted.lines.length > 1 ? "s" : ""}
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-violet-500/20 overflow-hidden">
                  {extracted.lines.map((line, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i !== extracted.lines.length - 1
                          ? "border-b border-slate-100 dark:border-violet-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs xs:text-sm text-slate-700 dark:text-slate-200 truncate">
                          {line.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          {line.quantity} × {line.unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                        </p>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          TVA {line.vatRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avertissement données manquantes */}
            {(!extracted.clientName || extracted.lines.length === 0) && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Certaines données n&apos;ont pas pu être extraites — complétez le formulaire.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setStep("upload");
                  setSelectedFile(null);
                  setExtracted(null);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Recommencer
              </Button>
              <Button
                size="sm"
                className="flex-1 cursor-pointer bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                onClick={handleCreateInvoice}
              >
                Créer la facture
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
