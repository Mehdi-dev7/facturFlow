"use client";
// src/components/factures/bc-import-dialog.tsx
// Dialog drag & drop pour importer un bon de commande externe.
// Dialog 1 : upload + chargement | Dialog 2 : aperçu des données extraites
// L'IA (Claude) extrait les données du PDF et les stocke dans localStorage
// pour pré-remplir le formulaire de création de facture.

import { useState, useRef, useCallback, useId, useEffect } from "react";
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
import { createClientFromBcData } from "@/lib/actions/clients";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BcExtractedData {
  bcReference: string | null;
  clientName: string | null;
  clientAddress: string | null;
  clientCity: string | null;
  clientSiret: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  date: string | null;
  dueDate: string | null;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }[];
  notes: string | null;
  // Rempli automatiquement si le client est créé en DB lors de l'import
  clientId?: string;
}

export const BC_IMPORT_LS_KEY = "bc_import_data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStep = "upload" | "loading" | "upgrade";

// ─── Dialog 2 : Aperçu des données extraites ─────────────────────────────────

interface PreviewDialogProps {
  open: boolean;
  extracted: BcExtractedData;
  onClose: () => void;
  onRestart: () => void;
}

function BcPreviewDialog({ open, extracted, onClose, onRestart }: PreviewDialogProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreateInvoice = useCallback(async () => {
    setCreating(true);
    let finalData = { ...extracted };

    // Si un client est identifié → le créer en DB silencieusement avant d'ouvrir le formulaire
    if (extracted.clientName) {
      const result = await createClientFromBcData({
        clientName: extracted.clientName,
        clientAddress: extracted.clientAddress,
        clientCity: extracted.clientCity ?? null,
        clientSiret: extracted.clientSiret,
        clientEmail: extracted.clientEmail,
        clientPhone: extracted.clientPhone ?? null,
      });
      if (result.success) {
        finalData = { ...finalData, clientId: result.clientId };
      }
    }

    localStorage.setItem(BC_IMPORT_LS_KEY, JSON.stringify(finalData));
    onClose();
    router.push("/dashboard/invoices/new?from=bc");
    toast.success("Données importées — vérifiez le formulaire avant de sauvegarder.");
  }, [extracted, onClose, router]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-4xl max-h-[90dvh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50 rounded-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base mt-5 xs:mt-0 xs:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            Données extraites
          </DialogTitle>
          <DialogDescription className="text-xs xs:text-sm text-slate-500 dark:text-slate-400">
            Vérifiez les informations avant de créer la facture — vous pourrez les modifier dans le formulaire.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2 dark:bg-violet-500/20" />

        <div className="space-y-4">
          {/* Badge succès */}
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Extraction réussie — vérifiez avant de créer la facture
          </div>

          {/* Infos générales */}
          <div className="rounded-xl border border-slate-200 dark:border-violet-500/20 bg-white/60 dark:bg-violet-950/20 divide-y divide-slate-100 dark:divide-violet-500/10">
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

            {(extracted.date || extracted.dueDate) && (
              <div className="flex items-center gap-3 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-violet-500 shrink-0" />
                <div className="flex-1 min-w-0 flex flex-wrap gap-4">
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
              <div className="rounded-xl border border-slate-200 dark:border-violet-500/20 divide-y divide-slate-100 dark:divide-violet-500/10">
                {extracted.lines.map((line, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs xs:text-sm text-slate-700 dark:text-slate-200">
                        {line.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right space-y-0.5">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {line.quantity} × {line.unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </p>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-white">
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

          {/* Message info : client sera créé automatiquement */}
          {extracted.clientName && (
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700/40 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-semibold">{extracted.clientName}</span> sera automatiquement ajouté à vos clients.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col xs:flex-row gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={creating}
              className="cursor-pointer border-slate-300 dark:border-violet-500/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-violet-900/30"
              onClick={onRestart}
            >
              <X className="h-4 w-4 mr-1" />
              Recommencer
            </Button>
            <Button
              size="sm"
              disabled={creating}
              className="flex-1 cursor-pointer bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white disabled:opacity-70"
              onClick={handleCreateInvoice}
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Création en cours…
                </>
              ) : (
                <>
                  Créer la facture
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog 1 : Upload + Chargement ──────────────────────────────────────────

export function BcImportDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputId = useId();

  const [step, setStep] = useState<UploadStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<BcExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pagesLeft, setPagesLeft] = useState<number | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showRetryHint, setShowRetryHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Messages cycliques pendant le chargement
  const LOADING_MESSAGES = [
    "Analyse du document…",
    "Extraction des infos client…",
    "Extraction des prestations…",
    "Préparation des données…",
  ];

  // Cycle les messages toutes les 3.5s, affiche le hint de retry après 9s
  useEffect(() => {
    if (step !== "loading") {
      setLoadingMsgIndex(0);
      setShowRetryHint(false);
      return;
    }
    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 3500);
    const retryTimeout = setTimeout(() => setShowRetryHint(true), 9000);
    return () => {
      clearInterval(msgInterval);
      clearTimeout(retryTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ─── Reset complet ───────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setStep("upload");
    setSelectedFile(null);
    setExtracted(null);
    setError(null);
    setIsDragging(false);
    setShowPreview(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetAll();
      onOpenChange(open);
    },
    [onOpenChange, resetAll]
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

    // AbortController pour pouvoir annuler la requête via la croix
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/extract-bc", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const json = await res.json();

      if (res.status === 403) {
        setStep("upgrade");
        return;
      }

      if (res.status === 402 || json.error === "quota_exceeded") {
        setError("quota_exceeded");
        setStep("upload");
        return;
      }

      if (!res.ok || !json.success) {
        const errorMsg =
          json.error === "overloaded"
            ? json.message
            : (json.error ?? "Erreur lors de l'extraction.");
        setError(errorMsg);
        setStep("upload");
        return;
      }

      // Extraction réussie → fermer dialog 1, ouvrir dialog 2
      setExtracted(json.data as BcExtractedData);
      if (json.pagesLeft !== undefined) setPagesLeft(json.pagesLeft as number);
      onOpenChange(false);
      setStep("upload");
      setShowPreview(true);
    } catch (err) {
      // Annulation volontaire → pas d'erreur affichée
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Impossible de contacter le serveur.");
      setStep("upload");
    }
  }, [onOpenChange]);

  // ─── Annulation pendant le chargement ────────────────────────────────────────

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    resetAll();
  }, [resetAll]);

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

  // ─── Recommencer depuis la preview ───────────────────────────────────────────

  const handleRestart = useCallback(() => {
    resetAll();
    onOpenChange(true);
  }, [resetAll, onOpenChange]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Dialog 1 : Upload / Loading / Upgrade ── */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50 rounded-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => { if (step === "loading") e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (step === "loading") e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle className="text-base mt-5 xs:mt-0 xs:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FileText className="h-5 w-5 text-violet-500 shrink-0" />
              Importer un bon de commande
            </DialogTitle>
            <DialogDescription className="text-xs xs:text-sm text-slate-500 dark:text-slate-400">
              Uploadez le PDF ou l&apos;image d&apos;un BC reçu d&apos;un client — l&apos;IA extrait les
              informations et pré-remplit votre facture.
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-2 dark:bg-violet-500/20" />

          {/* Upload */}
          {step === "upload" && (
            <div className="space-y-4">
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

              {error === "quota_exceeded" ? (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Quota de pages épuisé.{" "}
                    <button
                      className="underline font-medium cursor-pointer"
                      onClick={() => { handleOpenChange(false); router.push("/dashboard/subscription"); }}
                    >
                      Recharger depuis Abonnement →
                    </button>
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              ) : null}

            {/* Avertissement pages restantes faibles */}
            {pagesLeft !== null && pagesLeft <= 20 && pagesLeft > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Plus que <span className="font-semibold">{pagesLeft} pages</span> disponibles ce mois.{" "}
                  <button
                    className="underline font-medium cursor-pointer"
                    onClick={() => { handleOpenChange(false); router.push("/dashboard/subscription"); }}
                  >
                    Recharger depuis Abonnement →
                  </button>
                </span>
              </div>
            )}

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Fonctionnalité réservée au plan{" "}
                <span className="font-semibold text-violet-500">Business</span>
              </p>
            </div>
          )}

          {/* Chargement */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center gap-6 py-12 opacity-90">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-4 border-violet-200 dark:border-violet-800/50 border-t-violet-500 dark:border-t-violet-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-violet-500 dark:text-violet-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Extraction en cours…
                </p>
                {/* Message cyclique */}
                <p className="text-xs text-violet-500 dark:text-violet-400 transition-opacity duration-500">
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {selectedFile?.name}
                </p>
                {/* Hint discret si retry en cours (après 9s) */}
                {showRetryHint && (
                  <p className="text-[10px] italic text-slate-400 dark:text-slate-500 mt-1">
                    Nouvelle tentative — serveur saturé
                  </p>
                )}
              </div>
              {/* Bouton annuler — seul moyen de fermer pendant le chargement */}
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                onClick={handleCancel}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Annuler
              </Button>
            </div>
          )}

          {/* Upgrade */}
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
                  L&apos;import de bons de commande externes est disponible à partir du plan{" "}
                  <strong>Business à 20€/mois</strong>.
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
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2 : Aperçu des données extraites ── */}
      {extracted && (
        <BcPreviewDialog
          open={showPreview}
          extracted={extracted}
          onClose={resetAll}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}
