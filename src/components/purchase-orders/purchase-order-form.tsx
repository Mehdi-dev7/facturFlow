"use client";
// src/components/purchase-orders/purchase-order-form.tsx
// Formulaire de création/édition d'un bon de commande — adapté du quote-form

import { useState, useMemo, useCallback } from "react";
import {
  useFieldArray,
  useWatch,
  Controller,
  type UseFormReturn,
  type FieldErrors,
} from "react-hook-form";
import {
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Layers,
  Tag,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateButton } from "@/components/shared/create-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientSearch } from "@/components/factures/client-search";
import { ProductCombobox } from "@/components/shared/product-combobox";
import { CompanyInfoModal } from "@/components/factures/company-info-modal";
import {
  VAT_RATES,
  INVOICE_TYPES,
  INVOICE_TYPE_LABELS,
  INVOICE_TYPE_CONFIG,
  type InvoiceType,
  type PurchaseOrderFormData,
  type CompanyInfo,
  type QuickClientData,
} from "@/lib/validations/purchase-order";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";

// ─── Styles partagés ─────────────────────────────────────────────────────────

const dividerClass =
  "mx-0 h-px bg-linear-to-r from-transparent via-teal-400/30 to-transparent";

const inputClass =
  "bg-white/90 dark:bg-[#0f2a2a] border-slate-300 dark:border-teal-400/30 rounded-xl text-xs xs:text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-teal-300/50 autofill:shadow-[inset_0_0_0_30px_white] dark:autofill:shadow-[inset_0_0_0_30px_#0f2a2a] autofill:[-webkit-text-fill-color:theme(--color-slate-900)] dark:autofill:[-webkit-text-fill-color:theme(--color-slate-50)]";

const selectContentClass =
  "bg-linear-to-b from-teal-100 via-white to-white dark:from-[#0f2a2a] dark:via-[#0a2020] dark:to-[#0a2020] border border-teal-500/20 dark:border-teal-400/30 rounded-xl shadow-xl dark:shadow-teal-950/50 z-50";

