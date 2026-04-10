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
import { Printer, Download, Send, Pencil, X, Trash2, FileText } from "lucide-react";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateQuote, useDeleteQuote } from "@/hooks/use-quotes";
import type { SavedQuote } from "@/hooks/use-quotes";
import { sendQuoteEmail } from "@/lib/actions/send-quote-email";
import { createInvoiceFromQuote } from "@/lib/actions/invoices";
import {
  INVOICE_TYPE_CONFIG,
  INVOICE_TYPE_LABELS,
  type InvoiceType,
} from "@/lib/validations/invoice";
import { getFontFamily, getFontWeight } from "@/components/appearance/theme-config";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuotePreviewModalProps {
  quote: SavedQuote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency?: string | null) {
  return formatCurrency(n, currency);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
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
  themeColor: string;
  currency?: string | null;
}

function StaticLinesTable({ title, lines, isForfait, typeConfig, themeColor, currency }: StaticLinesTableProps) {
  return (
    <div>
      {title && (
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
          {title}
        </h3>
      )}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead style={{ backgroundColor: themeColor + "1a" }}>
            <tr>
              <th className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: themeColor }}>
                {typeConfig.descriptionLabel}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: themeColor }}>
                  {typeConfig.quantityLabel}
                </th>
              )}
              <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: themeColor }}>
                {isForfait ? "Montant" : "Prix unit."}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: themeColor }}>
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
                  {fmt(line.unitPrice, currency)}
                </td>
                {!isForfait && (
                  <td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium" style={{ color: themeColor }}>
                    {fmt(line.subtotal, currency)}
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
      const saved = localStorage.getItem("facturnow_company");
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

  // Couleur thème dynamique
  const themeColor = quote.user.themeColor ?? "#7c3aed";
  const logo = quote.user.companyLogo;
  const displayName = quote.user.companyName ?? "";
  const companyFont = quote.user.companyFont ?? "inter";
  const fontFamily = getFontFamily(companyFont);
  const fontWeight = getFontWeight(companyFont);

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-sm">
      {/* En-tête 3 colonnes : type+N° | logo+nom centré | dates à droite */}
      <div className="rounded-lg p-4 text-white mb-6" style={{ backgroundColor: themeColor }}>
        <div className="flex items-start gap-4">
          {/* Gauche : DEVIS + N° */}
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold mb-1">DEVIS</h1>
            <p className="text-white/90 text-xs md:text-sm">N° {quote.number}</p>
            {quoteType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[quoteType]}
              </span>
            )}
          </div>
          {/* Centre : logo circulaire + nom entreprise */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            {logo && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            {displayName && (
              <p className="text-white/90 text-sm font-bold text-center" style={{ fontFamily, fontWeight }}>{displayName}</p>
            )}
          </div>
          {/* Droite : dates */}
          <div className="flex-1 flex flex-col items-end text-right text-xs md:text-sm">
            <p className="text-white/90">Date : {formatDate(quote.date)}</p>
            <p className="text-white/90">Validité : {formatDate(quote.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Émetteur et destinataire */}
      <div className="grid grid-cols-2 gap-6">
          {/* Émetteur */}
          <div>
            <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
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
            <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
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
              title="Main d'œuvre"
              lines={mainOeuvreLines}
              isForfait={false}
              typeConfig={typeConfig}
              themeColor={themeColor}
            />
            {materiauLines.length > 0 && (
              <StaticLinesTable
                title="Matériaux"
                lines={materiauLines}
                isForfait={false}
                typeConfig={typeConfig}
                themeColor={themeColor}
              />
            )}
          </div>
        ) : (
          <StaticLinesTable
            lines={sortedLines}
            isForfait={isForfait}
            typeConfig={typeConfig}
            themeColor={themeColor}
          />
        )}
      <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />
        {/* Spacer : pousse les totaux vers le bas */}
        <div className="flex-1" />

        {/* Totaux */}
        <div className="flex justify-end">
          <div
            className="w-64 space-y-1.5 rounded-lg p-3 border"
            style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
          >
            {/* Sous-total HT */}
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400">Sous-total HT</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(quote.subtotal, quote.user.currency)}
              </span>
            </div>

            {/* Reduction */}
            {discount > 0 && (
              <div className="flex justify-between text-xs lg:text-sm">
                <span className="text-slate-500 dark:text-slate-400">Réduction</span>
                <span className="text-rose-600 font-medium">−{fmt(discount, quote.user.currency)}</span>
              </div>
            )}

            {/* TVA */}
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400">TVA ({vatRate}%)</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(quote.taxTotal, quote.user.currency)}
              </span>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

            {/* Total TTC */}
            <div className="flex justify-between text-sm lg:text-base font-bold">
              <span className="text-slate-900 dark:text-slate-50">Total TTC</span>
              <span style={{ color: themeColor }}>
                {fmt(quote.total, quote.user.currency)}
              </span>
            </div>

            {/* Acompte a verser (informatif) */}
            {deposit > 0 && (
              <div
                className="flex justify-between text-sm pt-1 mt-1"
                style={{ borderTop: `1px solid ${themeColor}33` }}
              >
                <span className="font-medium" style={{ color: themeColor }}>
                  Acompte à verser
                </span>
                <span className="font-bold" style={{ color: themeColor }}>
                  {fmt(deposit, quote.user.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-3 text-[11px] lg:text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium mb-1 text-xs lg:text-sm" style={{ color: themeColor }}>Notes</p>
            <p className="whitespace-pre-line">{quote.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] lg:text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p>Document généré par FacturNow</p>
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
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
      const saved = localStorage.getItem("facturnow_company");
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


  const handleCreateInvoice = useCallback(async () => {
    if (!quote || isCreatingInvoice) return;
    setIsCreatingInvoice(true);
    try {
      const result = await createInvoiceFromQuote(quote.id);
      if (result.success && result.data) {
        toast.success(`Facture ${result.data.number} créée !`);
        onOpenChange(false);
        router.push(`/dashboard/invoices?preview=${result.data.id}`);
      } else {
        toast.error((result as { error?: string }).error ?? "Erreur lors de la création");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [quote, isCreatingInvoice, router, onOpenChange]);

  const handleEdit = useCallback(() => {
    if (!quote) return;
    router.push(`/dashboard/quotes/${quote.id}/edit`);
    onOpenChange(false);
  }, [quote, router, onOpenChange]);

  // Ferme la preview puis ouvre la modale de confirmation (évite la double fenêtre)
  const handleDelete = useCallback(() => {
    if (!quote) return;
    onOpenChange(false);
    setDeleteConfirmOpen(true);
  }, [quote, onOpenChange]);

  // Exécute la suppression après confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!quote || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(quote.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [quote, isDeleting, deleteMutation, onOpenChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] h-[90vh] sm:w-[90vw] sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-5xl bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
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
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={14} />
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>

                {/* Créer la facture — visible uniquement si devis accepté */}
                {quote?.status === "ACCEPTED" && (
                  <button
                    onClick={handleCreateInvoice}
                    disabled={isCreatingInvoice}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FileText size={14} />
                    {isCreatingInvoice ? "Création..." : "Créer la facture"}
                  </button>
                )}
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
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={14} />
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>

                {/* Créer la facture — visible uniquement si devis accepté */}
                {quote?.status === "ACCEPTED" && (
                  <button
                    onClick={handleCreateInvoice}
                    disabled={isCreatingInvoice}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FileText size={14} />
                    {isCreatingInvoice ? "Création..." : "Créer la facture"}
                  </button>
                )}
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
        <div id="quote-print-area" className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[80vh] md:max-h-[70vh] p-2 xs:p-3 md:p-5">
          {quote ? (
            <QuotePreviewStatic quote={quote} />
          ) : (
            <QuotePreviewSkeleton />
          )}
        </div>
      </DialogContent>

    </Dialog>

    {/* Modale de confirmation de suppression — hors du Dialog pour éviter les conflits de z-index */}
    <DeleteConfirmModal
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      onConfirm={handleConfirmDelete}
      isDeleting={isDeleting}
      documentLabel="le devis"
      documentNumber={quote?.number ?? ""}
    />
    </>
  );
}
