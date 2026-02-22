"use client";

import { useCallback, useMemo } from "react";
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
import { useCreateReceipt } from "@/hooks/use-receipts";
import { receiptSchema, RECEIPT_PAYMENT_METHODS, type ReceiptFormData } from "@/lib/types/receipts";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function ReceiptModal({ open, onOpenChange }: ReceiptModalProps) {
  const createMutation = useCreateReceipt();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      clientId:      "",
      amount:        0,
      description:   "",
      paymentMethod: "CASH",
      date:          new Date().toISOString().split("T")[0],
      notes:         "",
    },
  });

  const amount = watch("amount");

  // Aperçu du montant
  const amountDisplay = useMemo(() => {
    const n = Number(amount) || 0;
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }, [amount]);

  const handleSelectClient = useCallback(
    (clientId: string) => setValue("clientId", clientId, { shouldValidate: false }),
    [setValue],
  );

  const handleClearClient = useCallback(
    () => setValue("clientId", "", { shouldValidate: false }),
    [setValue],
  );

  const onSubmit = useCallback(
    (data: ReceiptFormData) => {
      createMutation.mutate(data, {
        onSuccess: (result) => {
          if (result.success) {
            reset();
            onOpenChange(false);
          }
        },
      });
    },
    [createMutation, reset, onOpenChange],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    },
    [reset, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Nouveau reçu
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Client */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-violet-200">Client *</Label>
            <ClientSearch
              selectedClientId={watch("clientId") || undefined}
              onSelectClient={handleSelectClient}
              onClear={handleClearClient}
              error={errors.clientId?.message}
            />
          </div>

          {/* Objet du paiement */}
          <div className="space-y-1.5">
            <Label htmlFor="receipt-description" className="text-slate-700 dark:text-violet-200">
              Objet du paiement *
            </Label>
            <Input
              id="receipt-description"
              placeholder="Ex: Paiement facture FAC-2024-0001"
              {...register("description")}
              className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50"
            />
            {errors.description && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Ligne : montant + mode de paiement */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="receipt-amount" className="text-slate-700 dark:text-violet-200">
                Montant *
              </Label>
              <div className="relative">
                <Input
                  id="receipt-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register("amount", { valueAsNumber: true })}
                  className="pr-8 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-violet-400/60">
                  €
                </span>
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.amount.message}</p>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <Label className="text-slate-700 dark:text-violet-200">Mode de paiement</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25">
                      {RECEIPT_PAYMENT_METHODS.map((m) => (
                        <SelectItem
                          key={m.value}
                          value={m.value}
                          className="focus:bg-violet-100 dark:focus:bg-violet-500/20 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer"
                        >
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Récap montant */}
          <div className="flex items-center justify-between rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] px-4 py-3">
            <span className="text-sm font-medium text-slate-700 dark:text-violet-200">
              Montant encaissé
            </span>
            <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
              {amountDisplay}
            </span>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="receipt-date" className="text-slate-700 dark:text-violet-200">
              Date du paiement
            </Label>
            <Input
              id="receipt-date"
              type="date"
              {...register("date")}
              className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="receipt-notes" className="text-slate-700 dark:text-violet-200">
              Notes
            </Label>
            <Textarea
              id="receipt-notes"
              rows={2}
              placeholder="Notes optionnelles..."
              {...register("notes")}
              className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 resize-none"
            />
          </div>

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
              "Créer le reçu"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
