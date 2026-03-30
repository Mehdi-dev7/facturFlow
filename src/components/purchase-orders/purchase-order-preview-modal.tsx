"use client";
// src/components/purchase-orders/purchase-order-preview-modal.tsx
// Modal de prévisualisation d'un bon de commande enregistré avec actions

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
import {
  INVOICE_TYPE_CONFIG,
  INVOICE_TYPE_LABELS,
  type InvoiceType,
} from "@/lib/validations/purchase-order";
import { getFontFamily, getFontWeight } from "@/components/appearance/theme-config";
import type { SavedPurchaseOrder } from "@/lib/pdf/purchase-order-pdf-document";

// Couleur teal fixe pour les bons de commande
const TEAL_COLOR = "#0d9488";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PurchaseOrderPreviewModalProps {
  purchaseOrder: SavedPurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Hooks injectés depuis l'extérieur pour garder le composant indépendant du backend
  onDelete?: (id: string) => Promise<void>;
  onSendEmail?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCreateInvoice?: (id: string) => Promise<{ success: boolean; data?: { id: string; number: string }; error?: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getClientName(client: SavedPurchaseOrder["client"]) {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":     return { label: "À envoyer", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
    case "SENT":      return { label: "Envoyé", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
    case "ACCEPTED":  return { label: "Accepté", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
    case "CANCELLED": return { label: "Annulé", color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" };
    default:          return { label: status, color: "bg-slate-100 text-slate-600" };
  }
}

// ─── Sous-composant : tableau de lignes statique ──────────────────────────────

interface StaticLinesTableProps {
  title?: string;
  lines: SavedPurchaseOrder["lineItems"];
  isForfait: boolean;
  typeConfig: { descriptionLabel: string; quantityLabel: string | null; priceLabel: string };
}

function StaticLinesTable({ title, lines, isForfait, typeConfig }: StaticLinesTableProps) {
  return (
    <div>
      {title && (
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
          {title}
        </h3>
      )}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead style={{ backgroundColor: TEAL_COLOR + "1a" }}>
            <tr>
              <th className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
                {typeConfig.descriptionLabel}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
                  {typeConfig.quantityLabel}
                </th>
              )}
              <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
                {isForfait ? "Montant" : "Prix unit."}
              </th>
              {!isForfait && (
                <th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
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
                  <td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium" style={{ color: TEAL_COLOR }}>
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

// ─── Sous-composant : aperçu statique complet ────────────────────────────────

function PurchaseOrderPreviewStatic({ purchaseOrder }: { purchaseOrder: SavedPurchaseOrder }) {
  // Émetteur : données DB en priorité, sinon fallback localStorage
  const emitter = useMemo(() => {
    if (purchaseOrder.user.companyName) return purchaseOrder.user;
    try {
      const saved = localStorage.getItem("facturnow_company");
      if (saved) {
        const c = JSON.parse(saved) as {
          name?: string;
          siret?: string;
          address?: string;
          city?: string;
          email?: string;
          zipCode?: string;
        };
        return {
          companyName: c.name ?? null,
          companySiret: c.siret ?? null,
          companyAddress: c.address ?? null,
          companyPostalCode: c.zipCode ?? null,
          companyCity: c.city ?? null,
          companyEmail: c.email ?? null,
          companyPhone: null,
          themeColor: null,
          companyFont: null,
          companyLogo: null,
          invoiceFooter: null,
        };
      }
    } catch { /* ignore */ }
    return purchaseOrder.user;
  }, [purchaseOrder.user]);

  // Config du type de bon de commande
  const orderType = (purchaseOrder.invoiceType ?? "basic") as InvoiceType;
  const typeConfig = INVOICE_TYPE_CONFIG[orderType] ?? INVOICE_TYPE_CONFIG["basic"];
  const isForfait = typeConfig.quantityLabel === null;
  const isArtisan = orderType === "artisan";

  const discount = purchaseOrder.discount ?? 0;
  const vatRate  = 20; // valeur par défaut — non stockée dans le type simplifié

  // Lignes triées
  const sortedLines = [...purchaseOrder.lineItems].sort((a, b) => a.order - b.order);
  const mainOeuvreLines = isArtisan
    ? sortedLines.filter((l) => !l.category || l.category === "main_oeuvre")
    : sortedLines;
  const materiauLines = isArtisan
    ? sortedLines.filter((l) => l.category === "materiel")
    : [];

  // Apparence
  const logo        = purchaseOrder.user.companyLogo;
  const displayName = purchaseOrder.user.companyName ?? "";
  const companyFont = purchaseOrder.user.companyFont ?? "inter";
  const fontFamily  = getFontFamily(companyFont);
  const fontWeight  = getFontWeight(companyFont);

  const statusInfo = getStatusLabel(purchaseOrder.status);

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-sm">
      {/* En-tête */}
      <div className="rounded-lg p-4 text-white mb-6" style={{ backgroundColor: TEAL_COLOR }}>
        <div className="flex items-start gap-4">
          {/* Gauche : BON DE COMMANDE + N° + réf + badge statut */}
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold mb-1">BON DE COMMANDE</h1>
            <p className="text-white/90 text-xs md:text-sm">N° {purchaseOrder.number}</p>
            {purchaseOrder.bcReference && (
              <p className="text-white/70 text-[10px] mt-0.5">Réf. client : {purchaseOrder.bcReference}</p>
            )}
            {orderType !== "basic" && (
              <span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {INVOICE_TYPE_LABELS[orderType]}
              </span>
            )}
          </div>
          {/* Centre : logo + nom */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            {logo && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            {displayName && (
              <p className="text-white/90 text-sm font-bold text-center" style={{ fontFamily, fontWeight }}>
                {displayName}
              </p>
            )}
          </div>
          {/* Droite : dates + statut */}
          <div className="flex-1 flex flex-col items-end text-right text-xs md:text-sm gap-1">
            <p className="text-white/90">Date : {formatDate(purchaseOrder.date)}</p>
            {purchaseOrder.deliveryDate && (
              <p className="text-white/90">Livraison : {formatDate(purchaseOrder.deliveryDate)}</p>
            )}
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Émetteur et destinataire */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
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
                  {[emitter.companyPostalCode, emitter.companyCity].filter(Boolean).join(" ")}
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

        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: TEAL_COLOR }}>
            Destinataire
          </h3>
          <div className="text-sm space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
              {getClientName(purchaseOrder.client)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
              {purchaseOrder.client.email}
            </p>
            {purchaseOrder.client.address && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {purchaseOrder.client.address}
              </p>
            )}
            {(purchaseOrder.client.postalCode || purchaseOrder.client.city) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[purchaseOrder.client.postalCode, purchaseOrder.client.city].filter(Boolean).join(" ")}
              </p>
            )}
            {purchaseOrder.client.siret && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                SIRET : {purchaseOrder.client.siret}
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
            title="Main d'oeuvre"
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

      <div className="h-px bg-slate-200 dark:bg-slate-700 mt-2 mb-5" />

      {/* Totaux */}
      <div className="flex justify-end">
        <div
          className="w-64 space-y-1.5 rounded-lg p-3 border"
          style={{ backgroundColor: TEAL_COLOR + "0d", borderColor: TEAL_COLOR + "33" }}
        >
          <div className="flex justify-between text-xs lg:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Sous-total HT</span>
            <span className="text-slate-800 dark:text-slate-100 font-medium">
              {fmt(purchaseOrder.subtotal)} €
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400">Réduction</span>
              <span className="text-rose-600 font-medium">−{fmt(discount)} €</span>
            </div>
          )}

          <div className="flex justify-between text-xs lg:text-sm">
            <span className="text-slate-500 dark:text-slate-400">TVA ({vatRate}%)</span>
            <span className="text-slate-800 dark:text-slate-100 font-medium">
              {fmt(purchaseOrder.taxTotal)} €
            </span>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          <div className="flex justify-between text-sm lg:text-base font-bold">
            <span className="text-slate-900 dark:text-slate-50">Total TTC</span>
            <span style={{ color: TEAL_COLOR }}>
              {fmt(purchaseOrder.total)} €
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {purchaseOrder.notes && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-3 text-[11px] lg:text-xs text-slate-600 dark:text-slate-300">
          <p className="font-medium mb-1 text-xs lg:text-sm" style={{ color: TEAL_COLOR }}>Notes</p>
          <p className="whitespace-pre-line">{purchaseOrder.notes}</p>
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

function PurchaseOrderPreviewSkeleton() {
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

export function PurchaseOrderPreviewModal({
  purchaseOrder,
  open,
  onOpenChange,
  onDelete,
  onSendEmail,
  onCreateInvoice,
}: PurchaseOrderPreviewModalProps) {
  const router = useRouter();

  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ── Impression via fenêtre native ──────────────────────────────────────

  const handlePrint = useCallback(() => {
    const printArea = document.getElementById("purchase-order-print-area");
    if (!printArea) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");

    const win = window.open("", "_blank", "width=800,height=1100");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html><head>
  <title>Bon de commande ${purchaseOrder?.number ?? ""}</title>
  ${styles}
  <style>
    @page { size: A4; margin: 10mm; }
    body { margin: 0; padding: 20px; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>${printArea.innerHTML}</body></html>`);
    win.document.close();
    win.onload = () => { win.print(); win.close(); };
    setTimeout(() => { try { win.print(); win.close(); } catch { /* already closed */ } }, 1500);
  }, [purchaseOrder]);

  // ── Téléchargement PDF ─────────────────────────────────────────────────

  const handleGeneratePdf = useCallback(async () => {
    if (!purchaseOrder) return;
    setIsGeneratingPdf(true);
    try {
      const { downloadPurchaseOrderPDF } = await import("@/lib/pdf/purchase-order-pdf");
      await downloadPurchaseOrderPDF(purchaseOrder);
      toast.success("PDF téléchargé !");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [purchaseOrder]);

  // ── Envoi email ────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!purchaseOrder || isSending || !onSendEmail) return;
    setIsSending(true);
    const result = await onSendEmail(purchaseOrder.id);
    if (result.success) {
      toast.success(`Bon de commande envoyé à ${purchaseOrder.client.email}`);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }
    setIsSending(false);
  }, [purchaseOrder, isSending, onSendEmail]);

  // ── Générer une facture depuis ce BC accepté ───────────────────────────

  const handleCreateInvoice = useCallback(async () => {
    if (!purchaseOrder || isCreatingInvoice || !onCreateInvoice) return;
    setIsCreatingInvoice(true);
    try {
      const result = await onCreateInvoice(purchaseOrder.id);
      if (result.success && result.data) {
        toast.success(`Facture ${result.data.number} créée !`);
        onOpenChange(false);
        router.push(`/dashboard/invoices?preview=${result.data.id}`);
      } else {
        toast.error(result.error ?? "Erreur lors de la création");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [purchaseOrder, isCreatingInvoice, onCreateInvoice, router, onOpenChange]);

  const handleEdit = useCallback(() => {
    if (!purchaseOrder) return;
    router.push(`/dashboard/purchase-orders/${purchaseOrder.id}/edit`);
    onOpenChange(false);
  }, [purchaseOrder, router, onOpenChange]);

  const handleDelete = useCallback(() => {
    if (!purchaseOrder) return;
    onOpenChange(false);
    setDeleteConfirmOpen(true);
  }, [purchaseOrder, onOpenChange]);

  const handleConfirmDelete = useCallback(async () => {
    if (!purchaseOrder || isDeleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(purchaseOrder.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [purchaseOrder, isDeleting, onDelete, onOpenChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[95vw] h-[90vh] sm:w-[90vw] sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-5xl bg-linear-to-b from-teal-50 via-white to-white dark:from-[#0f2a2a] dark:via-[#0a2020] dark:to-[#0a2020] border border-teal-500/20 dark:border-teal-400/25 shadow-lg dark:shadow-teal-950/40 rounded-xl overflow-hidden p-0"
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header : titre + bouton fermer + actions */}
          <DialogHeader data-print-hide className="px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-5 pb-2 sm:pb-3 md:pb-4 border-b border-slate-200 dark:border-teal-500/20">
            {/* Ligne 1 : numéro + croix */}
            <div className="flex items-center justify-between">
              <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold mx-2 md:mx-0">
                {purchaseOrder ? purchaseOrder.number : "Bon de commande"}
              </DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Ligne 2 : boutons d'action */}
            <div className="mt-3 mx-2 md:mx-0">
              {/* Version mobile */}
              <div className="block md:hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      disabled={!purchaseOrder}
                      className="rounded-lg border p-2 text-sm font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={handleGeneratePdf}
                      disabled={!purchaseOrder || isGeneratingPdf}
                      className="rounded-lg border p-2 text-sm font-medium transition-colors border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={handleEdit}
                      disabled={!purchaseOrder}
                      className="rounded-lg border p-2 text-sm font-medium transition-colors border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={!purchaseOrder || isDeleting}
                    className="rounded-lg border p-2 text-sm font-medium transition-colors border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onSendEmail && (
                    <button
                      onClick={handleSend}
                      disabled={!purchaseOrder || isSending}
                      className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Send size={14} />
                      {isSending ? "Envoi..." : "Envoyer"}
                    </button>
                  )}
                  {/* Bouton "Générer la facture" — visible uniquement si statut ACCEPTED */}
                  {purchaseOrder?.status === "ACCEPTED" && onCreateInvoice && (
                    <button
                      onClick={handleCreateInvoice}
                      disabled={isCreatingInvoice}
                      className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <FileText size={14} />
                      {isCreatingInvoice ? "Création..." : "Générer la facture"}
                    </button>
                  )}
                </div>
              </div>

              {/* Version desktop */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePrint}
                    disabled={!purchaseOrder}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Printer size={14} />
                    Imprimer
                  </button>

                  <button
                    onClick={handleGeneratePdf}
                    disabled={!purchaseOrder || isGeneratingPdf}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download size={14} />
                    {isGeneratingPdf ? "..." : "PDF"}
                  </button>

                  <button
                    onClick={handleEdit}
                    disabled={!purchaseOrder}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Pencil size={14} />
                    Éditer
                  </button>

                  {onSendEmail && (
                    <button
                      onClick={handleSend}
                      disabled={!purchaseOrder || isSending}
                      className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Send size={14} />
                      {isSending ? "Envoi..." : "Envoyer"}
                    </button>
                  )}

                  {/* Bouton "Générer la facture" — visible uniquement si ACCEPTED */}
                  {purchaseOrder?.status === "ACCEPTED" && onCreateInvoice && (
                    <button
                      onClick={handleCreateInvoice}
                      disabled={isCreatingInvoice}
                      className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <FileText size={14} />
                      {isCreatingInvoice ? "Création..." : "Générer la facture"}
                    </button>
                  )}
                </div>

                {/* Supprimer isolé à droite */}
                <button
                  onClick={handleDelete}
                  disabled={!purchaseOrder || isDeleting}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Corps scrollable */}
          <div id="purchase-order-print-area" className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[80vh] md:max-h-[70vh] p-2 xs:p-3 md:p-5">
            {purchaseOrder ? (
              <PurchaseOrderPreviewStatic purchaseOrder={purchaseOrder} />
            ) : (
              <PurchaseOrderPreviewSkeleton />
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
        documentLabel="le bon de commande"
        documentNumber={purchaseOrder?.number ?? ""}
      />
    </>
  );
}
