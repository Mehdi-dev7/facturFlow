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
import { Printer, Download, Send, Pencil, X, FileCheck2, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateInvoice, useDeleteInvoice } from "@/hooks/use-invoices";
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
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
          {title}
        </h3>
      )}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
            <tr>
              <th className="text-left p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                {typeConfig.descriptionLabel}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                  {typeConfig.quantityLabel}
                </th>
              )}
              <th className="text-right p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                {isForfait ? "Montant" : "Prix unit."}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
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
                  <td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium text-violet-600 dark:text-violet-400">
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
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-sm">
      {/* En-tête du document avec bandeau coloré */}
      <div className="bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 rounded-lg p-4 text-white mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg md:text-xl font-bold mb-1">
              FACTURE
            </h1>
            <p className="text-white/90 text-xs md:text-sm">
              N° {invoice.number}
            </p>
          </div>
          <div className="text-right text-xs md:text-sm">
            <p className="text-white/90">
              Date : {formatDate(invoice.date)}
            </p>
            <p className="text-white/90 ">
              Échéance : {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
            {invoiceType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[invoiceType]}
              </span>
            )}
      </div>

      {/* Émetteur et destinataire */}
      <div className="grid grid-cols-2 gap-6">
        {/* Émetteur */}
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
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
            <p className="text-slate-400 italic text-sm">Non renseigné</p>
          )}
        </div>

        {/* Destinataire */}
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Destinataire
          </h3>
          <div className="text-sm space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
              {getClientName(invoice.client)}
            </p>
            {invoice.client.address && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {invoice.client.address}
              </p>
            )}
            {(invoice.client.postalCode || invoice.client.city) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[invoice.client.postalCode, invoice.client.city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
            {invoice.client.companySiret && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                SIRET : {invoice.client.companySiret}
              </p>
            )}
            <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
              {invoice.client.email}
            </p>
          </div>
        </div>
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />

      {/* Détails de la facture */}
      <div>
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
            title="Détails"
            lines={sortedLines}
            isForfait={isForfait}
            typeConfig={typeConfig}
          />
        )}
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />
      {/* Récapitulatif */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2 bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-500/20">
          {/* Sous-total HT */}
          <div className="flex justify-between text-sm">
            <span className="text-violet-700 dark:text-violet-300 ">Sous-total HT :</span>
            <span className="text-slate-900 dark:text-slate-50 font-medium">{fmt(invoice.subtotal)} €</span>
          </div>

          {/* Réduction */}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-violet-700 dark:text-violet-300">Réduction :</span>
              <span className="text-rose-600 font-medium">−{fmt(discount)} €</span>
            </div>
          )}

          {/* TVA */}
          <div className="flex justify-between text-sm">
            <span className="text-violet-700 dark:text-violet-300">TVA ({vatRate}%) :</span>
            <span className="text-slate-900 dark:text-slate-50 font-medium">{fmt(invoice.taxTotal)} €</span>
          </div>

          {/* Total TTC */}
          <div className="flex justify-between text-lg font-bold border-t border-violet-200 dark:border-violet-500/30 pt-2">
            <span className="text-slate-900 dark:text-slate-50 text-base lg:text-lg">Total TTC :</span>
            <span className="text-violet-600 dark:text-violet-400 text-base lg:text-lg">{fmt(invoice.total)} €</span>
          </div>

          {/* Acompte + NET À PAYER */}
          {deposit > 0 && (
            <>
              <div className="flex justify-between text-sm border-t border-violet-200 dark:border-violet-500/30 pt-2">
                <span className="text-violet-700 dark:text-violet-300 text-base lg:text-lg">Acompte versé :</span>
                <span className="text-rose-600 font-medium text-base lg:text-lg">−{fmt(deposit)} €</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-violet-300 dark:border-violet-500 mt-1">
                <span className="text-base lg:text-lg font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                  NET À PAYER
                </span>
                <span className="text-base lg:text-lg font-extrabold text-violet-700 dark:text-violet-400">
                  {fmt(netAPayer)} €
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && invoice.notes.trim() && (
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Notes
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        </div>
      )}

      {/* Liens de paiement */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Modalités de paiement
        </h3>
        <div className="space-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
          <p>• Paiement attendu avant le {formatDate(invoice.dueDate)}</p>
          <p>• Liens de paiement sécurisés inclus dans l&apos;email</p>
          
          {paymentLinks && (paymentLinks.stripe || paymentLinks.paypal || paymentLinks.gocardless) && (
            <div className="mt-3 space-y-2">
              {paymentLinks.stripe && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>Carte bancaire (Stripe)</span>
                </div>
              )}
              {paymentLinks.paypal && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <div className="w-3 h-3 rounded bg-linear-to-r from-blue-500 to-yellow-500"></div>
                  <span>PayPal</span>
                </div>
              )}
              {paymentLinks.gocardless && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span>Prélèvement SEPA (GoCardless)</span>
                </div>
              )}
            </div>
          )}
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
  const deleteMutation = useDeleteInvoice();

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
  const [isDeleting, setIsDeleting] = useState(false);

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

  
  const handleDelete = useCallback(async () => {
    if (!invoice || isDeleting) return;
    
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.number} ?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(invoice.id);
      onOpenChange(false); // Fermer la modal après suppression
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [invoice, isDeleting, deleteMutation, onOpenChange]);

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
        className="w-[95vw] h-[90vh] sm:w-[90vw] sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-5xl bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
        // On désactive le bouton de fermeture par défaut pour en mettre un custom dans le header
        showCloseButton={false}
      >
        {/* ── Header du modal : titre + bouton fermer + 5 actions ─────── */}
        <DialogHeader data-print-hide className="px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-5 pb-2 sm:pb-3 md:pb-4 border-b border-slate-200 dark:border-violet-500/20">
          {/* Première ligne : numéro de facture + croix */}
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold mx-2 md:mx-0">
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
                    disabled={!invoice}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Printer size={16} />
                  </button>

                  {/* PDF - Logo seul */}
                  <button
                    onClick={handleDownload}
                    disabled={!invoice}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download size={16} />
                  </button>

                  {/* Éditer - Logo seul */}
                  <button
                    onClick={handleEdit}
                    disabled={!invoice}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Supprimer - Seul à droite */}
                <button
                  onClick={handleDelete}
                  disabled={!invoice || isDeleting}
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
                  disabled={!invoice || isSending}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={14} />
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>

                {/* Envoyer électroniquement */}
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
            </div>

            {/* Version desktop : boutons principaux + supprimer isolé à droite */}
            <div className="hidden md:flex items-center justify-between">
              {/* Boutons principaux à gauche */}
              <div className="flex flex-wrap gap-2">
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
                  PDF
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

                {/* Envoyer */}
                <button
                  onClick={handleSend}
                  disabled={!invoice || isSending}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={14} />
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>

                {/* Envoyer électroniquement */}
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

              {/* Supprimer isolé à droite */}
              <button
                onClick={handleDelete}
                disabled={!invoice || isDeleting}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={14} />
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
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
        <div id="invoice-print-area" className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[80vh] md:max-h-[70vh] p-2 sm:p-4 md:p-6">
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
