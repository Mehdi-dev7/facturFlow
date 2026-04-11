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
import { Printer, Download, Send, Pencil, X, FileCheck2, ShieldCheck, Trash2, FileMinus } from "lucide-react";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { CreditNoteDialog } from "@/components/avoirs/credit-note-dialog";
import { SiStripe, SiPaypal } from "react-icons/si";
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
import { getFontFamily, getFontWeight, resolveHeaderTextColor , resolveContentColor } from "@/components/appearance/theme-config";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePreviewModalProps {
  invoice: SavedInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formate un montant avec la devise de l'utilisateur */
function fmt(n: number, currency?: string | null) {
  return formatCurrency(n, currency);
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
  themeColor: string;
  contentColor: string;
  currency?: string | null;
}

function StaticLinesTable({ title, lines, isForfait, typeConfig, themeColor, currency , contentColor }: StaticLinesTableProps) {
  return (
    <div>
      {title && (
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
          {title}
        </h3>
      )}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead style={{ backgroundColor: themeColor + "1a" }}>
            <tr>
              <th className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: contentColor }}>
                {typeConfig.descriptionLabel}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: contentColor }}>
                  {typeConfig.quantityLabel}
                </th>
              )}
              <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: contentColor }}>
                {isForfait ? "Montant" : "Prix unit."}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: contentColor }}>
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
                  <td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium" style={{ color: contentColor }}>
                    {fmt(line.subtotal, currency)}
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

  // Couleur thème dynamique
  const themeColor = invoice.user.themeColor ?? "#7c3aed";
  const textColor  = resolveHeaderTextColor(themeColor, (invoice.user as Record<string,unknown>).headerTextColor as string | null);
  const contentColor = resolveContentColor(themeColor);
  const logo = invoice.user.companyLogo;
  const displayName = emitter.companyName ?? "";
  const companyFont = invoice.user.companyFont ?? "inter";
  const fontFamily = getFontFamily(companyFont);
  const fontWeight = getFontWeight(companyFont);

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-2 xs:p-3 md:p-5 space-y-6 shadow-sm">
      {/* En-tête 3 colonnes : type+N° | logo+nom centré | dates à droite */}
      <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: themeColor }}>
        <div className="flex items-start gap-4">
          {/* Gauche : FACTURE + N° */}
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold mb-1" style={{ color: textColor }}>FACTURE</h1>
            <p className="text-xs md:text-sm" style={{ color: textColor, opacity: 0.9 }}>N° {invoice.number}</p>
            {invoiceType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[invoiceType]}
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
              <p className="text-sm font-bold text-center" style={{ fontFamily, fontWeight, color: textColor }}>{displayName}</p>
            )}
          </div>
          {/* Droite : dates */}
          <div className="flex-1 flex flex-col items-end text-right text-xs md:text-sm">
            <p style={{ color: textColor, opacity: 0.9 }}>Date : {formatDate(invoice.date)}</p>
            <p style={{ color: textColor, opacity: 0.9 }}>Échéance : {formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Émetteur et destinataire */}
      <div className="grid grid-cols-2 gap-6">
        {/* Émetteur */}
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
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
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
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
              themeColor={themeColor}
            contentColor={contentColor}
            />
            {materiauLines.length > 0 && (
              <StaticLinesTable
                title="Matériaux"
                lines={materiauLines}
                isForfait={false}
                typeConfig={typeConfig}
                themeColor={themeColor}
            contentColor={contentColor}
              />
            )}
          </div>
        ) : (
          <StaticLinesTable
            title="Détails"
            lines={sortedLines}
            isForfait={isForfait}
            typeConfig={typeConfig}
            themeColor={themeColor}
            contentColor={contentColor}
          />
        )}
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />
      {/* Récapitulatif */}
      <div className="flex justify-end">
        <div
          className="w-64 space-y-2 rounded-lg p-3 border"
          style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
        >
          {/* Sous-total HT */}
          <div className="flex justify-between text-sm">
            <span style={{ color: contentColor }}>Sous-total HT :</span>
            <span className="text-slate-900 dark:text-slate-50 font-medium">{fmt(invoice.subtotal, invoice.user.currency)}</span>
          </div>

          {/* Réduction */}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: contentColor }}>Réduction :</span>
              <span className="text-rose-600 font-medium">−{fmt(discount, invoice.user.currency)}</span>
            </div>
          )}

          {/* TVA */}
          <div className="flex justify-between text-sm">
            <span style={{ color: contentColor }}>TVA ({vatRate}%) :</span>
            <span className="text-slate-900 dark:text-slate-50 font-medium">{fmt(invoice.taxTotal, invoice.user.currency)}</span>
          </div>

          {/* Total TTC */}
          <div
            className="flex justify-between font-bold pt-2"
            style={{ borderTop: `1px solid ${themeColor}33` }}
          >
            <span className="text-slate-900 dark:text-slate-50 text-sm sm:text-base">Total TTC :</span>
            <span className="text-sm lg:text-base" style={{ color: contentColor }}>{fmt(invoice.total, invoice.user.currency)}</span>
          </div>

          {/* Acompte + NET À PAYER */}
          {deposit > 0 && (
            <>
              <div
                className="flex justify-between text-sm pt-2"
                style={{ borderTop: `1px solid ${themeColor}33` }}
              >
                <span className="text-sm lg:text-md" style={{ color: contentColor }}>Acompte versé :</span>
                <span className="text-rose-600 font-medium text-sm lg:text-md">−{fmt(deposit, invoice.user.currency)}</span>
              </div>
              <div
                className="flex justify-between items-center pt-2 mt-1"
                style={{ borderTop: `2px solid ${themeColor}66` }}
              >
                <span className="text-base lg:text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  NET À PAYER
                </span>
                <span className="text-base lg:text-lg font-bold" style={{ color: contentColor }}>
                  {fmt(netAPayer, invoice.user.currency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && invoice.notes.trim() && (
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
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
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
          Modalités de paiement
        </h3>
        <div className="space-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
          <p>• Paiement attendu avant le {formatDate(invoice.dueDate)}</p>
          <p>• Liens de paiement sécurisés inclus dans l&apos;email</p>
          
          {paymentLinks && (paymentLinks.stripe || paymentLinks.paypal || paymentLinks.gocardless) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentLinks.stripe && (
                typeof paymentLinks.stripe === "string" && paymentLinks.stripe.startsWith("http") ? (
                  <a
                    href={paymentLinks.stripe}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#635BFF] to-[#7C3AED] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <SiStripe className="size-3.5" /> Carte bancaire
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#635BFF] to-[#7C3AED] px-3 py-1.5 rounded-lg">
                    <SiStripe className="size-3.5" /> Carte bancaire
                  </span>
                )
              )}
              {paymentLinks.paypal && (
                typeof paymentLinks.paypal === "string" && paymentLinks.paypal.startsWith("http") ? (
                  <a
                    href={paymentLinks.paypal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#003087] to-[#009CDE] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <SiPaypal className="size-3.5" /> PayPal
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#003087] to-[#009CDE] px-3 py-1.5 rounded-lg">
                    <SiPaypal className="size-3.5" /> PayPal
                  </span>
                )
              )}
              {paymentLinks.gocardless && (
                typeof paymentLinks.gocardless === "string" && paymentLinks.gocardless.startsWith("http") ? (
                  <a
                    href={paymentLinks.gocardless}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span className="font-bold text-[10px]">GC</span> SEPA
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-3 py-1.5 rounded-lg">
                    <span className="font-bold text-[10px]">GC</span> SEPA
                  </span>
                )
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleSend = useCallback(async () => {
    if (!invoice || isSending) return;
    setIsSending(true);

    // Récupérer les infos émetteur depuis localStorage en fallback
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

    const result = await sendInvoiceEmail(invoice.id, emitterFallback);

    if (result.success) {
      toast.success(`Facture envoyée à ${invoice.client.email}`);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }

    setIsSending(false);
  }, [invoice, isSending]);

  
  // Ferme la preview puis ouvre la modale de confirmation (évite la double fenêtre)
  const handleDelete = useCallback(() => {
    if (!invoice) return;
    onOpenChange(false);
    setDeleteConfirmOpen(true);
  }, [invoice, onOpenChange]);

  // Exécute la suppression après confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!invoice || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(invoice.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
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

  // État pour le dialog de création d'avoir
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);

  // Ferme la preview puis ouvre le dialog avoir
  const handleCreditNote = useCallback(() => {
    if (!invoice) return;
    onOpenChange(false);
    setCreditNoteOpen(true);
  }, [invoice, onOpenChange]);

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
    <>
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

                  {/* Avoir - Logo seul (visible uniquement si facture payée) */}
                  {invoice && invoice.status === "PAID" && (
                    <button
                      onClick={handleCreditNote}
                      className="rounded-lg border p-2 text-sm font-medium transition-colors border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500 dark:text-rose-400 dark:hover:bg-rose-950 cursor-pointer"
                      title="Émettre un avoir"
                    >
                      <FileMinus size={16} />
                    </button>
                  )}
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

                {/* Envoyer électroniquement — désactivé (disponible très prochainement) */}
                <button
                  disabled
                  className="rounded-lg border px-3 py-2 text-sm font-medium gap-2 flex items-center border-indigo-200 text-indigo-400 dark:border-indigo-800 dark:text-indigo-600 opacity-60 cursor-not-allowed"
                  title="Disponible très prochainement"
                >
                  <FileCheck2 size={14} />
                  Envoyer élec.
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-500 dark:bg-violet-900/40 dark:text-violet-400 leading-none">
                    Bientôt
                  </span>
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

                {/* Envoyer électroniquement — désactivé (disponible très prochainement) */}
                <button
                  disabled
                  className="rounded-lg border px-3 py-2 text-sm font-medium gap-2 flex items-center border-indigo-200 text-indigo-400 dark:border-indigo-800 dark:text-indigo-600 opacity-60 cursor-not-allowed"
                  title="Disponible très prochainement"
                >
                  <FileCheck2 size={14} />
                  Envoyer élec.
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-500 dark:bg-violet-900/40 dark:text-violet-400 leading-none">
                    Bientôt
                  </span>
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

    {/* Modale de confirmation de suppression — hors du Dialog pour éviter les conflits de z-index */}
    <DeleteConfirmModal
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      onConfirm={handleConfirmDelete}
      isDeleting={isDeleting}
      documentLabel="la facture"
      documentNumber={invoice?.number ?? ""}
    />

    {/* Dialog de création d'avoir — s'ouvre après fermeture de la modal de prévisualisation */}
    {invoice && (
      <CreditNoteDialog
        invoice={{
          id: invoice.id,
          number: invoice.number,
          total: invoice.total,
          client: { email: invoice.client.email },
        }}
        open={creditNoteOpen}
        onOpenChange={setCreditNoteOpen}
      />
    )}
    </>
  );
}
