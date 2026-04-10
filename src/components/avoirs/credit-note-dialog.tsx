"use client";

// Dialog de création d'un avoir — s'ouvre depuis la modal de prévisualisation d'une facture payée

import { useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateButton } from "@/components/shared/create-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileMinus } from "lucide-react";
import { toast } from "sonner";
import { createCreditNote } from "@/lib/actions/credit-notes";
import { sendCreditNoteEmail } from "@/lib/actions/send-credit-note-email";
import { CREDIT_NOTE_REASONS } from "@/lib/types/credit-notes";
import { useQueryClient } from "@tanstack/react-query";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreditNoteDialogProps {
  invoice: {
    id: string;
    number: string;
    total: number;
    client: { email: string };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Schema Zod du formulaire ─────────────────────────────────────────────────

const formSchema = z
  .object({
    type: z.enum(["full", "partial"]),
    amount: z.number().positive("Montant invalide").optional(),
    reason: z.string().min(1, "Motif requis"),
    notes: z.string().optional(),
  })
  .refine(
    (d) => {
      // Si avoir partiel, le montant est obligatoire
      if (d.type === "partial") return d.amount !== undefined && d.amount > 0;
      return true;
    },
    { message: "Montant requis pour un avoir partiel", path: ["amount"] },
  );

type FormData = z.infer<typeof formSchema>;

// ─── Classes CSS partagées (identiques aux autres modals du projet) ────────────

const inputClass =
  "text-xs xs:text-sm bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

const selectTriggerClass =
  "text-xs xs:text-sm bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 cursor-pointer";

const selectContentClass =
  "bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25";

const selectItemClass =
  "text-xs xs:text-sm focus:bg-violet-100 dark:focus:bg-violet-500/20 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer";

// ─── Composant ────────────────────────────────────────────────────────────────

export function CreditNoteDialog({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: CreditNoteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { currency } = useAppearance();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      type: "full",
      reason: "",
      notes: "",
    },
  });

  const selectedType = watch("type");

  // Formate le montant pour l'aperçu dans le récap
  const watchedAmount = watch("amount");
  const displayAmount =
    selectedType === "full"
      ? formatCurrency(invoice.total, currency)
      : watchedAmount
      ? formatCurrency(watchedAmount, currency)
      : "—";

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    },
    [reset, onOpenChange],
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      setIsSubmitting(true);
      try {
        // 1. Créer l'avoir en base
        const createResult = await createCreditNote({
          invoiceId: invoice.id,
          type: data.type,
          amount: data.type === "partial" ? data.amount : undefined,
          reason: data.reason,
          notes: data.notes,
        });

        if (!createResult.success) {
          toast.error(createResult.error ?? "Erreur lors de la création de l'avoir");
          return;
        }

        // 2. Envoyer l'email avec le PDF en pièce jointe
        const emailResult = await sendCreditNoteEmail(createResult.data.id);

        if (emailResult.success) {
          toast.success(`Avoir créé et envoyé à ${invoice.client.email}`);
        } else {
          // L'avoir est créé mais l'email a échoué — on prévient sans bloquer
          toast.warning("Avoir créé mais l'envoi email a échoué. Vous pouvez le télécharger depuis la page Avoirs.");
        }

        // 3. Invalider le cache pour rafraîchir la liste des avoirs
        queryClient.invalidateQueries({ queryKey: ["credit-notes"] });

        reset();
        onOpenChange(false);
        onSuccess?.();
      } finally {
        setIsSubmitting(false);
      }
    },
    [invoice, queryClient, reset, onOpenChange, onSuccess],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-md max-h-[90dvh] overflow-y-auto p-3 xs:p-4 sm:p-5 bg-linear-to-b from-rose-50 via-white to-white dark:from-[#2a1c1c] dark:via-[#221c48] dark:to-[#221c48] border border-rose-200/60 dark:border-rose-500/25 shadow-lg dark:shadow-rose-950/40"
      >
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileMinus className="size-4 xs:size-5 text-rose-500 shrink-0" />
            Émettre un avoir
          </DialogTitle>
        </DialogHeader>

        {/* Récapitulatif de la facture concernée */}
        <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/20 px-3 py-2.5 text-xs xs:text-sm">
          <p className="text-slate-500 dark:text-rose-300/70">Avoir pour la facture</p>
          <p className="font-semibold text-rose-700 dark:text-rose-400">
            {invoice.number}{" "}
            <span className="text-slate-600 dark:text-slate-300 font-normal">
              — {formatCurrency(invoice.total, currency)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 xs:space-y-4 mt-1">
          {/* Type d'avoir : total ou partiel — inputs radio natifs */}
          <div className="space-y-2">
            <Label className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
              Type d&apos;avoir *
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-4">
                  {/* Option Total */}
                  <label htmlFor="type-full" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      id="type-full"
                      value="full"
                      checked={field.value === "full"}
                      onChange={() => field.onChange("full")}
                      className="accent-rose-600 cursor-pointer"
                    />
                    <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300">
                      Total (intégral)
                    </span>
                  </label>

                  {/* Option Partiel */}
                  <label htmlFor="type-partial" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      id="type-partial"
                      value="partial"
                      checked={field.value === "partial"}
                      onChange={() => field.onChange("partial")}
                      className="accent-rose-600 cursor-pointer"
                    />
                    <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300">
                      Partiel
                    </span>
                  </label>
                </div>
              )}
            />
          </div>

          {/* Montant (affiché uniquement si "Partiel") */}
          {selectedType === "partial" && (
            <div className="space-y-1.5">
              <Label htmlFor="credit-amount" className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
                Montant de l&apos;avoir *{" "}
                <span className="text-slate-400 font-normal">
                  (max {formatCurrency(invoice.total, currency)})
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="credit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={invoice.total}
                  placeholder="0.00"
                  {...register("amount", { valueAsNumber: true })}
                  className={`pr-7 ${inputClass}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs xs:text-sm text-slate-400 dark:text-violet-400/60">
                  €
                </span>
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.amount.message}</p>
              )}
            </div>
          )}

          {/* Motif */}
          <div className="space-y-1.5">
            <Label className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
              Motif *
            </Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Sélectionner un motif..." />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {CREDIT_NOTE_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className={selectItemClass}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reason && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.reason.message}</p>
            )}
          </div>

          {/* Notes optionnelles */}
          <div className="space-y-1.5">
            <Label htmlFor="credit-notes" className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
              Notes
            </Label>
            <Textarea
              id="credit-notes"
              rows={2}
              placeholder="Informations complémentaires (optionnel)..."
              {...register("notes")}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Récapitulatif du montant à créditer */}
          <div className="flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-500/25 bg-rose-50/80 dark:bg-rose-950/20 px-3 xs:px-4 py-2.5 xs:py-3">
            <span className="text-xs xs:text-sm font-medium text-slate-700 dark:text-rose-200">
              Net à déduire
            </span>
            <span className="text-base xs:text-lg font-bold text-rose-600 dark:text-rose-400">
              − {displayAmount}
            </span>
          </div>

          {/* Bouton de soumission */}
          <CreateButton
            type="submit"
            label="Émettre l'avoir + Envoyer par email"
            disabled={isSubmitting}
            variant="default"
            className="w-full text-xs xs:text-sm bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
