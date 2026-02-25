"use client";

// Modale de confirmation de suppression générique
// Utilisée pour factures, devis, acomptes, reçus

import { AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// ─── Props ──────────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  /** Ex: "la facture", "le devis", "l'acompte", "le reçu" */
  documentLabel: string;
  /** Numéro du document, ex: "FAC-2025-0001" */
  documentNumber: string;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  documentLabel,
  documentNumber,
}: DeleteConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] max-w-md bg-white dark:bg-[#1e1845] border border-red-200 dark:border-red-500/30 rounded-xl shadow-xl dark:shadow-red-950/40">

        {/* Icône d'avertissement */}
        <div className="flex justify-center mb-1 pt-1">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <AlertDialogHeader className="text-center space-y-2">
          <AlertDialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Supprimer ce document ?
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Vous êtes sur le point de supprimer{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {documentLabel}
                </span>{" "}
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {documentNumber}
                </span>
                .
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cette action est irréversible.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-2">
          {/* Annuler */}
          <AlertDialogCancel
            disabled={isDeleting}
            className="w-full sm:w-auto border-slate-200 dark:border-violet-500/30 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-violet-500/10 cursor-pointer"
          >
            Annuler
          </AlertDialogCancel>

          {/* Confirmer */}
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white border-0 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={14} className="mr-1.5" />
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
