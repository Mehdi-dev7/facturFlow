"use client";
// src/components/factures/invoice-preview-modal.tsx
// Modal de prévisualisation d'une facture enregistrée avec 5 actions

import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Send, Copy, Pencil, X, FileCheck2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateInvoice } from "@/hooks/use-invoices";
import type { SavedInvoice } from "@/lib/actions/invoices";
import { sendInvoiceEmail } from "@/lib/actions/send-invoice-email";
import { sendEInvoice } from "@/lib/actions/send-einvoice";
import { getEInvoiceStatusLabel } from "@/lib/superpdp";
import {
  INVOICE_TYPE_CONFIG,
  INVOICE_TYPE_LABELS,
  type InvoiceType,
} from "@/lib/validations/invoice";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePreviewModalProps {
  invoice: SavedInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formate un nombre en style français : "1 234,56" */
function fmt(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formate une date ISO en "15 janvier 2025" */
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Résout le nom d'affichage du client */
function getClientName(client: SavedInvoice["client"]) {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

// ─── Sous-composant : tableau de lignes statique ──────────────────────────────

interface StaticLinesTableProps {
  title?: string;
  lines: SavedInvoice["lineItems"];
  isForfait: boolean;
  typeConfig: { descriptionLabel: string; quantityLabel: string | null; priceLabel: string };
}

function StaticLinesTable({ title, lines, isForfait, typeConfig }: StaticLinesTableProps) {
  return (
    <div>
      {title && (
        <p className="text-[10px] uppercase tracking-wider text-violet-500 font-semibold mb-1.5">
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
                {fmt(line.unitPrice)} €
              </td>
              {!isForfait && (
                <td className="py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                  {fmt(line.subtotal)} €
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

// ─── Sous-composant : aperçu statique complet de la facture ───────────────────

function InvoicePreviewStatic({ invoice }: { invoice: SavedInvoice }) {
  // Émetteur : données DB en priorité, sinon fallback localStorage
  const emitter = useMemo(() => {
    if (invoice.user.companyName) return invoice.user;
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
    return invoice.user;
  }, [invoice.user]);

  // Config du type de facture (labels colonnes, forfait, etc.)
  const invoiceType = (invoice.invoiceType ?? "basic") as InvoiceType;
  const typeConfig =
    INVOICE_TYPE_CONFIG[invoiceType] ?? INVOICE_TYPE_CONFIG["basic"];

  const isForfait = typeConfig.quantityLabel === null;
  const isArtisan = invoiceType === "artisan";

  const discount = invoice.discount ?? 0;
  const deposit = invoice.depositAmount ?? 0;
  const netAPayer = invoice.total - deposit;

  // TVA issue du businessMetadata ou 20% par défaut
  const vatRate = (invoice.businessMetadata?.vatRate as number) ?? 20;

  // Liens de paiement stockés dans businessMetadata
  const paymentLinks = invoice.businessMetadata?.paymentLinks as
    | { stripe?: string; paypal?: string; gocardless?: string }
    | undefined;

  // Lignes triées par ordre
  const sortedLines = [...invoice.lineItems].sort((a, b) => a.order - b.order);

  // Split artisan : main d'œuvre / matériaux
  const mainOeuvreLines = isArtisan
    ? sortedLines.filter((l) => !l.category || l.category === "main_oeuvre")
    : sortedLines;
  const materiauLines = isArtisan
    ? sortedLines.filter((l) => l.category === "materiel")
    : [];

  return (
    <div className="bg-white dark:bg-[#1e1a3a] rounded-2xl border border-slate-200 dark:border-violet-500/20 shadow-sm overflow-hidden flex flex-col min-h-[800px]">
      {/* ── Header violet ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">FACTURE</h2>
            <p className="text-violet-200 text-sm mt-0.5">{invoice.number}</p>
            {invoiceType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[invoiceType]}
              </span>
            )}
          </div>
          <div className="text-right text-sm text-violet-100">
            <p>Date : {formatDate(invoice.date)}</p>
            <p>Échéance : {formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-5">
        {/* ── Émetteur / Destinataire ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Émetteur */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold">
              Émetteur
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
              <p className="text-xs text-slate-400 italic">Non renseigné</p>
            )}
          </div>

          {/* Destinataire */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold">
              Destinataire
            </p>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {getClientName(invoice.client)}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {invoice.client.email}
              </p>
              {invoice.client.address && (
                <p className="text-slate-500 dark:text-slate-400">
                  {invoice.client.address}
                </p>
              )}
              {(invoice.client.postalCode || invoice.client.city) && (
                <p className="text-slate-500 dark:text-slate-400">
                  {[invoice.client.postalCode, invoice.client.city]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
              {invoice.client.companySiret && (
                <p className="text-slate-500 dark:text-slate-400">
                  SIRET : {invoice.client.companySiret}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-1" />

        {/* ── Lignes ────────────────────────────────────────────────── */}
        {isArtisan ? (
          <div className="space-y-4">
            <StaticLinesTable
              title="Main d'œuvre"
              lines={mainOeuvreLines}
              isForfait={false}
              typeConfig={typeConfig}
            />
            {materiauLines.length > 0 && (
              <StaticLinesTable
                title="Matériaux"
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

        {/* Spacer : pousse les totaux vers le bas de la page A4 */}
        <div className="flex-1" />

        {/* ── Totaux ────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            {/* Sous-total HT */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Sous-total HT</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(invoice.subtotal)} €
              </span>
            </div>

            {/* Réduction */}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Réduction</span>
                <span className="text-rose-600 font-medium">−{fmt(discount)} €</span>
              </div>
            )}

            {/* TVA */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">TVA ({vatRate}%)</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">
                {fmt(invoice.taxTotal)} €
              </span>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

            {/* Total TTC */}
            <div className="flex justify-between text-base font-bold">
              <span className="text-slate-900 dark:text-slate-50">Total TTC</span>
              <span className="text-violet-600 dark:text-violet-400">
                {fmt(invoice.total)} €
              </span>
            </div>

            {/* Acompte + NET À PAYER */}
            {deposit > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Acompte versé</span>
                  <span className="text-rose-600 font-medium">−{fmt(deposit)} €</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-violet-300 dark:border-violet-500 mt-1">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                    NET À PAYER
                  </span>
                  <span className="text-base font-extrabold text-violet-700 dark:text-violet-400">
                    {fmt(netAPayer)} €
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {invoice.notes && (
          <div className="rounded-lg bg-slate-50 dark:bg-[#2a2254]/60 border border-slate-100 dark:border-violet-500/20 p-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Notes</p>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* ── Liens de paiement ─────────────────────────────────────── */}
        {paymentLinks &&
          (paymentLinks.stripe || paymentLinks.paypal || paymentLinks.gocardless) && (
            <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-900/20 p-3">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
                Liens de paiement
              </p>
              <div className="flex flex-wrap gap-2">
                {paymentLinks.stripe && (
                  <span className="text-xs bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium">
                    Stripe
                  </span>
                )}
                {paymentLinks.paypal && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                    PayPal
                  </span>
                )}
                {paymentLinks.gocardless && (
                  <span className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full font-medium">
                    GoCardless
                  </span>
                )}
              </div>
            </div>
          )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p>Document généré par FacturFlow</p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton de chargement ───────────────────────────────────────────────────

function InvoicePreviewSkeleton() {
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

export function InvoicePreviewModal({
  invoice,
  open,
  onOpenChange,
}: InvoicePreviewModalProps) {
  const router = useRouter();
  const duplicateMutation = useDuplicateInvoice();

  // ── Handlers des 6 boutons d'action ──────────────────────────────────────

  const handlePrint = useCallback(() => {
    // Copie le HTML de l'aperçu + toutes les feuilles de style dans une fenêtre dédiée
    const printArea = document.getElementById("invoice-print-area");
    if (!printArea) return;

    // Récupérer toutes les <link> et <style> du document actuel
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");

    const win = window.open("", "_blank", "width=800,height=1100");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html><head>
  <title>Facture ${invoice?.number ?? ""}</title>
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

    // Attendre le chargement des styles puis imprimer
    win.onload = () => { win.print(); win.close(); };
    // Fallback si onload ne fire pas
    setTimeout(() => { try { win.print(); win.close(); } catch { /* already closed */ } }, 1500);
  }, [invoice]);

  const handleDownload = useCallback(async () => {
    if (!invoice) return;
    // Import dynamique : le module @react-pdf/renderer ne s'exécute qu'au clic
    const { downloadInvoicePDF } = await import("@/lib/pdf/invoice-pdf");
    await downloadInvoicePDF(invoice);
  }, [invoice]);

  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!invoice || isSending) return;
    setIsSending(true);

    // Récupérer les infos émetteur depuis localStorage en fallback
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

    const result = await sendInvoiceEmail(invoice.id, emitterFallback);

    if (result.success) {
      toast.success(`Facture envoyée à ${invoice.client.email}`);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }

    setIsSending(false);
  }, [invoice, isSending]);

  const handleDuplicate = useCallback(() => {
    if (!invoice) return;
    duplicateMutation.mutate(invoice.id);
  }, [invoice, duplicateMutation]);

  const handleEdit = useCallback(() => {
    if (!invoice) return;
    router.push(`/dashboard/invoices/${invoice.id}/edit`);
    onOpenChange(false);
  }, [invoice, router, onOpenChange]);

  const [isSendingEInvoice, setIsSendingEInvoice] = useState(false);

  const handleSendEInvoice = useCallback(async () => {
    if (!invoice || isSendingEInvoice) return;
    setIsSendingEInvoice(true);

    const result = await sendEInvoice(invoice.id);

    if (result.success) {
      toast.success("Facture envoyée électroniquement via SuperPDP !", {
        description: "Elle transite sur le réseau Peppol.",
      });
    } else {
      toast.error(result.error ?? "Envoi électronique échoué");
    }

    setIsSendingEInvoice(false);
  }, [invoice, isSendingEInvoice]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
        // On désactive le bouton de fermeture par défaut pour en mettre un custom dans le header
        showCloseButton={false}
      >
        {/* ── Header du modal : titre + bouton fermer + 5 actions ─────── */}
        <DialogHeader data-print-hide className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-violet-500/20">
          {/* Première ligne : numéro de facture + croix */}
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold">
              {invoice ? invoice.number : "Facture"}
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Deuxième ligne : 5 boutons d'action */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Imprimer */}
            <button
              onClick={handlePrint}
              disabled={!invoice}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer size={14} />
              Imprimer
            </button>

            {/* Télécharger PDF */}
            <button
              onClick={handleDownload}
              disabled={!invoice}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download size={14} />
              Télécharger PDF
            </button>

            {/* Envoyer */}
            <button
              onClick={handleSend}
              disabled={!invoice || isSending}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={14} />
              {isSending ? "Envoi..." : "Envoyer"}
            </button>

            {/* Dupliquer */}
            <button
              onClick={handleDuplicate}
              disabled={!invoice || duplicateMutation.isPending}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Copy size={14} />
              {duplicateMutation.isPending ? "Duplication..." : "Dupliquer"}
            </button>

            {/* Éditer */}
            <button
              onClick={handleEdit}
              disabled={!invoice}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Pencil size={14} />
              Éditer
            </button>

            {/* Envoyer électroniquement — désactivé si déjà envoyé */}
            <button
              onClick={handleSendEInvoice}
              disabled={!invoice || isSendingEInvoice || !!invoice?.einvoiceRef}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title={invoice?.einvoiceRef ? "Déjà envoyée électroniquement" : "Envoyer via le réseau Peppol (certifié DGFiP)"}
            >
              <FileCheck2 size={14} />
              {isSendingEInvoice ? "Envoi élec..." : invoice?.einvoiceRef ? "Envoyée élec." : "Envoyer élec."}
            </button>
          </div>

          {/* Badge de statut e-invoice — visible uniquement si envoyée */}
          {invoice?.einvoiceRef && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30">
              <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Facture électronique certifiée
                </span>
                <span className="text-[11px] text-indigo-500 dark:text-indigo-400">
                  {invoice.einvoiceStatus
                    ? getEInvoiceStatusLabel(invoice.einvoiceStatus)
                    : "En transit"
                  }
                  {invoice.einvoiceSentAt && (
                    <> &middot; {new Date(invoice.einvoiceSentAt).toLocaleDateString("fr-FR")}</>
                  )}
                </span>
              </div>
              <span className="ml-auto text-[10px] font-medium text-indigo-400 dark:text-indigo-500 shrink-0">
                SuperPDP · Peppol
              </span>
            </div>
          )}
        </DialogHeader>

        {/* ── Corps scrollable : aperçu statique de la facture ─────────── */}
        <div id="invoice-print-area" className="overflow-y-auto max-h-[70vh] p-6">
          {invoice ? (
            <InvoicePreviewStatic invoice={invoice} />
          ) : (
            <InvoicePreviewSkeleton />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
