"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/lib/actions/account";
import { signOut } from "@/lib/auth-client";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Composant ──────────────────────────────────────────────────────────────────

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success("Compte supprimé. À bientôt !");
        await signOut();
        router.push("/");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
        setIsDeleting(false);
      }
    } catch {
      toast.error("Erreur inattendue");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="bg-white dark:bg-slate-900 border-red-200 dark:border-red-500/30 rounded-2xl max-w-xs xs:max-w-sm">
        {/* Header — div plain pour forcer le centrage sans être override par AlertDialogHeader */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Supprimer mon compte
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées : factures, devis, clients, produits et documents. Conformément au RGPD, aucune donnée ne sera conservée.
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <AlertDialogCancel
            onClick={onClose}
            className="rounded-xl border-slate-300 dark:border-violet-400/30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