const selectItemClass =
  "cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-teal-200/70 data-[highlighted]:bg-teal-200/70 dark:hover:bg-teal-500/25 dark:data-[highlighted]:bg-teal-500/25 data-[highlighted]:text-teal-900 dark:data-[highlighted]:text-slate-50";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PurchaseOrderFormProps {
  form: UseFormReturn<PurchaseOrderFormData>;
  onSubmit: (data: PurchaseOrderFormData) => void;
  orderNumber: string;
  companyInfo: CompanyInfo | null;
  onCompanyChange: (data: CompanyInfo) => void;
  isSubmitting?: boolean;
  /** Quand défini, n'affiche que les sections de cette étape (stepper mobile) */
  visibleStep?: 1 | 2 | 3;
  /** Cache le bouton de soumission (le stepper gère sa propre navigation) */
  hideSubmit?: boolean;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function PurchaseOrderForm({
  form,
  onSubmit,
  orderNumber,
  companyInfo,
  onCompanyChange,
  isSubmitting,
  visibleStep,
  hideSubmit = false,
}: PurchaseOrderFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Observateurs réactifs pour les calculs en temps réel
  const lines        = useWatch({ control, name: "lines" });
  const vatRate      = useWatch({ control, name: "vatRate" });
  const clientId     = useWatch({ control, name: "clientId" });
  const orderType    = (useWatch({ control, name: "orderType" }) ?? "basic") as InvoiceType;
  const discountType = useWatch({ control, name: "discountType" });
  const discountValue = useWatch({ control, name: "discountValue" }) ?? 0;

  const typeConfig = INVOICE_TYPE_CONFIG[orderType] ?? INVOICE_TYPE_CONFIG["basic"];
  const isForfait  = typeConfig.quantityLabel === null;
  const isArtisan  = orderType === "artisan";

  const fmt = useCallback(
    (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [],
  );

  // Calcul des totaux sans acompte (BC ne contient pas d'acompte)
  const totals = useMemo(
    () =>
      calcInvoiceTotals({
        lines: (lines || []).map((l) => ({
          quantity: isForfait ? 1 : (Number(l.quantity) || 0),
          unitPrice: Number(l.unitPrice) || 0,
        })),
        vatRate: vatRate ?? 20,
        discountType,
        discountValue,
      }),
    [lines, vatRate, discountType, discountValue, isForfait],
  );

  const handleSelectClient = useCallback(
    (id: string, clientData?: QuickClientData) => {
      setValue("clientId", id, { shouldValidate: true, shouldDirty: true });
      if (clientData) {
        setValue("newClient", clientData, { shouldDirty: true });
      } else {
        setValue("newClient", undefined, { shouldDirty: true });
      }
    },
    [setValue],
  );

  const handleClearClient = useCallback(() => {
    setValue("clientId", "", { shouldValidate: true, shouldDirty: true });
    setValue("newClient", undefined, { shouldDirty: true });
  }, [setValue]);

  const onError = useCallback((formErrors: FieldErrors<PurchaseOrderFormData>) => {
    console.warn("[PurchaseOrderForm] Validation errors:", formErrors);
  }, []);

  const handleAddLine = useCallback(() => {
    append({ description: "", quantity: 1, unitPrice: 0 });
  }, [append]);

  return (
    <>
      <CompanyInfoModal
        open={showCompanyModal}
        onOpenChange={setShowCompanyModal}
        defaultValues={companyInfo ?? undefined}
        onSave={onCompanyChange}
      />

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 1 — Émetteur, Destinataire, Informations
            ══════════════════════════════════════════════════════════ */}
        {(!visibleStep || visibleStep === 1) && (
          <>
            {/* ── Émetteur ──────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="size-4 text-teal-600 dark:text-teal-400" />
                  Émetteur
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowCompanyModal(true)}
                  className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-500/10 transition-all duration-300 cursor-pointer"
                >
                  {companyInfo ? "Modifier" : "Compléter"}
                </Button>
              </div>
              {companyInfo ? (
                <div className="rounded-xl border border-teal-200 dark:border-teal-400/25 bg-teal-100/60 dark:bg-[#0f2a2a] p-2.5 xs:p-3.5 text-[10px] xs:text-xs 2xl:text-sm shadow-sm">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {companyInfo.name}
                  </p>
                  <p className="text-slate-500 text-[10px] xs:text-xs dark:text-teal-300/80 mt-0.5">
                    SIRET : {companyInfo.siret}
                  </p>
                  <p className="text-slate-500 text-[10px] xs:text-xs dark:text-teal-300/80">
                    {companyInfo.address}
                  </p>
                  <p className="text-slate-500 dark:text-teal-300/80 text-[10px] xs:text-xs">
                    {companyInfo.zipCode} {companyInfo.city}
                  </p>
                  <p className="text-slate-500 text-[10px] xs:text-xs dark:text-teal-300/80">
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
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
                    Cliquez pour compléter
                  </p>
                </button>
              )}
            </section>

            <div className={dividerClass} />

            {/* ── Destinataire ──────────────────────────────── */}
            <section className="space-y-3" data-section="client">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
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

            {/* ── Informations (N° BC, date, livraison, réf client) ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Informations
              </h3>
              <div className="space-y-2">
                {/* N° Bon de commande — non éditable */}
                <div className="max-w-[130px] xs:max-w-xs">
                  <Label className="text-xs text-slate-600 dark:text-teal-200">N° Bon de commande</Label>
                  <Input
                    value={orderNumber}
                    disabled
                    className="bg-slate-100 dark:bg-[#0a2020] border-slate-300 dark:border-teal-400/70 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-teal-100/80"
                  />
                </div>

                {/* Date d'émission + Date de livraison */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-600 dark:text-teal-200">Date</Label>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className={`${inputClass} text-xs sm:text-sm dark:[&::-webkit-calendar-picker-indicator]:invert`}
                          aria-invalid={!!errors.date}
                        />
                      )}
                    />
                    {errors.date && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 dark:text-teal-200">
                      Date de livraison
                      <span className="ml-1 text-slate-400">(optionnel)</span>
                    </Label>
                    <Controller
                      name="deliveryDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className={`${inputClass} text-xs sm:text-sm dark:[&::-webkit-calendar-picker-indicator]:invert`}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Référence client (BC côté acheteur) */}
                <div>
                  <Label className="text-xs text-slate-600 dark:text-teal-200 flex items-center gap-1">
                    <Hash className="size-3" />
                    Référence client
                    <span className="ml-1 text-slate-400">(optionnel)</span>
                  </Label>
                  <Input
                    placeholder="Ex: BC-2025-001"
                    {...register("bcReference")}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-teal-400/60 mt-0.5">
                    La référence du bon de commande émis par votre client
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 2 — Type, Lignes, Totaux
            ══════════════════════════════════════════════════════════ */}
        {(!visibleStep || visibleStep === 2) && (
          <>
            {!visibleStep && <div className={dividerClass} />}

            {/* ── Type de bon de commande ───────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Layers className="size-4 text-teal-600 dark:text-teal-400" />
                Type de bon de commande
              </h3>
              <Controller
                name="orderType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "basic"}
                    onValueChange={(v) => {
                      field.onChange(v as InvoiceType);
                      // Réinitialiser les catégories si on quitte artisan
                      if (v !== "artisan") {
                        const currentLines = form.getValues("lines");
                        currentLines.forEach((_, i) => {
                          setValue(`lines.${i}.category`, undefined);
                        });
                      }
                    }}
                  >
                    <SelectTrigger className={`h-9 w-full ${inputClass}`}>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent side="bottom" avoidCollisions={false} className={selectContentClass}>
                      {INVOICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className={selectItemClass}>
                          {INVOICE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </section>

            <div className={dividerClass} />

            {/* ── Lignes ──────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs xs:text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Lignes du bon de commande
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddLine}
                  className="border-teal-400/20 text-xs xs:text-sm dark:border-teal-400/30 hover:bg-teal-50 dark:hover:bg-teal-500/15 dark:text-slate-100 transition-all duration-300 cursor-pointer"
                >
                  <Plus className="size-3 xs:size-3.5" />
                  Ajouter
                </Button>
              </div>

              {errors.lines?.root && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.lines.root.message}
                </p>
              )}
              {errors.lines?.message && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.lines.message}
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const lineErrors = errors.lines?.[index];
                  const qty   = isForfait ? 1 : (Number(lines?.[index]?.quantity) || 0);
                  const price = Number(lines?.[index]?.unitPrice) || 0;
                  const lineHT = qty * price;

                  return (
                    <div
                      key={field.id}
                      className="rounded-xl border border-teal-200 dark:border-teal-400/25 p-2 xs:p-3 space-y-2 bg-teal-100/45 dark:bg-[#0f2a2a] transition-all duration-300 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-400/40 shadow-sm"
                    >
                      {/* Catégorie (artisan uniquement) */}
                      {isArtisan && (
                        <div className="flex items-center gap-2">
                          <Tag className="size-3.5 text-slate-400 shrink-0" />
                          <Controller
                            name={`lines.${index}.category`}
                            control={control}
                            render={({ field: f }) => (
                              <Select
                                value={f.value ?? "main_oeuvre"}
                                onValueChange={(v) =>
                                  f.onChange(v as "main_oeuvre" | "materiel")
                                }
                              >
                                <SelectTrigger className="h-7 w-44 bg-white/90 dark:bg-[#0f2a2a] border-slate-300 dark:border-teal-400/30 rounded-lg text-xs xs:text-sm dark:text-slate-50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="bottom" avoidCollisions={false} className={selectContentClass}>
                                  <SelectItem value="main_oeuvre" className={selectItemClass}>
                                    Main d&apos;oeuvre
                                  </SelectItem>
                                  <SelectItem value="materiel" className={selectItemClass}>
                                    Matériaux
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}

                      {/* Description + bouton supprimer */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Controller
                            name={`lines.${index}.description`}
                            control={control}
                            render={({ field: f }) => (
                              <ProductCombobox
                                value={f.value ?? ""}
                                onChange={f.onChange}
                                onProductSelect={({ description, unitPrice }) => {
                                  f.onChange(description);
                                  setValue(`lines.${index}.unitPrice`, unitPrice, {
                                    shouldValidate: false,
                                  });
                                }}
                                currentUnitPrice={Number(lines[index]?.unitPrice ?? 0)}
                                placeholder={typeConfig.descriptionLabel}
                                className={inputClass}
                                aria-invalid={!!lineErrors?.description}
                              />
                            )}
                          />
                          {lineErrors?.description && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                              {lineErrors.description.message}
                            </p>
                          )}
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-100 dark:text-red-400/60 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-all duration-300 cursor-pointer mt-1"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Quantité + Prix unitaire */}
                      <div className={`grid gap-2 ${isForfait ? "grid-cols-1" : "grid-cols-2"}`}>
                        {/* Quantité (masquée en mode forfait) */}
                        {!isForfait && (
                          <div>
                            <Label className="text-xs text-slate-500 dark:text-teal-200">
                              {typeConfig.quantityLabel}
                            </Label>
                            <Controller
                              name={`lines.${index}.quantity`}
                              control={control}
                              render={({ field: f }) => (
                                <Input
                                  type="number"
                                  min={0.01}
                                  step={0.01}
                                  value={f.value || ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    f.onChange(v === "" ? 0 : Number(v));
                                  }}
                                  onBlur={(e) => {
                                    if (!e.target.value || Number(e.target.value) < 0.01)
                                      f.onChange(1);
                                    f.onBlur();
                                  }}
                                  className={inputClass}
                                  aria-invalid={!!lineErrors?.quantity}
                                />
                              )}
                            />
                          </div>
                        )}

                        {/* Prix unitaire */}
                        <div>
                          <Label className="text-xs text-slate-500 dark:text-teal-200">
                            {isForfait ? "Montant (€)" : typeConfig.priceLabel}
                          </Label>
                          <Controller
                            name={`lines.${index}.unitPrice`}
                            control={control}
                            render={({ field: f }) => (
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={f.value || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  f.onChange(v === "" ? 0 : Number(v));
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value) f.onChange(0);
                                  f.onBlur();
                                }}
                                className={inputClass}
                                aria-invalid={!!lineErrors?.unitPrice}
                              />
                            )}
                          />
                        </div>
                      </div>

                      {/* Total HT de la ligne */}
                      {visibleStep ? (
                        <div className="flex items-center justify-between border-t border-teal-100 dark:border-teal-400/20 pt-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-teal-200">Total HT</span>
                          <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                            {fmt(lineHT)} €
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-teal-200">Total HT</span>
                          <span className="text-xs xs:text-sm font-bold text-teal-700 dark:text-teal-300">
                            {fmt(lineHT)} €
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bouton d'ajout si liste vide */}
              {fields.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-teal-400/20 dark:border-teal-400/30 hover:bg-teal-50 dark:hover:bg-teal-500/15 dark:text-slate-100 transition-all duration-300 cursor-pointer rounded-xl"
                  onClick={handleAddLine}
                >
                  <Plus className="size-4" />
                  Ajouter une ligne
                </Button>
              )}
            </section>

            <div className={dividerClass} />

            {/* ── Totaux + TVA + Réduction ──────────────────── */}
            <section className="rounded-xl border border-teal-200 dark:border-teal-400/25 bg-teal-100/60 dark:bg-[#0f2a2a] p-3 xs:p-4 space-y-2 shadow-sm">

              {/* Sous-total HT */}
              <div className="flex justify-between text-xs xs:text-sm">
                <span className="text-slate-500 dark:text-teal-200">Sous-total HT</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {fmt(totals.subtotal)} €
                </span>
              </div>

              {/* Réduction */}
              <div className="flex items-center justify-between text-xs xs:text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 dark:text-teal-200">Réduction</span>
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field: f }) => (
                      <Select
                        value={f.value ?? "none"}
                        onValueChange={(v) => {
                          if (v === "none") {
                            f.onChange(undefined);
                            setValue("discountValue", 0);
                          } else {
                            f.onChange(v as "pourcentage" | "montant");
                          }
                        }}
                      >
                        <SelectTrigger className="h-6 w-24 xs:h-7 xs:w-28 bg-white/90 dark:bg-[#0f2a2a] border-slate-300 dark:border-teal-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50">
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                        <SelectContent side="bottom" avoidCollisions={false} className={selectContentClass}>
                          <SelectItem value="none" className={selectItemClass}>Aucune</SelectItem>
                          <SelectItem value="pourcentage" className={selectItemClass}>
                            Pourcentage (%)
                          </SelectItem>
                          <SelectItem value="montant" className={selectItemClass}>
                            Montant fixe (€)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {discountType && (
                    <Controller
                      name="discountValue"
                      control={control}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          min={0}
                          step={discountType === "pourcentage" ? 1 : 0.01}
                          max={discountType === "pourcentage" ? 100 : undefined}
                          placeholder={discountType === "pourcentage" ? "%" : "€"}
                          value={f.value || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            f.onChange(v === "" ? 0 : Number(v));
                          }}
                          className="h-6 w-16 xs:h-7 xs:w-20 bg-white/90 dark:bg-[#0f2a2a] border-slate-300 dark:border-teal-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50"
                        />
                      )}
                    />
                  )}
                </div>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {totals.discountAmount > 0 ? `-${fmt(totals.discountAmount)} €` : "—"}
                </span>
              </div>

              {/* Net HT si réduction active */}
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-xs xs:text-sm border-t border-teal-200 dark:border-teal-400/20 pt-2">
                  <span className="text-slate-600 dark:text-teal-200 font-medium">Net HT</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {fmt(totals.netHT)} €
                  </span>
                </div>
              )}

              {/* TVA avec sélecteur */}
              <div className="flex justify-between items-center text-xs xs:text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-teal-200">TVA</span>
                  <Select
                    value={String(vatRate ?? 20)}
                    onValueChange={(v) =>
                      setValue("vatRate", Number(v) as 0 | 5.5 | 10 | 20, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-6 w-16 xs:h-7 xs:w-20 bg-white/90 dark:bg-[#0f2a2a] border-slate-300 dark:border-teal-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" avoidCollisions={false} className={selectContentClass}>
                      {VAT_RATES.map((rate) => (
                        <SelectItem key={rate} value={String(rate)} className={selectItemClass}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {fmt(totals.taxTotal)} €
                </span>
              </div>

              <div className={dividerClass} />

              {/* Total TTC */}
              <div className="flex justify-between text-xs xs:text-sm font-bold">
                <span className="text-slate-800 dark:text-slate-50">Total TTC</span>
                <span className="text-teal-600 dark:text-teal-400">
                  {fmt(totals.totalTTC)} €
                </span>
              </div>

              {/* NET À PAYER si réduction */}
              {totals.discountAmount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t-2 border-teal-400/40 dark:border-teal-500/30 mt-1">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                    NET À PAYER
                  </span>
                  <span className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                    {fmt(totals.netAPayer)} €
                  </span>
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 3 — Notes & conditions
            ══════════════════════════════════════════════════════════ */}
        {(!visibleStep || visibleStep === 3) && (
          <>
            {!visibleStep && <div className={dividerClass} />}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Notes & conditions
              </h3>
              <Textarea
                placeholder="Conditions particulières, mentions légales, notes de commande..."
                {...register("notes")}
                className="bg-white/90 dark:bg-[#0f2a2a] border-slate-300 dark:border-teal-400/30 rounded-xl text-xs xs:text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-teal-300/50"
              />
            </section>
          </>
        )}

        {/* Erreur globale (clientId) */}
        {errors.clientId?.message && (
          <p className="text-xs text-red-500 dark:text-red-400 text-center">
            {errors.clientId.message}
          </p>
        )}

        {/* Bouton de soumission — caché quand le stepper gère la navigation */}
        {!hideSubmit && (
          <div className="lg:ml-auto lg:w-1/3">
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-101 bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? "Création en cours…" : "Créer le bon de commande"}
            </Button>
          </div>
        )}
      </form>
    </>
  );
}
