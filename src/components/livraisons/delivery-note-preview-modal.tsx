"use client";

// Modale de prévisualisation d'un bon de livraison — pattern identique à receipt-preview-modal.tsx

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
import { DeliveryNotePdfDocument } from "@/lib/pdf/delivery-note-pdf-document";
import type { SavedDeliveryNote } from "@/lib/types/delivery-notes";
import { useDeleteDeliveryNote } from "@/hooks/use-delivery-notes";
import { sendDeliveryNoteEmail } from "@/lib/actions/send-delivery-note-email";

// PDFDownloadLink chargé côté client uniquement
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);

// ─── Props ───────────────────────────────────────────────────────────────────

interface DeliveryNotePreviewModalProps {
  deliveryNote: SavedDeliveryNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientName(client: SavedDeliveryNote["client"]): string {
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

// ─── Sous-composant : aperçu statique du bon de livraison ────────────────────

function DeliveryNotePreviewContent({ deliveryNote }: { deliveryNote: SavedDeliveryNote }) {
  const clientName = getClientName(deliveryNote.client);
  const emitterName = deliveryNote.user.companyName ?? deliveryNote.user.name;
  const themeColor = deliveryNote.user.themeColor ?? "#0d9488";
  const logo = deliveryNote.user.companyLogo;
  const displayName = deliveryNote.user.companyName ?? "";

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-2 xs:p-3 md:p-5 space-y-6 shadow-sm">
      {/* En-tête */}
      <div className="rounded-lg p-4 text-white" style={{ backgroundColor: themeColor }}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold mb-1">BON DE LIVRAISON</h1>
            <p className="text-white/90 text-xs md:text-sm">N° {deliveryNote.number}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5">
            {logo && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            {displayName && (
              <p className="text-white/90 text-xs text-center font-medium">{displayName}</p>
            )}
          </div>
          <div className="flex-1 flex flex-col items-end text-right text-xs md:text-sm">
            <p className="text-white/90">Livraison : {fmtDate(deliveryNote.deliveryDate)}</p>
            <span className="mt-2 inline-block bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide">
              LIVRAISON
            </span>
          </div>
        </div>
      </div>

      {/* Émetteur + Destinataire */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
            Émis par
          </h3>
          <div className="space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">{emitterName}</p>
            {deliveryNote.user.companySiret && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">SIRET : {deliveryNote.user.companySiret}</p>
            )}
            {deliveryNote.user.companyAddress && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{deliveryNote.user.companyAddress}</p>
            )}
            {(deliveryNote.user.companyPostalCode || deliveryNote.user.companyCity) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[deliveryNote.user.companyPostalCode, deliveryNote.user.companyCity].filter(Boolean).join(" ")}
              </p>
            )}
            {deliveryNote.user.companyEmail && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{deliveryNote.user.companyEmail}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
            Destinataire
          </h3>
          <div className="space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">{clientName}</p>
            {deliveryNote.client.email && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{deliveryNote.client.email}</p>
            )}
            {deliveryNote.client.address && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">{deliveryNote.client.address}</p>
            )}
            {(deliveryNote.client.postalCode || deliveryNote.client.city) && (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
                {[deliveryNote.client.postalCode, deliveryNote.client.city].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Récapitulatif livraison */}
      <div>
        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
          Informations de livraison
        </h3>
        <div
          className="rounded-lg p-3 border space-y-2"
          style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
        >
          <div className="flex justify-between text-xs lg:text-sm">
            <span style={{ color: themeColor }}>Facture d'origine</span>
            <span className="text-slate-900 dark:text-slate-50 font-semibold">{deliveryNote.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-xs lg:text-sm">
            <span style={{ color: themeColor }}>Date de livraison</span>
            <span className="text-slate-900 dark:text-slate-50">{fmtDateShort(deliveryNote.deliveryDate)}</span>
          </div>
          <div className="flex justify-between text-xs lg:text-sm">
            <span style={{ color: themeColor }}>Nombre d'articles</span>
            <span className="text-slate-900 dark:text-slate-50 font-semibold">{deliveryNote.lines.length}</span>
          </div>
        </div>
      </div>

      {/* Articles livrés */}
      {deliveryNote.lines.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
            Articles livrés
          </h3>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {deliveryNote.lines.map((line, i) => (
              <div
                key={line.id}
                className={`flex items-center justify-between px-3 py-2.5 text-xs lg:text-sm ${
                  i < deliveryNote.lines.length - 1
                    ? "border-b border-slate-100 dark:border-slate-700/50"
                    : ""
                }`}
              >
                <span className="text-slate-700 dark:text-slate-300 flex-1 pr-4">{line.description}</span>
                <span className="text-slate-500 dark:text-slate-400 shrink-0">
                  Qté : <span className="font-semibold text-slate-700 dark:text-slate-300">{line.quantity}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {deliveryNote.notes && (
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
            Notes
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{deliveryNote.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function DeliveryNotePreviewModal({
  deliveryNote,
  open,
  onOpenChange,
}: DeliveryNotePreviewModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteMutation = useDeleteDeliveryNote();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setWasSent(false);
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleSend = useCallback(async () => {
    if (!deliveryNote || isSending) return;
    setIsSending(true);
    const result = await sendDeliveryNoteEmail(deliveryNote.id);
    if (result.success) {
      toast.success(`Bon de livraison envoyé à ${deliveryNote.client.email}`);
      setWasSent(true);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }
    setIsSending(false);
  }, [deliveryNote, isSending]);

  // Ferme la preview puis ouvre la modale de confirmation
  const handleDelete = useCallback(() => {
    if (!deliveryNote) return;
    handleOpenChange(false);
    setDeleteConfirmOpen(true);
  }, [deliveryNote, handleOpenChange]);

  const handleConfirmDelete = useCallback(() => {
    if (!deliveryNote) return;
    deleteMutation.mutate(deliveryNote.id, {
      onSuccess: (result) => {
        if (result.success) {
          setDeleteConfirmOpen(false);
          onOpenChange(false);
        }
      },
    });
  }, [deliveryNote, deleteMutation, onOpenChange]);

  if (!deliveryNote) return null;

  const fileName = `${deliveryNote.number}.pdf`;

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
                  {deliveryNote.number}
                </DialogTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 shrink-0">
                  BL
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
                  document={<DeliveryNotePdfDocument deliveryNote={deliveryNote} />}
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
            <DeliveryNotePreviewContent deliveryNote={deliveryNote} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression — hors du Dialog pour éviter les conflits de z-index */}
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        documentLabel="le bon de livraison"
        documentNumber={deliveryNote?.number ?? ""}
      />
    </>
  );
}
