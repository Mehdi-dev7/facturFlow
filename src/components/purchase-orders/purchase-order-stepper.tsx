"use client";
// src/components/purchase-orders/purchase-order-stepper.tsx
// Stepper mobile pour la création/édition de bons de commande

import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ChevronRight, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateButton } from "@/components/shared/create-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PurchaseOrderForm } from "./purchase-order-form";
import { PurchaseOrderPreview } from "./purchase-order-preview";
import type { PurchaseOrderFormData, CompanyInfo } from "@/lib/validations/purchase-order";

// ─── Étapes ───────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Émetteur & Client" },
  { id: 2, label: "Lignes" },
  { id: 3, label: "Options" },
  { id: 4, label: "Récapitulatif" },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PurchaseOrderStepperProps {
  form: UseFormReturn<PurchaseOrderFormData>;
  onSubmit: (data: PurchaseOrderFormData) => void;
  orderNumber: string;
  companyInfo: CompanyInfo | null;
  onCompanyChange: (data: CompanyInfo) => void;
  submitLabel?: string;
  themeColor?: string;
  companyFont?: string;
  companyLogo?: string | null;
  companyName?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function PurchaseOrderStepper({
  form,
  onSubmit,
  orderNumber,
  companyInfo,
  onCompanyChange,
  submitLabel = "Créer",
  themeColor,
  companyFont,
  companyLogo,
  companyName,
}: PurchaseOrderStepperProps) {
  const [step, setStep] = useState(1);

  // Validation des champs requis avant passage à l'étape suivante
  const validateStep = useCallback(
    async (currentStep: number) => {
      const fieldsMap: Record<number, (keyof PurchaseOrderFormData)[]> = {
        1: ["clientId", "date"],   // deliveryDate est optionnel, pas de validation requise
        2: ["lines"],
        3: [],                      // notes est optionnel
      };
      const fields = fieldsMap[currentStep];
      if (!fields || fields.length === 0) return true;
      return await form.trigger(fields);
    },
    [form],
  );

  const handleNext = useCallback(async () => {
    const valid = await validateStep(step);
    if (valid && step < 4) setStep((s) => s + 1);
  }, [step, validateStep]);

  const handlePrev = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Indicateurs d'étapes + barre de progression */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 flex-1">
              {/* Cercle numéroté */}
              <div
                className={`flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-all duration-300 shrink-0 ${
                  step >= s.id
                    ? "bg-violet-600 text-white shadow-lg"
                    : "bg-slate-200 dark:bg-violet-950/40 text-slate-500 dark:text-violet-400/60"
                }`}
              >
                {step > s.id ? <Check className="size-3.5" /> : s.id}
              </div>
              {/* Label caché sur petit mobile */}
              <span
                className={`text-[10px] sm:text-xs hidden sm:inline transition-colors overflow-hidden ${
                  step >= s.id
                    ? "text-violet-600 dark:text-violet-400 font-medium"
                    : "text-slate-400 dark:text-violet-400/60"
                }`}
              >
                {s.label}
              </span>
              {/* Trait de connexion */}
              {s.id < STEPS.length && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                    step > s.id
                      ? "bg-violet-600"
                      : "bg-slate-200 dark:bg-violet-950/40"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        {/* Barre de progression */}
        <div className="h-1 bg-slate-200 dark:bg-violet-950/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Contenu de l'étape courante */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step < 4 ? (
          // Étapes 1-3 : sections du formulaire
          <PurchaseOrderForm
            form={form}
            onSubmit={onSubmit}
            orderNumber={orderNumber}
            companyInfo={companyInfo}
            onCompanyChange={onCompanyChange}
            visibleStep={step as 1 | 2 | 3}
            hideSubmit
          />
        ) : (
          // Étape 4 : récapitulatif
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-violet-400 uppercase tracking-wider">
              Récapitulatif
            </h3>
            <PurchaseOrderPreview
              form={form}
              orderNumber={orderNumber}
              companyInfo={companyInfo}
              themeColor={themeColor}
              companyFont={companyFont}
              companyLogo={companyLogo}
              companyName={companyName}
              compact
            />
          </div>
        )}
      </div>

      {/* Navigation bas de page */}
      <div className="border-t border-slate-200 dark:border-violet-500/20 px-4 pt-3 pb-2 bg-white/50 dark:bg-[#1a1438]/50 backdrop-blur-sm space-y-2">
        {/* Ligne 1 : Précédent + Suivant/Créer */}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={step === 1}
            className="border-violet-500/20 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 transition-all duration-300 cursor-pointer"
          >
            Précédent
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="cursor-pointer transition-all duration-300 hover:scale-105 bg-violet-600 hover:bg-violet-700 text-white"
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <CreateButton
              label={submitLabel}
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
            />
          )}
        </div>

        {/* Ligne 2 : Bouton aperçu */}
        <div className="flex justify-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-500/10 transition-all duration-300 cursor-pointer text-xs border border-slate-200 dark:border-violet-500/30"
              >
                <Eye className="size-3.5" />
                Aperçu
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1a1438] dark:via-[#1a1438] dark:to-[#1a1438]">
              <SheetHeader>
                <SheetTitle className="text-slate-900 dark:text-slate-100">Aperçu du bon de commande</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <PurchaseOrderPreview
                  form={form}
                  orderNumber={orderNumber}
                  companyInfo={companyInfo}
                  themeColor={themeColor}
                  companyFont={companyFont}
                  companyLogo={companyLogo}
                  compact
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
