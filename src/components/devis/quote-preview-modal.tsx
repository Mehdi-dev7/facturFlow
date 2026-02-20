"use client";
// src/components/devis/quote-preview-modal.tsx
// Modal de prévisualisation d'un devis enregistré avec actions

import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Send, Copy, Pencil, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateQuote, useDeleteQuote } from "@/hooks/use-quotes";
import type { SavedQuote } from "@/hooks/use-quotes";
import { sendQuoteEmail } from "@/lib/actions/send-quote-email";
import {
  INVOICE_TYPE_CONFIG,
  INVOICE_TYPE_LABELS,
  type InvoiceType,
} from "@/lib/validations/invoice";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuotePreviewModalProps {
  quote: SavedQuote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getClientName(client: SavedQuote["client"]) {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

// ─── Sous-composant : tableau de lignes statique ──────────────────────────────

interface StaticLinesTableProps {
  title?: string;
  lines: SavedQuote["lineItems"];
  isForfait: boolean;
  typeConfig: { descriptionLabel: string; quantityLabel: string | null; priceLabel: string };
}

function StaticLinesTable({ title, lines, isForfait, typeConfig }: StaticLinesTableProps) {
  return (
    <div>
      {title && (
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          {title}
        </h3>
      )}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-linear-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
            <tr>
              <th className="text-left p-2 lg:p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                {typeConfig.descriptionLabel}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  {typeConfig.quantityLabel}
                </th>
              )}
              <th className="text-right p-2 lg:p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                {isForfait ? "Montant" : "Prix unit."}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Total HT
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <td className="p-2 lg:p-3 text-xs lg:text-sm text-slate-900 dark:text-slate-50">
                  {line.description}
                </td>
                {!isForfait && (
                  <td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 dark:text-slate-50">
                    {line.quantity}
                  </td>
                )}
                <td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 dark:text-slate-50">
                  {fmt(line.unitPrice)} €
                </td>
                {!isForfait && (
                  <td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {fmt(line.subtotal)} €
                  </td>
                )}
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td
                  colSpan={isForfait ? 2 : 4}
                  className="py-6 text-center text-xs lg:text-sm text-slate-400 italic"
                >
                  Aucune ligne
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sous-composant : aperçu statique complet du devis ───────────────────────

function QuotePreviewStatic({ quote }: { quote: SavedQuote }) {
  // Emetteur : données DB en priorité, sinon fallback localStorage
  const emitter = useMemo(() => {
    if (quote.user.companyName) return quote.user;
    try {
      const saved = localStorage.getItem("facturflow_company");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; siret?: string; address?: string; city?: string; email?: string; zipCode?: string };
        return {
          companyName: c.name ?? null,
          companySiret: c.siret ?? null,
          companyAddress: c.address ?? null,
          companyPostalCode: c.zipCode ?? null,
          companyCity: c.city ?? null,
          companyEmail: c.email ?? null,
        };
      }
    } catch { /* ignore */ }
    return quote.user;
  }, [quote.user]);

  // Config du type de devis (labels colonnes, forfait, etc.)
  const quoteType = (quote.invoiceType ?? "basic") as InvoiceType;
  const typeConfig =
    INVOICE_TYPE_CONFIG[quoteType] ?? INVOICE_TYPE_CONFIG["basic"];

  const isForfait = typeConfig.quantityLabel === null;
  const isArtisan = quoteType === "artisan";

  const discount = quote.discount ?? 0;
  const deposit = quote.depositAmount ?? 0;

  // TVA : 20% par défaut (non stocké dans SavedQuote)
  const vatRate = 20;

  // Lignes triées par ordre
  const sortedLines = [...quote.lineItems].sort((a, b) => a.order - b.order);

  // Split artisan : main d'oeuvre / matériaux
  const mainOeuvreLines = isArtisan
    ? sortedLines.filter((l) => !l.category || l.category === "main_oeuvre")
    : sortedLines;
  const materiauLines = isArtisan
    ? sortedLines.filter((l) => l.category === "materiel")
    : [];

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-sm">
      {/* En-tête du document avec bandeau coloré */}
      <div className="bg-linear-to-r from-emerald-600 to-green-600 dark:from-emerald-500 dark:to-green-500 rounded-lg p-4 text-white mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg md:text-xl font-bold mb-1">
              DEVIS
            </h1>
            <p className="text-white/90 text-xs md:text-sm">
              N° {quote.number}
            </p>
            {quoteType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[quoteType]}
              </span>
            )}
          </div>
          <div className="text-right text-xs md:text-sm">
            <p className="text-white/90">
              Date : {formatDate(quote.date)}
            </p>
            <p className="text-white/90 ">
              Validité : {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>
      </div>

      {/* Émetteur et destinataire */}
      <div className="grid grid-cols-2 gap-6">
          {/* Émetteur */}
          <div>
            <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Émetteur
            </h3>
            {emitter.companyName ? (
              <div className="text-sm space-y-0.5">
                <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
                  {emitter.companyName}
                </p>
                {emitter.companyAddress && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                    {emitter.companyAddress}
                  </p>
                )}
                {(emitter.companyPostalCode || emitter.companyCity) && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                    {[emitter.companyPostalCode, emitter.companyCity]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {emitter.companySiret && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                    SIRET : {emitter.companySiret}
                  </p>
                )}
                {emitter.companyEmail && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                    {emitter.companyEmail}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-xs lg:text-sm italic">
                Informations émetteur manquantes
              </p>
            )}
          </div>

          {/* Destinataire */}
          <div>
            <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Destinataire
            </h3>
            <div className="text-sm space-y-0.5">
              <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
                {getClientName(quote.client)}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {quote.client.email}
              </p>
              {quote.client.address && (
                <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                  {quote.client.address}
                </p>
              )}
              {(quote.client.postalCode || quote.client.city) && (
                <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                  {[quote.client.postalCode, quote.client.city]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />

        {/* Lignes */}
        {isArtisan ? (
          <div className="space-y-4">
            <StaticLinesTable
              title="Main d'\u0153uvre"
              lines={mainOeuvreLines}
              isForfait={false}
              typeConfig={typeConfig}
            />
            {materiauLines.length > 0 && (
              <StaticLinesTable
                title="Mat\u00E9riaux"
                lines={materiauLines}
                isForfait={false}
                typeConfig={typeConfig}
              />
            )}
          </div>
        ) : (
          <StaticLinesTable
            lines={sortedLines}
            isForfait={isForfait}
            typeConfig={typeConfig}
          />
        )}
      <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />
        {/* Spacer : pousse les totaux vers le bas */}
        <div className="flex-1" />

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3">
            {/* Sous-total HT */}
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400">Sous-total HT</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(quote.subtotal)} €
              </span>
            </div>

            {/* Reduction */}
            {discount > 0 && (
              <div className="flex justify-between text-xs lg:text-sm">
                <span className="text-slate-500 dark:text-slate-400">Réduction</span>
                <span className="text-rose-600 font-medium">−{fmt(discount)} €</span>
              </div>
            )}

            {/* TVA */}
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400">TVA ({vatRate}%)</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(quote.taxTotal)} €
              </span>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

            {/* Total TTC */}
            <div className="flex justify-between text-sm lg:text-base font-bold">
              <span className="text-slate-900 dark:text-slate-50">Total TTC</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {fmt(quote.total)} €
              </span>
            </div>

            {/* Acompte a verser (informatif) */}
            {deposit > 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-emerald-200 dark:border-emerald-500/30 mt-1">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Acompte à verser
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {fmt(deposit)} €
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="rounded-lg bg-slate-50 dark:bg-[#1f4a3c]/60 border border-slate-100 dark:border-emerald-500/20 p-3 text-[11px] lg:text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-700 dark:text-slate-200 mb-1 text-xs lg:text-sm">Notes</p>
            <p className="whitespace-pre-line">{quote.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] lg:text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p>Document généré par FacturFlow</p>
        </div>
    </div>
  );
}

// ─── Skeleton de chargement ───────────────────────────────────────────────────

function QuotePreviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal : modal ──────────────────────────────────────────────

export function QuotePreviewModal({
  quote,
  open,
  onOpenChange,
}: QuotePreviewModalProps) {
  const router = useRouter();
  const deleteMutation = useDeleteQuote();

  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Handlers des boutons d'action ──────────────────────────────────────

  const handlePrint = useCallback(() => {
    const printArea = document.getElementById("quote-print-area");
    if (!printArea) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");

    const win = window.open("", "_blank", "width=800,height=1100");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html><head>
  <title>Devis ${quote?.number ?? ""}</title>
  ${styles}
  <style>
    @page { size: A4; margin: 10mm; }
    body { margin: 0; padding: 20px; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .rounded-2xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
    .min-h-\\[800px\\] { min-height: auto !important; }
  </style>
</head>
<body>${printArea.innerHTML}</body></html>`);
    win.document.close();

    win.onload = () => { win.print(); win.close(); };
    setTimeout(() => { try { win.print(); win.close(); } catch { /* already closed */ } }, 1500);
  }, [quote]);

  const handleGeneratePdf = useCallback(async () => {
    if (!quote) return;
    setIsGeneratingPdf(true);
    try {
      // Import dynamique : le module @react-pdf/renderer ne s'exécute qu'au clic
      const { downloadQuotePDF } = await import("@/lib/pdf/quote-pdf");
      await downloadQuotePDF(quote);
      toast.success("PDF téléchargé !");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [quote]);

  const handleSend = useCallback(async () => {
    if (!quote || isSending) return;
    setIsSending(true);

    // Recuperer les infos emetteur depuis localStorage en fallback
    let emitterFallback: Record<string, string> | undefined;
    try {
      const saved = localStorage.getItem("facturflow_company");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; siret?: string; address?: string; city?: string; email?: string; zipCode?: string };
        emitterFallback = {
          companyName: c.name ?? "",
          companySiret: c.siret ?? "",
          companyAddress: c.address ?? "",
          companyPostalCode: c.zipCode ?? "",
          companyCity: c.city ?? "",
          companyEmail: c.email ?? "",
        };
      }
    } catch { /* ignore */ }

    const result = await sendQuoteEmail(quote.id, emitterFallback);

    if (result.success) {
      toast.success(`Devis envoyé à ${quote.client.email}`);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }

    setIsSending(false);
  }, [quote, isSending]);


  const handleEdit = useCallback(() => {
    if (!quote) return;
    router.push(`/dashboard/quotes/${quote.id}/edit`);
    onOpenChange(false);
  }, [quote, router, onOpenChange]);

  const handleDelete = useCallback(async () => {
    if (!quote || isDeleting) return;
    
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le devis ${quote.number} ?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(quote.id);
      onOpenChange(false); // Fermer la modal après suppression
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [quote, isDeleting, deleteMutation, onOpenChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] h-[90vh] sm:w-[90vw] sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-5xl bg-linear-to-b from-emerald-50 via-white to-white dark:from-[#1f4a3c] dark:via-[#1a3d35] dark:to-[#1a3d35] border border-primary/20 dark:border-emerald-400/25 shadow-lg dark:shadow-emerald-950/40 rounded-xl overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* Header du modal : titre + bouton fermer + actions */}
        <DialogHeader data-print-hide className="px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-5 pb-2 sm:pb-3 md:pb-4 border-b border-slate-200 dark:border-emerald-500/20">
          {/* Premiere ligne : numero de devis + croix */}
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold mx-2 md:mx-0">
              {quote ? quote.number : "Devis"}
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Deuxième ligne : boutons d'action responsive */}
          <div className="mt-3 mx-2 md:mx-0">
            {/* Version mobile : logos en haut, supprimer à droite, envois en bas */}
            <div className="block md:hidden">
              {/* Ligne 1 : Logos + Supprimer à droite */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  {/* Imprimer - Logo seul */}
                  <button
                    onClick={handlePrint}
                    disabled={!quote}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Printer size={16} />
                  </button>

                  {/* PDF - Logo seul */}
                  <button
                    onClick={handleGeneratePdf}
                    disabled={!quote || isGeneratingPdf}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download size={16} />
                  </button>

                  {/* Éditer - Logo seul */}
                  <button
                    onClick={handleEdit}
                    disabled={!quote}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Supprimer - Seul à droite */}
                <button
                  onClick={handleDelete}
                  disabled={!quote || isDeleting}
                  className="rounded-lg border p-2 text-sm font-medium transition-colors border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Ligne 2 : Boutons d'envoi avec texte */}
              <div className="flex flex-wrap gap-2">
                {/* Envoyer */}
                <button
                  onClick={handleSend}
                  disabled={!quote || isSending}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={14} />
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </div>

            {/* Version desktop : boutons principaux + supprimer isolé à droite */}
            <div className="hidden md:flex items-center justify-between">
              {/* Boutons principaux à gauche */}
              <div className="flex flex-wrap gap-2">
                {/* Imprimer */}
                <button
                  onClick={handlePrint}
                  disabled={!quote}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Printer size={14} />
                  Imprimer
                </button>

                {/* Télécharger PDF */}
                <button
                  onClick={handleGeneratePdf}
                  disabled={!quote || isGeneratingPdf}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download size={14} />
                  {isGeneratingPdf ? "..." : "PDF"}
                </button>

                {/* Éditer */}
                <button
                  onClick={handleEdit}
                  disabled={!quote}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Pencil size={14} />
                  Éditer
                </button>

                {/* Envoyer */}
                <button
                  onClick={handleSend}
                  disabled={!quote || isSending}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={14} />
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>
              </div>

              {/* Supprimer isolé à droite */}
              <button
                onClick={handleDelete}
                disabled={!quote || isDeleting}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={14} />
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Corps scrollable : aperçu statique du devis */}
        <div id="quote-print-area" className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[80vh] md:max-h-[70vh] p-2 sm:p-4 md:p-6">
          {quote ? (
            <QuotePreviewStatic quote={quote} />
          ) : (
            <QuotePreviewSkeleton />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
