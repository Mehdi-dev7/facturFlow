"use client";

import { useState, useMemo, useCallback } from "react";
import { Controller, useWatch, type UseFormReturn, type FieldErrors } from "react-hook-form";
import {
  Building2,
  AlertCircle,
  Calendar,
  Euro,
  FileText,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ClientSearch } from "@/components/factures/client-search";
import { CompanyInfoModal } from "@/components/factures/company-info-modal";
import type { CompanyInfo } from "@/lib/validations/invoice";

// ─── Types ─────────────────────────────────────────────────────────────────

interface DepositFormData {
  clientId: string;
  amount: number;
  vatRate: 0 | 5.5 | 10 | 20;
  date: string;
  dueDate: string;
  description: string;
  notes?: string;
  paymentLinks: {
    stripe: boolean;
    paypal: boolean;
    sepa: boolean;
  };
}

interface DepositFormProps {
  form: UseFormReturn<DepositFormData>;
  onSubmit: (data: DepositFormData) => void;
  companyInfo: CompanyInfo | null;
  onCompanyChange: (data: CompanyInfo) => void;
  isSubmitting: boolean;
}

// ─── Styles partagés ─────────────────────────────────────────────────────────

const dividerClass = "mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent";
const inputClass = "bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

// ─── Composant principal ──────────────────────────────────────────────────────

