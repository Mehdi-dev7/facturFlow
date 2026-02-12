"use client";

import React, { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteMessage?: string;
}

/* ─── Mobile: MoreHorizontal dropdown ─── */
export function ActionMenuMobile({ onEdit, onDelete, deleteMessage = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible." }: ActionMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1e1b4b] dark:via-[#1a1438] dark:to-[#1a1438] border border-primary/20 dark:border-violet-500/20 shadow-lg dark:shadow-violet-950/40 rounded-xl p-1 overflow-hidden">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer rounded-lg focus:bg-violet-100 focus:text-violet-700 dark:focus:bg-violet-500/15 dark:focus:text-violet-300">
              <Pencil className="h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={() => setShowConfirm(true)}
              className="gap-2 cursor-pointer rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-500/10 dark:focus:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1e1b4b] dark:via-[#1a1438] dark:to-[#1a1438] border border-primary/20 dark:border-violet-500/20 shadow-lg dark:shadow-violet-950/40 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">{deleteMessage}</DialogDescription>
          </DialogHeader>
          <div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent" />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="cursor-pointer border-primary/20 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200">
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirm(false);
                onDelete?.();
              }}
              className="cursor-pointer border-red-500 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Desktop: Inline icons ─── */
export function ActionButtons({ onEdit, onDelete, deleteMessage = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible." }: ActionMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
            aria-label="Modifier"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-100 dark:text-red-400/60 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-all duration-300 cursor-pointer"
            aria-label="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1e1b4b] dark:via-[#1a1438] dark:to-[#1a1438] border border-primary/20 dark:border-violet-500/20 shadow-lg dark:shadow-violet-950/40 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">{deleteMessage}</DialogDescription>
          </DialogHeader>
          <div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent" />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="cursor-pointer border-primary/20 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/20 dark:text-slate-200 mx-4">
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirm(false);
                onDelete?.();
              }}
              className="cursor-pointer border-red-500 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/50 dark:hover:text-slate-200"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Keep backward-compat export ─── */
export const ActionMenu = ActionMenuMobile;
