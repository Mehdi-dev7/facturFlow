"use client";

// Modale de prévisualisation d'un reçu manuel, alignée sur invoice-preview-modal.tsx

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Printer, Send, Trash2, X, CheckCircle2, Loader2 } from "lucide-react";
import { ReceiptPdfDocument } from "@/lib/pdf/receipt-pdf-document";
import type { SavedReceipt } from "@/lib/types/receipts";
import { RECEIPT_PAYMENT_METHODS } from "@/lib/types/receipts";
import { useDeleteReceipt } from "@/hooks/use-receipts";
import { sendSavedReceiptEmail } from "@/lib/actions/send-receipt-email";

// PDFDownloadLink chargé côté client uniquement (browser APIs pour Blob URL)
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);

// ─── Props ───────────────────────────────────────────────────────────────────

interface ReceiptPreviewModalProps {
  receipt: SavedReceipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientName(client: SavedReceipt["client"]): string {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function fmtAmount(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function getPaymentLabel(method: string): string {
  return RECEIPT_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

// ─── Sous-composant : aperçu statique du reçu ────────────────────────────────

function ReceiptPreviewContent({ receipt }: { receipt: SavedReceipt }) {
  const clientName = getClientName(receipt.client);
  const emitterName = receipt.user.companyName ?? receipt.user.name;

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 md:p-6 space-y-6 shadow-sm">
      {/* Bandeau header gradient violet */}
      <div className="bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 rounded-lg p-4 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg md:text-xl font-bold mb-1">REÇU</h1>
            <p className="text-white/90 text-xs md:text-sm">N° {receipt.number}</p>
          </div>
          <div className="text-right text-xs md:text-sm">
            <p className="text-white/90">Date : {fmtDate(receipt.date)}</p>
          </div>
        </div>
      </div>

      {/* Émetteur + Destinataire */}
      <div className="grid grid-cols-2 gap-6">
        {/* Émetteur */}
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Émis par
          </h3>
          <div className="text-sm space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
              {emitterName}
            </p>
            {receipt.user.companySiret && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                SIRET : {receipt.user.companySiret}
              </p>
            )}
            {receipt.user.companyAddress && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {receipt.user.companyAddress}
              </p>
            )}
            {(receipt.user.companyPostalCode || receipt.user.companyCity) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[receipt.user.companyPostalCode, receipt.user.companyCity]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
            {receipt.user.companyEmail && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {receipt.user.companyEmail}
              </p>
            )}
          </div>
        </div>

        {/* Destinataire */}
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Reçu de
          </h3>
          <div className="text-sm space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
              {clientName}
            </p>
            {receipt.client.email && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {receipt.client.email}
              </p>
            )}
            {receipt.client.phone && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {receipt.client.phone}
              </p>
            )}
            {receipt.client.address && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {receipt.client.address}
              </p>
            )}
            {(receipt.client.postalCode || receipt.client.city) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[receipt.client.postalCode, receipt.client.city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Récapitulatif paiement */}
      <div>
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Récapitulatif du paiement
        </h3>
        <div className="bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-500/20 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-violet-700 dark:text-violet-300">Objet</span>
            <span className="text-slate-900 dark:text-slate-50 text-right max-w-[60%]">
              {receipt.description}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-violet-700 dark:text-violet-300">Date du paiement</span>
            <span className="text-slate-900 dark:text-slate-50">{fmtDateShort(receipt.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-violet-700 dark:text-violet-300">Mode de paiement</span>
            <span className="text-slate-900 dark:text-slate-50">
              {getPaymentLabel(receipt.paymentMethod)}
            </span>
          </div>
          {/* Montant encaissé — mis en avant */}
          <div className="flex justify-between items-center border-t border-violet-200 dark:border-violet-500/30 pt-3 mt-1">
            <span className="text-base font-bold text-violet-700 dark:text-violet-300">
              Montant encaissé
            </span>
            <span className="text-xl lg:text-2xl font-bold text-violet-700 dark:text-violet-300">
              {fmtAmount(receipt.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {receipt.notes && (
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Notes
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {receipt.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReceiptPreviewModal({
  receipt,
  open,
  onOpenChange,
}: ReceiptPreviewModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);
  const deleteMutation = useDeleteReceipt();

  // Réinitialiser wasSent à la fermeture
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setWasSent(false);
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  // Envoi du reçu par email
  const handleSend = useCallback(async () => {
    if (!receipt || isSending) return;
    setIsSending(true);

    const result = await sendSavedReceiptEmail(receipt.id);

    if (result.success) {
      toast.success(`Reçu envoyé à ${receipt.client.email}`);
      setWasSent(true);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }

    setIsSending(false);
  }, [receipt, isSending]);

  // Suppression avec confirmation native (window.confirm)
  const handleDelete = useCallback(async () => {
    if (!receipt) return;
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le reçu ${receipt.number} ?`,
    );
    if (!confirmed) return;

    deleteMutation.mutate(receipt.id, {
      onSuccess: (result) => {
        if (result.success) {
          onOpenChange(false);
        }
      },
    });
  }, [receipt, deleteMutation, onOpenChange]);

  if (!receipt) return null;

  const fileName = `${receipt.number}.pdf`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[95vw] sm:w-[90vw] sm:max-w-2xl md:max-w-3xl bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* ── Header : numéro + badges + boutons d'action ─────────────── */}
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-slate-200 dark:border-violet-500/20">
          {/* Ligne 1 : numéro + badge Payé + badge Envoyé + bouton fermer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold truncate">
                {receipt.number}
              </DialogTitle>

              {/* Badge "Payé" — toujours visible */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shrink-0">
                Payé
              </span>

              {/* Badge "Envoyé" — visible uniquement après envoi réussi */}
              {wasSent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40 shrink-0">
                  <CheckCircle2 size={11} />
                  Envoyé
                </span>
              )}
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => handleOpenChange(false)}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Ligne 2 : boutons d'action */}
          <div className="mt-3 flex items-center justify-between gap-2">
            {/* Groupe gauche */}
            <div className="flex flex-wrap gap-2">
              {/* Imprimer */}
              <button
                onClick={() => window.print()}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              {/* Télécharger PDF */}
              <PDFDownloadLink
                document={<ReceiptPdfDocument receipt={receipt} />}
                fileName={fileName}
              >
                {({ loading }) => (
                  <button
                    disabled={loading}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                )}
              </PDFDownloadLink>

              {/* Envoyer par email */}
              <button
                onClick={handleSend}
                disabled={isSending}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span className="hidden sm:inline">
                  {isSending ? "Envoi..." : "Envoyer"}
                </span>
              </button>
            </div>

            {/* Supprimer — isolé à droite */}
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </span>
            </button>
          </div>
        </DialogHeader>

        {/* ── Corps scrollable ─────────────────────────────────────────── */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[70vh] p-4 md:p-6">
          <ReceiptPreviewContent receipt={receipt} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
