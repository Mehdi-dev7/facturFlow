"use client";

// Modale de création/édition d'un client
// Même structure que client-form.tsx mais dans un Dialog

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User, Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientFormSchema, type ClientFormData } from "@/lib/validations/client";
import { SiretLookupInput } from "@/components/shared/siret-lookup-input";
import { useCreateClient, useUpdateClient, type SavedClient } from "@/hooks/use-clients";
import type { SiretData } from "@/lib/api/siret-lookup";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Client à éditer — si null, mode création */
  editClient?: SavedClient | null;
  /** Callback après création/édition réussie */
  onSuccess?: (client: SavedClient) => void;
}

export function ClientModal({ open, onOpenChange, editClient, onSuccess }: ClientModalProps) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const isEdit = !!editClient;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { type: "entreprise" },
  });

  const clientType = watch("type");

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (editClient && open) {
      reset({
        type: editClient.type,
        name: editClient.name,
        siret: editClient.siret ?? undefined,
        siren: editClient.companySiren ?? undefined,
        vatNumber: editClient.companyVatNumber ?? undefined,
        email: editClient.email,
        phone: editClient.phone ?? undefined,
        address: editClient.address ?? "",
        zipCode: editClient.postalCode ?? undefined,
        city: editClient.city ?? "",
        notes: editClient.notes ?? undefined,
      });
    } else if (!editClient && open) {
      reset({ type: "entreprise" });
    }
  }, [editClient, open, reset]);

  // SIRET trouvé → pré-remplit les champs
  const handleSiretFound = useCallback(
    (data: SiretData) => {
      setValue("name", data.name, { shouldDirty: true });
      setValue("siret", data.siret, { shouldDirty: true });
      setValue("siren", data.siren, { shouldDirty: true });
      if (data.vatNumber) {
        setValue("vatNumber", data.vatNumber, { shouldDirty: true });
      }
      setValue("address", data.address, { shouldDirty: true });
      setValue("zipCode", data.zipCode, { shouldDirty: true });
      setValue("city", data.city, { shouldDirty: true });
      setValue("type", "entreprise", { shouldDirty: true });
    },
    [setValue],
  );

  // Soumission
  const onSubmit = useCallback(
    async (data: ClientFormData) => {
      if (isEdit && editClient) {
        updateMutation.mutate(
          { id: editClient.id, data },
          {
            onSuccess: (result) => {
              if (result.success && result.data) {
                onOpenChange(false);
                onSuccess?.(result.data);
              }
            },
          },
        );
      } else {
        createMutation.mutate(data, {
          onSuccess: (result) => {
            if (result.success && result.data) {
              onOpenChange(false);
              onSuccess?.(result.data);
            }
          },
        });
      }
    },
    [isEdit, editClient, createMutation, updateMutation, onOpenChange, onSuccess],
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const inputClass =
    "bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

  const labelClass = "text-sm font-medium text-slate-700 dark:text-violet-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* ─── Recherche SIRET ─── */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Recherche automatique
            </h3>
            <SiretLookupInput onFound={handleSiretFound} />
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

          {/* ─── Type de client ─── */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Type de client
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("type", "entreprise")}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 cursor-pointer text-left ${
                  clientType === "entreprise"
                    ? "border-primary bg-violet-100/70 dark:border-violet-400 dark:bg-violet-500/20"
                    : "border-slate-200 dark:border-violet-400/20 hover:border-primary/50 dark:hover:border-violet-400/50"
                }`}
              >
                <div className={`flex size-7 items-center justify-center rounded-lg ${
                  clientType === "entreprise"
                    ? "bg-primary/10 dark:bg-violet-500/20"
                    : "bg-slate-100 dark:bg-violet-900/20"
                }`}>
                  <Building2 className={`size-3.5 ${
                    clientType === "entreprise"
                      ? "text-primary dark:text-violet-400"
                      : "text-slate-500 dark:text-violet-500"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Entreprise</p>
                  <p className="text-[11px] text-slate-500 dark:text-violet-400/70">B2B</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue("type", "particulier")}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 cursor-pointer text-left ${
                  clientType === "particulier"
                    ? "border-primary bg-violet-100/70 dark:border-violet-400 dark:bg-violet-500/20"
                    : "border-slate-200 dark:border-violet-400/20 hover:border-primary/50 dark:hover:border-violet-400/50"
                }`}
              >
                <div className={`flex size-7 items-center justify-center rounded-lg ${
                  clientType === "particulier"
                    ? "bg-primary/10 dark:bg-violet-500/20"
                    : "bg-slate-100 dark:bg-violet-900/20"
                }`}>
                  <User className={`size-3.5 ${
                    clientType === "particulier"
                      ? "text-primary dark:text-violet-400"
                      : "text-slate-500 dark:text-violet-500"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">PME & Freelance</p>
                  <p className="text-[11px] text-slate-500 dark:text-violet-400/70">Auto-entrepreneur</p>
                </div>
              </button>
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

          {/* ─── Informations principales ─── */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Informations
            </h3>

            {/* Nom */}
            <div>
              <Label htmlFor="modalClientName" className={labelClass}>
                {clientType === "entreprise" ? "Raison sociale *" : "Nom / Raison sociale *"}
              </Label>
              <Input
                id="modalClientName"
                {...register("name")}
                placeholder={clientType === "entreprise" ? "Ex: Acme SAS" : "Ex: Jean Dupont EURL"}
                className={inputClass}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* SIRET */}
            <div>
              <Label htmlFor="modalClientSiret" className={labelClass}>SIRET</Label>
              <Input
                id="modalClientSiret"
                {...register("siret")}
                placeholder="14 chiffres"
                maxLength={14}
                inputMode="numeric"
                className={`${inputClass} font-mono tracking-widest`}
              />
            </div>

            {/* SIREN */}
            <div>
              <Label htmlFor="modalClientSiren" className={labelClass}>SIREN</Label>
              <Input
                id="modalClientSiren"
                {...register("siren")}
                placeholder="9 chiffres"
                maxLength={9}
                inputMode="numeric"
                className={`${inputClass} font-mono tracking-widest`}
              />
            </div>

            {/* Numéro de TVA */}
            <div>
              <Label htmlFor="modalClientVatNumber" className={labelClass}>N° TVA Intracommunautaire</Label>
              <Input
                id="modalClientVatNumber"
                {...register("vatNumber")}
                placeholder="FR12345678901"
                className={`${inputClass} font-mono`}
              />
            </div>

            {/* Email + Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modalClientEmail" className={labelClass}>Email *</Label>
                <Input
                  id="modalClientEmail"
                  type="email"
                  {...register("email")}
                  placeholder="contact@entreprise.fr"
                  className={inputClass}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="modalClientPhone" className={labelClass}>Téléphone</Label>
                <Input
                  id="modalClientPhone"
                  type="tel"
                  {...register("phone")}
                  placeholder="06 12 34 56 78"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

          {/* ─── Adresse ─── */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Adresse
            </h3>

            <div>
              <Label htmlFor="modalClientAddress" className={labelClass}>Adresse *</Label>
              <Input
                id="modalClientAddress"
                {...register("address")}
                placeholder="Ex: 12 Rue de la Paix"
                className={inputClass}
                aria-invalid={!!errors.address}
              />
              {errors.address && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modalClientZip" className={labelClass}>Code postal</Label>
                <Input
                  id="modalClientZip"
                  {...register("zipCode")}
                  placeholder="75001"
                  maxLength={5}
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="modalClientCity" className={labelClass}>Ville *</Label>
                <Input
                  id="modalClientCity"
                  {...register("city")}
                  placeholder="Paris"
                  className={inputClass}
                  aria-invalid={!!errors.city}
                />
                {errors.city && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

          {/* ─── Notes ─── */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Notes internes
            </h3>
            <Textarea
              {...register("notes")}
              placeholder="Informations complémentaires..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </section>

          {/* ─── Actions ─── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="border-primary/20 dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 cursor-pointer rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 cursor-pointer text-white transition-all duration-300 hover:scale-105"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEdit ? "Enregistrer" : "Créer le client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
