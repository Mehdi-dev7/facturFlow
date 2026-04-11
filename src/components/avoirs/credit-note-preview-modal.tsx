"use client";

// Modale de prévisualisation d'un avoir — pattern identique à receipt-preview-modal.tsx

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
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { CreditNotePdfDocument } from "@/lib/pdf/credit-note-pdf-document";
import type { SavedCreditNote } from "@/lib/types/credit-notes";
import { CREDIT_NOTE_REASONS } from "@/lib/types/credit-notes";
import { useDeleteCreditNote } from "@/hooks/use-credit-notes";
import { sendCreditNoteEmail } from "@/lib/actions/send-credit-note-email";
import { formatCurrency } from "@/lib/utils/calculs-facture";
import { resolveHeaderTextColor , resolveContentColor } from "@/components/appearance/theme-config";

// PDFDownloadLink chargé côté client uniquement
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreditNotePreviewModalProps {
  creditNote: SavedCreditNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientName(client: SavedCreditNote["client"]): string {
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

// Formate un montant avec la devise de l'utilisateur (depuis creditNote.user.currency)
function fmtAmount(n: number, currency?: string | null): string {
  return formatCurrency(n, currency);
}

function getReasonLabel(value: string): string {
  return CREDIT_NOTE_REASONS.find((r) => r.value === value)?.label ?? value;
}

// ─── Sous-composant : aperçu statique de l'avoir ─────────────────────────────

function CreditNotePreviewContent({ creditNote }: { creditNote: SavedCreditNote }) {
  const clientName = getClientName(creditNote.client);
  const emitterName = creditNote.user.companyName ?? creditNote.user.name;
  const themeColor = creditNote.user.themeColor ?? "#dc2626";
  const textColor  = resolveHeaderTextColor(themeColor, "auto");
  const contentColor = resolveContentColor(themeColor);
  const logo = creditNote.user.companyLogo;
  const displayName = creditNote.user.companyName ?? "";

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-2 xs:p-3 md:p-5 space-y-6 shadow-sm">
      {/* En-tête */}
      <div className="rounded-lg p-4" style={{ backgroundColor: themeColor }}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold mb-1" style={{ color: textColor }}>AVOIR</h1>
            <p className="text-xs md:text-sm" style={{ color: textColor, opacity: 0.9 }}>N° {creditNote.number}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5">
            {logo && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            {displayName && (
              <p className="text-xs text-center font-medium" style={{ color: textColor }}>{displayName}</p>
            )}
          </div>
          <div className="flex-1 flex flex-col items-end text-right text-xs md:text-sm">
            <p style={{ color: textColor, opacity: 0.9 }}>Date : {fmtDate(creditNote.date)}</p>
            <span className="mt-2 inline-block bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide">
              NOTE DE CRÉDIT
            </span>
          </div>
        </div>
      </div>

      {/* Émetteur + Destinataire */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
            Émis par
          </h3>
          <div className="space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">{emitterName}</p>
            {creditNote.user.companySiret && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">SIRET : {creditNote.user.companySiret}</p>
            )}
            {creditNote.user.companyAddress && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{creditNote.user.companyAddress}</p>
            )}
            {(creditNote.user.companyPostalCode || creditNote.user.companyCity) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[creditNote.user.companyPostalCode, creditNote.user.companyCity].filter(Boolean).join(" ")}
              </p>
            )}
            {creditNote.user.companyEmail && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{creditNote.user.companyEmail}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
            Destinataire
          </h3>
          <div className="space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">{clientName}</p>
            {creditNote.client.email && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{creditNote.client.email}</p>
            )}
            {creditNote.client.address && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{creditNote.client.address}</p>
            )}
            {(creditNote.client.postalCode || creditNote.client.city) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[creditNote.client.postalCode, creditNote.client.city].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Détails de l'avoir */}
      <div>
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
          Détails de l'avoir
        </h3>
        <div
          className="rounded-lg p-3 border space-y-3"
          style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
        >
          <div className="flex justify-between text-xs lg:text-sm">
            <span style={{ color: contentColor }}>Facture d'origine</span>
            <span className="text-slate-900 dark:text-slate-50 font-semibold">{creditNote.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-xs lg:text-sm">
            <span style={{ color: contentColor }}>Type d'avoir</span>
            <span className="text-slate-900 dark:text-slate-50">
              {creditNote.type === "full" ? "Total" : "Partiel"}
            </span>
          </div>
          <div className="flex justify-between text-xs lg:text-sm">
            <span style={{ color: contentColor }}>Motif</span>
            <span className="text-slate-900 dark:text-slate-50 text-right max-w-[60%]">
              {getReasonLabel(creditNote.reason)}
            </span>
          </div>
          {/* Montant crédité — mis en avant */}
          <div
            className="flex justify-between items-center pt-3 mt-1"
            style={{ borderTop: `1px solid ${themeColor}33` }}
          >
            <span className="text-sm lg:text-base font-bold" style={{ color: contentColor }}>
              Montant crédité
            </span>
            <span className="text-sm lg:text-base font-bold" style={{ color: contentColor }}>
              − {fmtAmount(creditNote.total, creditNote.user.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {creditNote.notes && (
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
            Notes
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{creditNote.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CreditNotePreviewModal({
  creditNote,
  open,
  onOpenChange,
}: CreditNotePreviewModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteMutation = useDeleteCreditNote();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setWasSent(false);
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleSend = useCallback(async () => {
    if (!creditNote || isSending) return;
    setIsSending(true);
    const result = await sendCreditNoteEmail(creditNote.id);
    if (result.success) {
      toast.success(`Avoir envoyé à ${creditNote.client.email}`);
      setWasSent(true);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }
    setIsSending(false);
  }, [creditNote, isSending]);

  // Ferme la preview puis ouvre la modale de confirmation
  const handleDelete = useCallback(() => {
    if (!creditNote) return;
    handleOpenChange(false);
    setDeleteConfirmOpen(true);
  }, [creditNote, handleOpenChange]);

  const handleConfirmDelete = useCallback(() => {
    if (!creditNote) return;
    deleteMutation.mutate(creditNote.id, {
      onSuccess: (result) => {
        if (result.success) {
          setDeleteConfirmOpen(false);
          onOpenChange(false);
        }
      },
    });
  }, [creditNote, deleteMutation, onOpenChange]);

  if (!creditNote) return null;

  const fileName = `${creditNote.number}.pdf`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="w-[95vw] sm:w-[90vw] sm:max-w-2xl md:max-w-3xl max-h-[90dvh] bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
          showCloseButton={false}
        >
          {/* ── Header : numéro + badges + boutons d'action ─────────────── */}
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-slate-200 dark:border-violet-500/20">
            {/* Ligne 1 : numéro + badge + bouton fermer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold truncate">
                  {creditNote.number}
                </DialogTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 shrink-0">
                  Avoir
                </span>
                {wasSent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40 shrink-0">
                    <CheckCircle2 size={11} />
                    Envoyé
                  </span>
                )}
              </div>
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
                  document={<CreditNotePdfDocument creditNote={creditNote} />}
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
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span className="hidden sm:inline">{isSending ? "Envoi..." : "Envoyer"}</span>
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
            <CreditNotePreviewContent creditNote={creditNote} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression — hors du Dialog pour éviter les conflits de z-index */}
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        documentLabel="l'avoir"
        documentNumber={creditNote?.number ?? ""}
      />
    </>
  );
}
