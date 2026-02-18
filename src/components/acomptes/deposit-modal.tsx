"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { ClientSearch } from "@/components/factures/client-search";
import { useCreateDeposit } from "@/hooks/use-deposits";
import { depositSchema, type DepositFormData } from "@/lib/types/deposits";

// ─── Props ──────────────────────────────────────────────────────────────────

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const createMutation = useCreateDeposit();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      clientId: "",
      amount: 0,
      vatRate: 20,
      dueDate: "",
      notes: "",
    },
  });

  const amount = watch("amount");
  const vatRate = watch("vatRate");

  // Total TTC calculé en live
  const totalTTC = useMemo(() => {
    const a = Number(amount) || 0;
    const v = Number(vatRate) || 0;
    return a * (1 + v / 100);
  }, [amount, vatRate]);

  // Sélection d'un client existant
  const handleSelectClient = useCallback(
    (clientId: string) => {
      setSelectedClientId(clientId);
      setValue("clientId", clientId, { shouldValidate: true });
    },
    [setValue],
  );

  // Réinitialiser le client
  const handleClearClient = useCallback(() => {
    setSelectedClientId(undefined);
    setValue("clientId", "", { shouldValidate: true });
  }, [setValue]);

  // Soumission
  const onSubmit = useCallback(
    (data: DepositFormData) => {
      createMutation.mutate(data, {
        onSuccess: (result) => {
          if (result.success) {
            reset();
            setSelectedClientId(undefined);
            onOpenChange(false);
          }
        },
      });
    },
    [createMutation, reset, onOpenChange],
  );

  // Reset quand le modal se ferme
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        reset();
        setSelectedClientId(undefined);
      }
      onOpenChange(isOpen);
    },
    [reset, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Nouvel acompte
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Client */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-violet-200">Client *</Label>
            <ClientSearch
              selectedClientId={selectedClientId}
              onSelectClient={handleSelectClient}
              onClear={handleClearClient}
              error={errors.clientId?.message}
            />
          </div>

          {/* Montant HT */}
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount" className="text-slate-700 dark:text-violet-200">
              Montant HT *
            </Label>
            <div className="relative">
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
                className="pr-8 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                aria-invalid={!!errors.amount}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-violet-400/60">
                €
              </span>
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.amount.message}</p>
            )}
          </div>

          {/* TVA */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-violet-200">Taux de TVA</Label>
            <Controller
              name="vatRate"
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25">
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5.5">5,5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Total TTC en live */}
          <div className="flex items-center justify-between rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] px-4 py-3">
            <span className="text-sm font-medium text-slate-700 dark:text-violet-200">
              Total TTC
            </span>
            <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
              {totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </span>
          </div>

          {/* Date d'échéance */}
          <div className="space-y-1.5">
            <Label htmlFor="deposit-due-date" className="text-slate-700 dark:text-violet-200">
              Date d&apos;échéance *
            </Label>
            <Input
              id="deposit-due-date"
              type="date"
              {...register("dueDate")}
              className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
              aria-invalid={!!errors.dueDate}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="deposit-notes" className="text-slate-700 dark:text-violet-200">
              Notes
            </Label>
            <Textarea
              id="deposit-notes"
              rows={3}
              placeholder="Notes optionnelles..."
              {...register("notes")}
              className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 resize-none"
            />
          </div>

          {/* Bouton submit */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Création...
              </>
            ) : (
              "Créer l'acompte"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
