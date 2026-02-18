"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompanyInfo, useUpdateCompanyInfo } from "@/hooks/use-company";
import { SiretLookupInput } from "@/components/shared/siret-lookup-input";
import type { SiretData } from "@/lib/api/siret-lookup";

// ─── Schema de validation ─────────────────────────────────────────────────────

const companySchema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  companySiren: z.string().min(9, "SIREN requis (9 chiffres)").max(9, "SIREN doit faire 9 chiffres"),
  companySiret: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().min(5, "Adresse requise"),
  companyPostalCode: z.string().min(5, "Code postal requis"),
  companyCity: z.string().min(2, "Ville requise"),
  companyEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  companyPhone: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CompanyPage() {
  const { data: companyInfo, isLoading } = useCompanyInfo();
  const updateMutation = useUpdateCompanyInfo();

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
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, reset } = form;

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
      });
    }
  }, [companyInfo, reset]);

  // Auto-remplissage via SIRET
  const handleSiretFound = useCallback((data: SiretData) => {
    setValue("companyName", data.name);
    setValue("companySiren", data.siren);
    setValue("companySiret", data.siret);
    setValue("companyAddress", data.address);
    setValue("companyPostalCode", data.zipCode);
    setValue("companyCity", data.city);
    
    // Utiliser le numéro de TVA calculé par l'API
    if (data.vatNumber) {
      setValue("companyVatNumber", data.vatNumber);
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
          <div className="h-96 bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-violet-200 dark:border-violet-400/25 shadow-lg dark:shadow-violet-900/20 p-8">
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
        <section className="rounded-xl border border-amber-300 dark:border-amber-400/30 bg-amber-50/80 dark:bg-amber-900/15 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                SIREN obligatoire pour la facturation électronique
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
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
                Nom de l'entreprise *
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
                Email professionnel
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

        {/* ── Actions ─────────────────────────────────────────────── */}
        <section className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
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