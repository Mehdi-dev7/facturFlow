"use client";
// src/components/acomptes/deposit-preview-modal.tsx
// Modal de prévisualisation d'un acompte enregistré avec 5 actions

import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Send, Copy, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SavedDeposit } from "@/lib/types/deposits";
import { sendDepositEmail } from "@/lib/actions/send-deposit-email";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DepositPreviewModalProps {
  deposit: SavedDeposit | null;
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

/** Formate une date ISO en "15/01/2025" */
function formatDateShort(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function DepositPreviewModal({
  deposit,
  open,
  onOpenChange,
}: DepositPreviewModalProps) {
  const router = useRouter();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    if (!deposit) return;
    router.push(`/dashboard/deposits/${deposit.id}/edit`);
    onOpenChange(false);
  }, [deposit, router, onOpenChange]);

  const handleDuplicate = useCallback(async () => {
    if (!deposit) return;
    setIsDuplicating(true);
    try {
      // TODO: Implémenter la duplication d'acompte
      toast.success("Acompte dupliqué !");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la duplication");
    } finally {
      setIsDuplicating(false);
    }
  }, [deposit, onOpenChange]);

  const handleGeneratePdf = useCallback(async () => {
    if (!deposit) return;
    setIsGeneratingPdf(true);
    try {
      // Import dynamique : le module @react-pdf/renderer ne s'exécute qu'au clic
      const { downloadDepositPDF } = await import("@/lib/pdf/deposit-pdf");
      await downloadDepositPDF(deposit);
      toast.success("PDF téléchargé !");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [deposit]);

  const handleSendEmail = useCallback(async () => {
    if (!deposit) return;
    setIsSendingEmail(true);
    try {
      const result = await sendDepositEmail(deposit.id);
      if (result.success) {
        toast.success(`Acompte envoyé à ${deposit.client.email}`);
      } else {
        toast.error(result.error ?? "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur envoi email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsSendingEmail(false);
    }
  }, [deposit]);

  const handlePrint = useCallback(() => {
    // Copie le HTML de l'aperçu + toutes les feuilles de style dans une fenêtre dédiée
    const printArea = document.getElementById("deposit-print-area");
    if (!printArea) return;

    // Récupérer toutes les <link> et <style> du document actuel
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");

    // Petit délai pour éviter l'effet d'agrandissement de la modal
    setTimeout(() => {
      const win = window.open("", "_blank", "width=800,height=1100");
      if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html><head>
  <title>Acompte ${deposit?.number ?? ""}</title>
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
    }, 100); // Délai de 100ms
  }, [deposit]);

  // ── Données calculées ──────────────────────────────────────────────────

  const clientName = useMemo(() => {
    if (!deposit?.client) return "Client inconnu";
    const { client } = deposit;
    if (client.type === "COMPANY") {
      return client.companyName || "Entreprise";
    }
    return `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email || "Client";
  }, [deposit]);

  const clientAddress = useMemo(() => {
    if (!deposit?.client) return null;
    const { client } = deposit;
    const parts = [
      client.address,
      client.postalCode && client.city ? `${client.postalCode} ${client.city}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }, [deposit]);

  // ── Rendu ──────────────────────────────────────────────────────────────

  if (!deposit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl lg:max-w-5xl bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* ── Header du modal : titre + bouton fermer + 5 actions ─────── */}
        <DialogHeader data-print-hide className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-violet-500/20">
          {/* Première ligne : numéro d'acompte + croix */}
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold">
              {deposit ? deposit.number : "Acompte"}
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
              disabled={!deposit}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer size={14} />
              Imprimer
            </button>

            {/* Télécharger PDF */}
            <button
              onClick={handleGeneratePdf}
              disabled={!deposit || isGeneratingPdf}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download size={14} />
              {isGeneratingPdf ? "..." : "PDF"}
            </button>

            {/* Envoyer */}
            <button
              onClick={handleSendEmail}
              disabled={!deposit || isSendingEmail}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={14} />
              {isSendingEmail ? "Envoi..." : "Envoyer"}
            </button>

            {/* Dupliquer */}
            <button
              onClick={handleDuplicate}
              disabled={!deposit || isDuplicating}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Copy size={14} />
              {isDuplicating ? "Duplication..." : "Dupliquer"}
            </button>

            {/* Éditer */}
            <button
              onClick={handleEdit}
              disabled={!deposit}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Pencil size={14} />
              Éditer
            </button>

          </div>
        </DialogHeader>

        {/* ── Corps scrollable : aperçu statique de l'acompte ─────────── */}
        <div id="deposit-print-area" className="overflow-y-auto max-h-[70vh] p-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm">
            {/* En-tête du document avec bandeau coloré */}
            <div className="bg-linear-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 rounded-lg p-4 text-white mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold mb-1">
                    DEMANDE D&apos;ACOMPTE
                  </h1>
                  <p className="text-white/90 text-sm">
                    N° {deposit.number}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-white/90">
                    Date : {formatDateShort(deposit.date)}
                  </p>
                  <p className="text-white/90">
                    Échéance : {formatDateShort(deposit.dueDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Émetteur et destinataire */}
            <div className="grid grid-cols-2 gap-6">
              {/* Émetteur */}
              <div>
                <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Émetteur
                </h3>
                <div className="text-sm space-y-0.5">
                  {deposit.user.companyName && (
                    <p className="font-medium text-slate-900 dark:text-slate-50">{deposit.user.companyName}</p>
                  )}
                  {deposit.user.companyAddress && (
                    <p className="text-slate-600 dark:text-slate-400">{deposit.user.companyAddress}</p>
                  )}
                  {deposit.user.companyPostalCode && deposit.user.companyCity && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {deposit.user.companyPostalCode} {deposit.user.companyCity}
                    </p>
                  )}
                  {deposit.user.companyEmail && (
                    <p className="text-slate-600 dark:text-slate-400">{deposit.user.companyEmail}</p>
                  )}
                  {deposit.user.companyPhone && (
                    <p className="text-slate-600 dark:text-slate-400">{deposit.user.companyPhone}</p>
                  )}
                  {deposit.user.companySiret && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      SIRET : {deposit.user.companySiret}
                    </p>
                  )}
                </div>
              </div>

              {/* Destinataire */}
              <div>
                <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Destinataire
                </h3>
                <div className="text-sm space-y-0.5">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{clientName}</p>
                  {clientAddress && (
                    <p className="text-slate-600 dark:text-slate-400">{clientAddress}</p>
                  )}
                  {deposit.client.email && (
                    <p className="text-slate-600 dark:text-slate-400">{deposit.client.email}</p>
                  )}
                  {deposit.client.phone && (
                    <p className="text-slate-600 dark:text-slate-400">{deposit.client.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Détails de l'acompte */}
            <div>
              <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Détails
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-right p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                        Montant HT
                      </th>
                      <th className="text-right p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                        TVA
                      </th>
                      <th className="text-right p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                        Total TTC
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      <td className="p-3 text-sm text-slate-900 dark:text-slate-50">
                        {deposit.description}
                      </td>
                      <td className="p-3 text-sm text-right text-slate-900 dark:text-slate-50">
                        {fmt(deposit.subtotal)} €
                      </td>
                      <td className="p-3 text-sm text-right text-slate-900 dark:text-slate-50">
                        {fmt(deposit.taxTotal)} €
                      </td>
                      <td className="p-3 text-sm text-right font-medium text-violet-600 dark:text-violet-400">
                        {fmt(deposit.total)} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-500/20">
                <div className="flex justify-between text-sm">
                  <span className="text-violet-700 dark:text-violet-300">Sous-total HT :</span>
                  <span className="text-slate-900 dark:text-slate-50 font-medium">{fmt(deposit.subtotal)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-violet-700 dark:text-violet-300">TVA ({deposit.vatRate}%) :</span>
                  <span className="text-slate-900 dark:text-slate-50 font-medium">{fmt(deposit.taxTotal)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-violet-200 dark:border-violet-500/30 pt-2">
                  <span className="text-slate-900 dark:text-slate-50">Total TTC :</span>
                  <span className="text-violet-600 dark:text-violet-400">{fmt(deposit.total)} €</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {deposit.notes && deposit.notes.trim() && (
              <div>
                <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Notes
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {deposit.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Liens de paiement */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Modalités de paiement
              </h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>• Paiement attendu avant le {formatDateShort(deposit.dueDate)}</p>
                <p>• Liens de paiement sécurisés inclus dans l&apos;email</p>
                
                {(deposit.paymentLinks?.stripe || deposit.paymentLinks?.paypal || deposit.paymentLinks?.sepa) && (
                  <div className="mt-3 space-y-2">
                    {deposit.paymentLinks?.stripe && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span>Carte bancaire (Stripe)</span>
                      </div>
                    )}
                    {deposit.paymentLinks?.paypal && (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <div className="w-3 h-3 rounded bg-linear-to-r from-blue-500 to-yellow-500"></div>
                        <span>PayPal</span>
                      </div>
                    )}
                    {deposit.paymentLinks?.sepa && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}