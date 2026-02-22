"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { ReceiptPdfDocument } from "@/lib/pdf/receipt-pdf-document";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Trash2, X, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SavedReceipt } from "@/lib/types/receipts";
import { RECEIPT_PAYMENT_METHODS } from "@/lib/types/receipts";
import { useDeleteReceipt } from "@/hooks/use-receipts";

// PDFDownloadLink chargé côté client uniquement (utilise des browser APIs pour le Blob URL)
// ReceiptPdfDocument importé normalement — juste des objets react-pdf, pas de browser API
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientName(client: SavedReceipt["client"]) {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function fmtAmount(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function getPaymentLabel(method: string) {
  return RECEIPT_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function ReceiptPreviewModal({ receipt, open, onOpenChange }: ReceiptPreviewModalProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteReceipt();

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleDeleteConfirm = useCallback(() => {
    if (!receipt) return;
    deleteMutation.mutate(receipt.id, {
      onSuccess: (result) => {
        if (result.success) {
          setDeleteOpen(false);
          onOpenChange(false);
        }
      },
    });
  }, [receipt, deleteMutation, onOpenChange]);

  if (!receipt) return null;

  const clientName = getClientName(receipt.client);
  const fileName = `${receipt.number}.pdf`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {receipt.number}
              </DialogTitle>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                Payé
              </span>
            </div>
          </DialogHeader>

          {/* Contenu */}
          <div className="space-y-4 mt-2">
            {/* Résumé visuel */}
            <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-violet-300">Client</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {clientName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-violet-300">Objet</span>
                <span className="text-sm text-slate-700 dark:text-slate-200 max-w-[55%] text-right">
                  {receipt.description}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-violet-300">Date</span>
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {fmtDate(receipt.date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-violet-300">Mode de paiement</span>
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {getPaymentLabel(receipt.paymentMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-violet-200 dark:border-violet-400/25 pt-3 mt-1">
                <span className="text-base font-bold text-violet-700 dark:text-violet-300">
                  Montant encaissé
                </span>
                <span className="text-xl font-bold text-violet-700 dark:text-violet-300">
                  {fmtAmount(receipt.total)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {receipt.notes && (
              <div className="rounded-xl border border-slate-200 dark:border-violet-400/20 bg-slate-50 dark:bg-[#1f1844] p-3">
                <p className="text-xs text-slate-500 dark:text-violet-300/70 mb-1">Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{receipt.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {/* Télécharger PDF */}
              <PDFDownloadLink
                document={<ReceiptPdfDocument receipt={receipt} />}
                fileName={fileName}
                className="flex-1"
              >
                {({ loading }) => (
                  <Button
                    type="button"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Download className="size-4 mr-2" />
                    )}
                    Télécharger PDF
                  </Button>
                )}
              </PDFDownloadLink>

              {/* Imprimer */}
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 dark:border-violet-400/30 text-slate-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
              </Button>

              {/* Supprimer */}
              <Button
                type="button"
                variant="outline"
                className="border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
              </Button>

              {/* Fermer */}
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 dark:border-violet-400/30 text-slate-700 dark:text-violet-200 hover:bg-slate-50 dark:hover:bg-violet-500/10"
                onClick={handleClose}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce reçu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le reçu {receipt.number} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="size-4 mr-1.5" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
