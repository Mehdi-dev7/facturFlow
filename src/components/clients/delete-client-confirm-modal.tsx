"use client";

// Modale de confirmation de suppression d'un client
// Avertit que le client ET tous ses documents seront supprimés définitivement

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
import type { SavedClient } from "@/hooks/use-clients";

// ─── Props ──────────────────────────────────────────────────────────────────

interface DeleteClientConfirmModalProps {
  client: SavedClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export function DeleteClientConfirmModal({
  client,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteClientConfirmModalProps) {
  const hasDocuments = (client?.documentCount ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] max-w-md p-3 xs:p-3 sm:p-5 bg-white dark:bg-[#1e1845] border border-red-200 dark:border-red-500/30 rounded-xl shadow-xl dark:shadow-red-950/40">

        {/* Icône d'avertissement */}
        <div className="flex justify-center mb-1 pt-1">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <AlertDialogHeader className="text-center space-y-2">
          <AlertDialogTitle className="text-base xs:text-lg font-semibold text-slate-900 dark:text-slate-100">
            Supprimer ce client ?
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {/* Nom du client */}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Vous êtes sur le point de supprimer{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {client?.name}
                </span>
                .
              </p>

              {/* Avertissement cascade si documents liés */}
              {hasDocuments && (
                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-left">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 leading-snug">
                    Ce client a{" "}
                    {client!.documentCount} document{client!.documentCount > 1 ? "s" : ""} associé{client!.documentCount > 1 ? "s" : ""}.
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300/80 mt-0.5 leading-snug">
                    Ce client et tous ses documents liés seront supprimés définitivement.
                  </p>
                </div>
              )}

              {!hasDocuments && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cette action est irréversible.
                </p>
              )}
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

          {/* Confirmer la suppression */}
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
