"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge, type AllStatus } from "@/components/dashboard/status-badge";
import type { SavedDeposit } from "@/hooks/use-deposits";

// ─── Props ──────────────────────────────────────────────────────────────────

interface DepositPreviewModalProps {
  deposit: SavedDeposit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapDepositStatusLabel(status: string): AllStatus {
  switch (status) {
    case "DRAFT":   return "à envoyer";
    case "SENT":    return "envoyé";
    case "PAID":    return "payée";
    case "OVERDUE": return "impayée";
    default:        return "à envoyer";
  }
}

function getClientName(client: SavedDeposit["client"]): string {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatAmountFR(amount: number): string {
  return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

// ─── Composant ──────────────────────────────────────────────────────────────

export function DepositPreviewModal({
  deposit,
  open,
  onOpenChange,
}: DepositPreviewModalProps) {
  // Extraire le taux TVA depuis businessMetadata
  const vatRate = useMemo(() => {
    if (!deposit?.businessMetadata) return 20;
    return (deposit.businessMetadata.vatRate as number) ?? 20;
  }, [deposit]);

  if (!deposit) return null;

  const clientName = getClientName(deposit.client);
  const statusLabel = mapDepositStatusLabel(deposit.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {deposit.number}
            </DialogTitle>
            <StatusBadge status={statusLabel} />
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Informations client */}
          <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
              Client
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {clientName}
            </p>
            <p className="text-xs text-slate-500 dark:text-violet-300/80">
              {deposit.client.email}
            </p>
          </div>

          {/* Montants */}
          <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
              Montants
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-violet-200/80">Montant HT</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatAmountFR(deposit.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-violet-200/80">
                  TVA ({vatRate}%)
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatAmountFR(deposit.taxTotal)}
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-500/30 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-violet-200">
                  Total TTC
                </span>
                <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
                  {formatAmountFR(deposit.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                Émission
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDateFR(deposit.date)}
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                Échéance
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDateFR(deposit.dueDate)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {deposit.notes && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                Notes
              </p>
              <p className="text-sm text-slate-700 dark:text-violet-200/80 whitespace-pre-wrap">
                {deposit.notes}
              </p>
            </div>
          )}

          {/* Bouton fermer */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/20 dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 cursor-pointer transition-all duration-300 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
