"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Save, AlertCircle, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompanyInfo, useUpdateCompanyInfo } from "@/hooks/use-company";
import { useAppearance } from "@/hooks/use-appearance";
import { SiretLookupInput } from "@/components/shared/siret-lookup-input";
import { saveCurrency } from "@/lib/actions/account";
import { CURRENCIES } from "@/lib/utils/calculs-facture";
import type { SiretData } from "@/types/siret";

// ─── Schema de validation ─────────────────────────────────────────────────────

const companySchema = z.object({
  companyName: z.string().optional(),
  companySiren: z
    .string()
    .refine((v) => !v || /^\d{9}$/.test(v), "SIREN doit faire 9 chiffres")
    .optional(),
  companySiret: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPostalCode: z.string().optional(),
  companyCity: z.string().optional(),
  companyEmail: z
    .union([z.literal(""), z.string().email("Email professionnel invalide")])
    .optional(),
  companyPhone: z.string().optional(),
  // Informations bancaires — affichées sur les factures pour le virement
  iban: z.string().optional(),
  bic: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CompanyPage() {
  const { data: companyInfo, isLoading } = useCompanyInfo();
  const updateMutation = useUpdateCompanyInfo();
  const { currency: currentCurrency } = useAppearance();
  const [selectedCurrency, setSelectedCurrency] = useState("EUR");
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const queryClient = useQueryClient();

  // Synchroniser avec la devise réelle une fois chargée
  useEffect(() => {
    if (currentCurrency) setSelectedCurrency(currentCurrency);
  }, [currentCurrency]);

  const handleSaveCurrency = async () => {
    setIsSavingCurrency(true);
    const result = await saveCurrency(selectedCurrency);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["appearance"] });
      toast.success("Devise mise à jour !");
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde");
    }
    setIsSavingCurrency(false);
  };

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      companySiren: "",
      companySiret: "",
      companyVatNumber: "",
      companyAddress: "",
      companyPostalCode: "",
      companyCity: "",
      companyEmail: "",
      companyPhone: "",
      iban: "",
      bic: "",
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = form;

  // Souscrire aux changements du form → force un re-render quand setValue/reset modifie les valeurs
  // Sans ça, les inputs register() (non-contrôlés) ne se mettent pas à jour visuellement
  // C'est ce qui fait marcher le SIRET auto-fill dans le form client (qui a watch("type"))
  watch();

  // Charger les données de l'entreprise
  useEffect(() => {
    if (companyInfo) {
      reset({
        companyName: companyInfo.companyName || "",
        companySiren: companyInfo.companySiren || "",
        companySiret: companyInfo.companySiret || "",
        companyVatNumber: companyInfo.companyVatNumber || "",
        companyAddress: companyInfo.companyAddress || "",
        companyPostalCode: companyInfo.companyPostalCode || "",
        companyCity: companyInfo.companyCity || "",
        companyEmail: companyInfo.companyEmail || "",
        companyPhone: companyInfo.companyPhone || "",
        // Champs bancaires (ajoutés par le backend — undefined si pas encore en DB)
        iban: (companyInfo as Record<string, unknown>).iban as string || "",
        bic: (companyInfo as Record<string, unknown>).bic as string || "",
      });
    }
  }, [companyInfo, reset]);

  // ── Formatage IBAN automatique en groupes de 4 caractères ─────────────────
  // Ex: FR7630006000... → FR76 3000 6000...
  const handleIbanChange = useCallback((e: { target: { value: string } }) => {
    // Supprimer les espaces existants, mettre en majuscules
    const raw = e.target.value.replace(/\s/g, "").toUpperCase();
    // Insérer un espace tous les 4 caractères
    const formatted = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
    setValue("iban", formatted, { shouldValidate: false });
  }, [setValue]);

  // Auto-remplissage via SIRET — grâce à watch() ci-dessus, setValue déclenche un re-render
  // et les inputs register() se synchronisent avec les nouvelles valeurs
  const handleSiretFound = useCallback((data: SiretData) => {
    const opts = { shouldDirty: true } as const;
    setValue("companyName", data.name, opts);
    setValue("companySiren", data.siren, opts);
    setValue("companySiret", data.siret, opts);
    setValue("companyAddress", data.address, opts);
    setValue("companyPostalCode", data.zipCode, opts);
    setValue("companyCity", data.city, opts);
    if (data.vatNumber) {
      setValue("companyVatNumber", data.vatNumber, opts);
    }
  }, [setValue]);


  const onSubmit = (data: CompanyFormData) => {
    updateMutation.mutate(data);
  };

  // Styles partagés comme dans invoice-form
  const dividerClass = "mx-0 h-px bg-gradient-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent";
  const inputClass = "bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

  if (isLoading) {
    return (
      <div className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
          <div className="h-96 bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
          <Building2 className="size-7 text-violet-600 dark:text-violet-400" />
          Mon entreprise
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
          Gérez les informations de votre entreprise pour la facturation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-violet-200 dark:border-violet-400/25 shadow-lg dark:shadow-violet-900/20 p-3 xs:-p-4 sm:p-6">
        {/* ── Recherche SIRET ────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
            Remplissage automatique
          </h3>
          <SiretLookupInput onFound={handleSiretFound} />
        </section>

        <div className={dividerClass} />

        {/* ── Alerte SIREN obligatoire ─────────────────────────────── */}
        <section className="rounded-xl border border-amber-300 dark:border-amber-400/30 bg-amber-50/80 dark:bg-amber-900/15 p-2 sm:p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-xs">
                SIREN obligatoire pour la facturation électronique
              </h3>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Le SIREN de votre entreprise est requis pour envoyer des factures électroniques via le réseau Peppol (obligatoire dès septembre 2026).
              </p>
            </div>
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Informations entreprise ──────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
            Informations légales
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nom de l&apos;entreprise *
              </Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="ACME SARL"
                className={inputClass}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySiren" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                SIREN * <span className="text-slate-400 dark:text-slate-500">(9 chiffres)</span>
              </Label>
              <Input
                id="companySiren"
                {...register("companySiren")}
                placeholder="123456789"
                maxLength={9}
                inputMode="numeric"
                className={`${inputClass} font-mono tracking-wider`}
              />
              {errors.companySiren && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companySiren.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySiret" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                SIRET <span className="text-slate-400 dark:text-slate-500">(14 chiffres)</span>
              </Label>
              <Input
                id="companySiret"
                {...register("companySiret")}
                placeholder="12345678901234"
                maxLength={14}
                inputMode="numeric"
                className={`${inputClass} font-mono tracking-wider`}
              />
              {errors.companySiret && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companySiret.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyVatNumber" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Numéro de TVA intracommunautaire
              </Label>
              <Input
                id="companyVatNumber"
                {...register("companyVatNumber")}
                placeholder="FR12345678901"
                className={`${inputClass} font-mono tracking-wider`}
              />
              {errors.companyVatNumber && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companyVatNumber.message}</p>
              )}
            </div>
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Adresse ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
            Adresse du siège social
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyAddress" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Adresse *
              </Label>
              <Textarea
                id="companyAddress"
                {...register("companyAddress")}
                placeholder="123 Rue de la République"
                rows={2}
                className={inputClass}
              />
              {errors.companyAddress && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companyAddress.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPostalCode" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Code postal *
                </Label>
                <Input
                  id="companyPostalCode"
                  {...register("companyPostalCode")}
                  placeholder="75001"
                  maxLength={5}
                  inputMode="numeric"
                  className={`${inputClass} font-mono`}
                />
                {errors.companyPostalCode && (
                  <p className="text-xs text-red-500 dark:text-red-400">{errors.companyPostalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyCity" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ville *
                </Label>
                <Input
                  id="companyCity"
                  {...register("companyCity")}
                  placeholder="Paris"
                  className={inputClass}
                />
                {errors.companyCity && (
                  <p className="text-xs text-red-500 dark:text-red-400">{errors.companyCity.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Contact ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
            Informations de contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyEmail" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Email professionnel *
              </Label>
              <Input
                id="companyEmail"
                type="email"
                {...register("companyEmail")}
                placeholder="contact@acme.fr"
                className={inputClass}
              />
              {errors.companyEmail && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companyEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyPhone" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Téléphone
              </Label>
              <Input
                id="companyPhone"
                {...register("companyPhone")}
                placeholder="01 23 45 67 89"
                className={inputClass}
              />
              {errors.companyPhone && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.companyPhone.message}</p>
              )}
            </div>
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Informations bancaires ──────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Landmark className="size-4 text-violet-600 dark:text-violet-400" />
            Informations bancaires
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="iban" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                IBAN
              </Label>
              <Input
                id="iban"
                {...register("iban")}
                onChange={handleIbanChange}
                placeholder="FR76 3000 6000 0112 3456 7890 189"
                className={`${inputClass} font-mono tracking-wider`}
                autoComplete="off"
                spellCheck={false}
              />
              {errors.iban && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.iban.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bic" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                BIC / SWIFT
              </Label>
              <Input
                id="bic"
                {...register("bic")}
                placeholder="BNPAFRPPXXX"
                className={`${inputClass} font-mono tracking-wider uppercase`}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setValue("bic", e.target.value.toUpperCase(), { shouldValidate: false })}
              />
              {errors.bic && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.bic.message}</p>
              )}
            </div>
          </div>

          {/* Note explicative */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Ces informations sont affichées sur vos factures pour le paiement par virement bancaire.
          </p>
        </section>

        <div className={dividerClass} />

        {/* ── Devise ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="text-base">💱</span>
            Devise
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Utilisée sur toutes vos factures, devis, acomptes et documents PDF.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CURRENCIES) as [string, { symbol: string; label: string; flag: string }][]).map(([code, { label, flag }]) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCurrency(code)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  selectedCurrency === code
                    ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-400"
                    : "border-slate-200 dark:border-violet-400/25 text-slate-600 dark:text-slate-400 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/30"
                }`}
              >
                <span className="text-base">{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSaveCurrency}
              disabled={isSavingCurrency}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2 text-sm cursor-pointer"
            >
              {isSavingCurrency ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Enregistrer la devise
            </Button>
          </div>
        </section>

        <div className={dividerClass} />

        {/* ── Actions ─────────────────────────────────────────────── */}
        <section className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
          >
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full size-4 border-2 border-white/30 border-t-white" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Sauvegarder les informations
              </>
            )}
          </Button>
        </section>
      </form>
    </div>
  );
}