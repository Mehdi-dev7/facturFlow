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
import { Printer, Send, Copy, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateQuote } from "@/hooks/use-quotes";
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
        <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold mb-1.5">
          {title}
        </p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {typeConfig.descriptionLabel}
            </th>
            {!isForfait && (
              <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-14">
                {typeConfig.quantityLabel}
              </th>
            )}
            <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">
              {isForfait ? "Montant" : "Prix unit."}
            </th>
            {!isForfait && (
              <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">
                Total HT
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2.5 text-slate-700 dark:text-slate-300">
                {line.description}
              </td>
              {!isForfait && (
                <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                  {line.quantity}
                </td>
              )}
              <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                {fmt(line.unitPrice)} \u20AC
              </td>
              {!isForfait && (
                <td className="py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                  {fmt(line.subtotal)} \u20AC
                </td>
              )}
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td
                colSpan={isForfait ? 2 : 4}
                className="py-6 text-center text-sm text-slate-400 italic"
              >
                Aucune ligne
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
    <div className="bg-white dark:bg-[#1e1a3a] rounded-2xl border border-slate-200 dark:border-violet-500/20 shadow-sm overflow-hidden flex flex-col min-h-[800px]">
      {/* Header vert emeraude */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">DEVIS</h2>
            <p className="text-emerald-200 text-sm mt-0.5">{quote.number}</p>
            {quoteType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[quoteType]}
              </span>
            )}
          </div>
          <div className="text-right text-sm text-emerald-100">
            <p>Date : {formatDate(quote.date)}</p>
            <p>Validit\u00E9 : {formatDate(quote.validUntil)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-5">
        {/* Emetteur / Destinataire */}
        <div className="grid grid-cols-2 gap-6">
          {/* Emetteur */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold">
              \u00C9metteur
            </p>
            {emitter.companyName ? (
              <div className="text-sm space-y-0.5">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {emitter.companyName}
                </p>
                {emitter.companyAddress && (
                  <p className="text-slate-500 dark:text-slate-400">
                    {emitter.companyAddress}
                  </p>
                )}
                {(emitter.companyPostalCode || emitter.companyCity) && (
                  <p className="text-slate-500 dark:text-slate-400">
                    {[emitter.companyPostalCode, emitter.companyCity]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {emitter.companySiret && (
                  <p className="text-slate-500 dark:text-slate-400">
                    SIRET : {emitter.companySiret}
                  </p>
                )}
                {emitter.companyEmail && (
                  <p className="text-slate-500 dark:text-slate-400">
                    {emitter.companyEmail}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Non renseign\u00E9</p>
            )}
          </div>

          {/* Destinataire */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold">
              Destinataire
            </p>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {getClientName(quote.client)}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {quote.client.email}
              </p>
              {quote.client.address && (
                <p className="text-slate-500 dark:text-slate-400">
                  {quote.client.address}
                </p>
              )}
              {(quote.client.postalCode || quote.client.city) && (
                <p className="text-slate-500 dark:text-slate-400">
                  {[quote.client.postalCode, quote.client.city]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-1" />

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

        {/* Spacer : pousse les totaux vers le bas */}
        <div className="flex-1" />

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            {/* Sous-total HT */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Sous-total HT</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(quote.subtotal)} \u20AC
              </span>
            </div>

            {/* Reduction */}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">R\u00E9duction</span>
                <span className="text-rose-600 font-medium">\u2212{fmt(discount)} \u20AC</span>
              </div>
            )}

            {/* TVA */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">TVA ({vatRate}%)</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(quote.taxTotal)} \u20AC
              </span>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

            {/* Total TTC */}
            <div className="flex justify-between text-base font-bold">
              <span className="text-slate-900 dark:text-slate-50">Total TTC</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {fmt(quote.total)} \u20AC
              </span>
            </div>

            {/* Acompte a verser (informatif) */}
            {deposit > 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-emerald-200 dark:border-emerald-500/30 mt-1">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Acompte \u00E0 verser
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {fmt(deposit)} \u20AC
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="rounded-lg bg-slate-50 dark:bg-[#2a2254]/60 border border-slate-100 dark:border-violet-500/20 p-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Notes</p>
            <p className="whitespace-pre-line">{quote.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p>Document g\u00E9n\u00E9r\u00E9 par FacturFlow</p>
        </div>
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
  const duplicateMutation = useDuplicateQuote();

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

  const [isSending, setIsSending] = useState(false);

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
      toast.success(`Devis envoy\u00E9 \u00E0 ${quote.client.email}`);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }

    setIsSending(false);
  }, [quote, isSending]);

  const handleDuplicate = useCallback(() => {
    if (!quote) return;
    duplicateMutation.mutate(quote.id);
  }, [quote, duplicateMutation]);

  const handleEdit = useCallback(() => {
    if (!quote) return;
    router.push(`/dashboard/quotes/${quote.id}/edit`);
    onOpenChange(false);
  }, [quote, router, onOpenChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* Header du modal : titre + bouton fermer + actions */}
        <DialogHeader data-print-hide className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-violet-500/20">
          {/* Premiere ligne : numero de devis + croix */}
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold">
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

          {/* Deuxieme ligne : boutons d'action */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Imprimer */}
            <button
              onClick={handlePrint}
              disabled={!quote}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer size={14} />
              Imprimer
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

            {/* Dupliquer */}
            <button
              onClick={handleDuplicate}
              disabled={!quote || duplicateMutation.isPending}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Copy size={14} />
              {duplicateMutation.isPending ? "Duplication..." : "Dupliquer"}
            </button>

            {/* Editer */}
            <button
              onClick={handleEdit}
              disabled={!quote}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Pencil size={14} />
              \u00C9diter
            </button>
          </div>
        </DialogHeader>

        {/* Corps scrollable : apercu statique du devis */}
        <div id="quote-print-area" className="overflow-y-auto max-h-[70vh] p-6">
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