export function DepositForm({
  form,
  onSubmit,
  companyInfo,
  onCompanyChange,
  isSubmitting,
}: DepositFormProps) {
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const { register, handleSubmit, setValue, control, formState: { errors } } = form;
  // register est utilisé pour date, dueDate, description, notes

  // Watch les champs pour la réactivité temps réel
  const amount = useWatch({ control, name: "amount" });
  const vatRate = useWatch({ control, name: "vatRate" });
  const clientId = useWatch({ control, name: "clientId" });

  const calculations = useMemo(() => {
    const subtotal = Number(amount) || 0;
    // vatRate ?? 20 : gère le cas 0% (exonéré) qui est falsy avec ||
    const rate = vatRate ?? 20;
    const taxAmount = (subtotal * Number(rate)) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [amount, vatRate]);

  // Gestion des clients
  const handleSelectClient = useCallback((clientId: string) => {
    setValue("clientId", clientId);
  }, [setValue]);

  const handleClearClient = useCallback(() => {
    setValue("clientId", "");
  }, [setValue]);

  const onError = useCallback((errors: FieldErrors<DepositFormData>) => {
    console.log("Erreurs:", errors);
    toast.error("Veuillez corriger les erreurs du formulaire");
  }, []);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        {/* ── Émetteur ────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
              Émetteur
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowCompanyModal(true)}
              className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
            >
              {companyInfo ? "Modifier" : "Compléter"}
            </Button>
          </div>
          {companyInfo ? (
            <div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-100/60 dark:bg-[#251e4d] p-3.5 text-sm shadow-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{companyInfo.name}</p>
              <p className="text-slate-500 dark:text-violet-300/80 mt-0.5">SIRET : {companyInfo.siret}</p>
              <p className="text-slate-500 dark:text-violet-300/80">
                {companyInfo.address}, {companyInfo.city}
              </p>
              <p className="text-slate-500 dark:text-violet-300/80">
                {companyInfo.email}
                {companyInfo.phone ? ` — ${companyInfo.phone}` : ""}
              </p>
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-400/50 bg-amber-50/80 dark:bg-amber-900/15 p-4 text-center cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/25 transition-all duration-300"
              onClick={() => setShowCompanyModal(true)}
            >
              <AlertCircle className="size-5 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Informations entreprise manquantes
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/60">Cliquez pour compléter</p>
            </button>
          )}
        </section>

        <div className={dividerClass} />

        {/* ── Destinataire ─────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
            Destinataire
          </h3>
          <ClientSearch
            selectedClientId={clientId}
            onSelectClient={handleSelectClient}
            onClear={handleClearClient}
            error={errors.clientId?.message}
          />
        </section>

        <div className={dividerClass} />
          {/* ── Dates ──────────────────────────────────────────── */}
          <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="size-4 text-violet-600 dark:text-violet-400" />
            Dates
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Date d&apos;émission *
              </Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                className={inputClass}
              />
              {errors.date && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Date d&apos;échéance *
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className={inputClass}
              />
              {errors.dueDate && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Détails de l'acompte ──────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Euro className="size-4 text-violet-600 dark:text-violet-400" />
            Détails de l&apos;acompte
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Description *
              </Label>
              {/* Controller (contrôlé) au lieu de register (non-contrôlé) :
                  évite la perte de valeur au re-render — même fix que quote-form.tsx */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input
                    id="description"
                    {...field}
                    placeholder="Acompte 30% - Projet X"
                    className={inputClass}
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Montant HT *
              </Label>
              {/* Controller garantit la réactivité de useWatch pour les inputs number */}
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.onBlur}
                    placeholder="0.00"
                    className={inputClass}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatRate" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Taux de TVA
              </Label>
              <Controller
                name="vatRate"
                control={control}
                render={({ field }) => (
                  <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                    <SelectTrigger className="h-10 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-sm text-slate-900 dark:text-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" avoidCollisions={false} className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
                      <SelectItem value="0" className="cursor-pointer rounded-lg transition-colors text-sm dark:text-slate-100 hover:bg-violet-200/70 data-highlighted:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-highlighted:bg-violet-500/25 data-highlighted:text-violet-900 dark:data-highlighted:text-slate-50">
                        0% (exonéré)
                      </SelectItem>
                      <SelectItem value="5.5" className="cursor-pointer rounded-lg transition-colors text-sm dark:text-slate-100 hover:bg-violet-200/70 data-highlighted:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-highlighted:bg-violet-500/25 data-highlighted:text-violet-900 dark:data-highlighted:text-slate-50">
                        5,5% (réduit)
                      </SelectItem>
                      <SelectItem value="10" className="cursor-pointer rounded-lg transition-colors text-sm dark:text-slate-100 hover:bg-violet-200/70 data-highlighted:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-highlighted:bg-violet-500/25 data-highlighted:text-violet-900 dark:data-highlighted:text-slate-50">
                        10% (intermédiaire)
                      </SelectItem>
                      <SelectItem value="20" className="cursor-pointer rounded-lg transition-colors text-sm dark:text-slate-100 hover:bg-violet-200/70 data-highlighted:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-highlighted:bg-violet-500/25 data-highlighted:text-violet-900 dark:data-highlighted:text-slate-50">
                        20% (normal)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Récapitulatif des montants */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Récapitulatif
              </Label>
              <div className="rounded-xl border  bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border-violet-200/50 dark:border-violet-500/20 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Montant HT :</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{calculations.subtotal > 0 ? calculations.subtotal.toFixed(2) : "0,00"} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">TVA ({vatRate ?? 20}%) :</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{calculations.taxAmount > 0 ? calculations.taxAmount.toFixed(2) : "0,00"} €</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 dark:border-slate-600 pt-1 font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Total TTC :</span>
                  <span className="text-violet-600 dark:text-violet-400">{calculations.total > 0 ? calculations.total.toFixed(2) : "0,00"} €</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      
        <div className={dividerClass} />

        {/* ── Liens de paiement ──────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LinkIcon className="size-4 text-violet-600 dark:text-violet-400" />
            Liens de paiement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              name="paymentLinks.stripe"
              control={control}
              render={({ field }) => (
                <div className={`flex items-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                  field.value 
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600/30'
                }`}>
                  <Checkbox
                    id="stripe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="text-slate-500 dark:text-violet-400"
                  />
                  <Label htmlFor="stripe" className="text-sm font-medium cursor-pointer flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <div className="w-3 h-3 rounded bg-blue-500 "></div>
                    Carte bancaire (Stripe)
                  </Label>
                </div>
              )}
            />

            <Controller
              name="paymentLinks.paypal"
              control={control}
              render={({ field }) => (
                <div className={`flex items-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                  field.value 
                    ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-500/30 dark:bg-yellow-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-yellow-200 dark:hover:border-yellow-600/30'
                }`}>
                  <Checkbox
                    id="paypal"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="text-slate-500 dark:text-violet-400"
                  />
                  <Label htmlFor="paypal" className="text-sm font-medium cursor-pointer flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <div className="w-3 h-3 rounded bg-linear-to-r from-blue-500 to-yellow-500"></div>
                    PayPal
                  </Label>
                </div>
              )}
            />

            <Controller
              name="paymentLinks.sepa"
              control={control}
              render={({ field }) => (
                <div className={`flex items-center space-x-2 rounded-lg border-2 p-3  transition-all ${
                  field.value 
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-600/30'
                }`}>
                  <Checkbox
                    id="sepa"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="text-slate-500 dark:text-violet-400"
                  />
                  <Label htmlFor="sepa" className="text-sm font-medium cursor-pointer flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    Prélèvement SEPA (GoCardless)
                  </Label>
                </div>
              )}
            />
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Notes ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="size-4 text-violet-600 dark:text-violet-400" />
            Notes (optionnel)
          </h3>

          <div className="space-y-2">
            <Textarea
              {...register("notes")}
              placeholder="Notes additionnelles pour le client..."
              rows={3}
              className={inputClass}
            />
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Actions ─────────────────────────────────────────── */}
        <section className="lg:ml-auto lg:w-1/3">
          <Button
            type="submit"
						variant="gradient"
						disabled={isSubmitting}
						className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-101 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full size-4 border-2 border-white/30 border-t-white" />
                Création...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Créer l&apos;acompte
              </>
            )}
          </Button>
        </section>
      </form>

      {/* Modale informations entreprise */}
      <CompanyInfoModal
        open={showCompanyModal}
        onOpenChange={setShowCompanyModal}
        onSave={onCompanyChange}
      />
    </>
  );
}