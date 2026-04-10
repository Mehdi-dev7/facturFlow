"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { ClientSearch } from "@/components/factures/client-search";
import { recurringSchema, type RecurringFormData } from "@/lib/validations/recurring";
import { useCreateRecurring } from "@/hooks/use-recurring";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Props ──────────────────────────────────────────────────────────────────

interface RecurringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Labels du stepper mobile ────────────────────────────────────────────────

const STEP_LABELS = ["Client & Nom", "Prestations", "Planification"];

// ─── Composant principal ────────────────────────────────────────────────────

export function RecurringModal({ open, onOpenChange }: RecurringModalProps) {
  // step = utilisé uniquement sur mobile pour le stepper
  const [step, setStep] = useState(1);
  const createMutation = useCreateRecurring();

  const form = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      clientId: "",
      label: "",
      paymentMethod: "BANK_TRANSFER",
      frequency: "MONTHLY",
      startDate: "",
      endDate: "",
      lines: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 20 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Total TTC en temps réel
  const watchedLines = form.watch("lines");
  const { currency } = useAppearance();
  const totalTTC = useMemo(() => {
    return watchedLines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      const vat = Number(line.vatRate) || 0;
      return sum + qty * price * (1 + vat / 100);
    }, 0);
  }, [watchedLines]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(async () => {
    if (step === 1) {
      const valid = await form.trigger(["clientId", "label"]);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await form.trigger("lines");
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 3));
  }, [step, form]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleSubmit = useCallback(
    async (data: RecurringFormData) => {
      const result = await createMutation.mutateAsync(data);
      if (result?.success !== false) {
        form.reset();
        setStep(1);
        onOpenChange(false);
      }
    },
    [createMutation, form, onOpenChange],
  );

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        form.reset();
        setStep(1);
      }
      onOpenChange(isOpen);
    },
    [form, onOpenChange],
  );

  // ─── Sections réutilisées sur mobile (par étape) ET desktop (toutes visibles)

  // Sur mobile : visible si c'est l'étape active
  // Sur desktop : toujours visible (sm:block override le hidden)
  const sectionClass = (s: number) =>
    step === s ? "block" : "hidden sm:block";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto p-3 xs:p-3 sm:p-5 bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg font-bold text-slate-900 dark:text-slate-100">
            Nouvelle récurrence
          </DialogTitle>
        </DialogHeader>

        {/* ─── Stepper — mobile uniquement ─────────────────────────────── */}
        <div className="flex items-center gap-1 xs:gap-2 mb-4 sm:hidden overflow-hidden">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1 xs:gap-2 min-w-0 ${
                s < step ? "text-violet-600" : s === step ? "text-violet-600 font-semibold" : "text-slate-400"
              }`}
            >
              <div
                className={`shrink-0 size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  s < step
                    ? "bg-violet-600 text-white"
                    : s === step
                      ? "bg-violet-100 dark:bg-violet-900/50 text-violet-600 border-2 border-violet-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {s < step ? <Check className="size-3" /> : s}
              </div>
              {/* Label visible seulement à partir de xs (400px) */}
              <span className="hidden xs:inline text-xs truncate">{STEP_LABELS[s - 1]}</span>
              {s < 3 && (
                <div className={`h-px flex-1 min-w-2 xs:min-w-4 ${s < step ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent mb-4" />

        <form onSubmit={form.handleSubmit(handleSubmit)}>

          {/* ─── Section 1 : Client & Nom ────────────────────────────────── */}
          <div className={sectionClass(1)}>
            {/* Titre section — desktop uniquement */}
            <p className="hidden sm:block text-xs font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-3">
              Client & Nom
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs xs:text-sm text-slate-700 dark:text-violet-200 mb-2 block">
                  Client *
                </Label>
                <ClientSearch
                  selectedClientId={form.watch("clientId") || undefined}
                  onSelectClient={(clientId) =>
                    form.setValue("clientId", clientId, { shouldValidate: false })
                  }
                  onClear={() => form.setValue("clientId", "", { shouldValidate: false })}
                  error={form.formState.errors.clientId?.message}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="recurring-label" className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
                  Nom de la récurrence *
                </Label>
                <Input
                  id="recurring-label"
                  placeholder="Ex: Maintenance mensuelle"
                  {...form.register("label")}
                  className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm"
                />
                {form.formState.errors.label && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {form.formState.errors.label.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider desktop entre sections */}
          <div className="hidden sm:block h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-300/20 to-transparent my-5" />

          {/* ─── Section 2 : Prestations ─────────────────────────────────── */}
          <div className={sectionClass(2)}>
            <p className="hidden sm:block text-xs font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-3">
              Prestations
            </p>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200 dark:border-violet-400/20 p-3 space-y-3 bg-slate-50/50 dark:bg-[#221c48]/50"
                >
                  {/* Description */}
                  <div>
                    <Label className="text-xs text-slate-600 dark:text-violet-300">Description *</Label>
                    <Input
                      placeholder="Description de la prestation"
                      {...form.register(`lines.${index}.description`)}
                      className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm"
                    />
                    {form.formState.errors.lines?.[index]?.description && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.lines[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  {/* Quantité + Prix + TVA */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-slate-600 dark:text-violet-300">Qté</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 dark:text-violet-300">Prix HT</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                        className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 dark:text-violet-300">TVA</Label>
                      <Controller
                        control={form.control}
                        name={`lines.${index}.vatRate`}
                        render={({ field: vatField }) => (
                          <Select
                            value={String(vatField.value)}
                            onValueChange={(val) => vatField.onChange(Number(val))}
                          >
                            <SelectTrigger className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 rounded-xl">
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5.5">5,5%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="20">20%</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  {/* Supprimer la ligne */}
                  {fields.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="size-3" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Ajouter une ligne */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-primary/20 dark:border-violet-400/50 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 transition-all duration-300 cursor-pointer rounded-xl"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, vatRate: 20 })}
              >
                <Plus className="size-4" />
                Ajouter une ligne
              </Button>

              {/* Récap TTC */}
              <div className="h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Total TTC par échéance
                </span>
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {formatCurrency(totalTTC, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider desktop */}
          <div className="hidden sm:block h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-300/20 to-transparent my-5" />

          {/* ─── Section 3 : Planification ───────────────────────────────── */}
          <div className={sectionClass(3)}>
            <p className="hidden sm:block text-xs font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-3">
              Planification
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Fréquence */}
              <div>
                <Label className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">Fréquence *</Label>
                <Controller
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 rounded-xl">
                        <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                        <SelectItem value="BIWEEKLY">Bi-hebdomadaire</SelectItem>
                        <SelectItem value="MONTHLY">Mensuel</SelectItem>
                        <SelectItem value="QUARTERLY">Trimestriel</SelectItem>
                        <SelectItem value="SEMIYEARLY">Semestriel</SelectItem>
                        <SelectItem value="YEARLY">Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Mode de paiement */}
              <div>
                <Label className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">Mode de paiement *</Label>
                <Controller
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 rounded-xl">
                        <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                        <SelectItem value="STRIPE">Stripe (CB)</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="SEPA">SEPA (GoCardless)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Date de début */}
              <div>
                <Label htmlFor="recurring-start" className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
                  Date de début *
                </Label>
                <Input
                  id="recurring-start"
                  type="date"
                  {...form.register("startDate")}
                  className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm"
                />
                {form.formState.errors.startDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              {/* Date de fin */}
              <div>
                <Label htmlFor="recurring-end" className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
                  Date de fin <span className="text-slate-400 dark:text-slate-500">(optionnelle)</span>
                </Label>
                <Input
                  id="recurring-end"
                  type="date"
                  {...form.register("endDate")}
                  className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <Label htmlFor="recurring-notes" className="text-xs xs:text-sm text-slate-700 dark:text-violet-200">
                  Notes <span className="text-slate-400 dark:text-slate-500">(optionnelles)</span>
                </Label>
                <Textarea
                  id="recurring-notes"
                  placeholder="Notes internes, conditions particulières..."
                  rows={2}
                  {...form.register("notes")}
                  className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* ─── Footer ──────────────────────────────────────────────────── */}
          <div className="h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent mt-6 mb-4" />

          {/* Footer mobile — navigation step-by-step */}
          <div className="flex sm:hidden justify-between gap-3">
            {step === 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="border-slate-200 dark:border-violet-500/30 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-violet-500/10 cursor-pointer rounded-xl"
              >
                Annuler
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="border-slate-200 dark:border-violet-500/30 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-violet-500/10 cursor-pointer rounded-xl"
              >
                <ChevronLeft className="size-4" />
                Retour
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="gradient"
                onClick={handleNext}
                className="cursor-pointer rounded-xl"
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <CreateButton
                type="submit"
                label="Créer"
                disabled={createMutation.isPending}
                size="sm"
              />
            )}
          </div>

          {/* Footer desktop — boutons simples */}
          <div className="hidden sm:flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="border-slate-200 dark:border-violet-500/30 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-violet-500/10 cursor-pointer rounded-xl"
            >
              Annuler
            </Button>
            <CreateButton
              type="submit"
              label="Créer la récurrence"
              disabled={createMutation.isPending}
              className="w-full"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
