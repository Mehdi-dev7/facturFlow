"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
	Pencil,
} from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";
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
import { toast } from "sonner";
import { Lock, Eye } from "lucide-react";
import { canUseFeature } from "@/lib/feature-gate";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import type { Feature } from "@/lib/feature-gate";
import { useConnectedProviders } from "@/hooks/use-payment-accounts";
import { ClientSearch } from "./client-search";
import { CompanyInfoModal } from "./company-info-modal";
import { ProductCombobox } from "@/components/shared/product-combobox";
import {
	VAT_RATES,
	INVOICE_TYPES,
	INVOICE_TYPE_LABELS,
	INVOICE_TYPE_CONFIG,
	type InvoiceFormData,
	type CompanyInfo,
	type QuickClientData,
	type InvoiceType,
} from "@/lib/validations/invoice";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";

// ─── Styles partagés ─────────────────────────────────────────────────────────

const dividerClass =
	"mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent";
const inputClass =
	"bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50 autofill:shadow-[inset_0_0_0_30px_white] dark:autofill:shadow-[inset_0_0_0_30px_#2a2254] autofill:[-webkit-text-fill-color:theme(--color-slate-900)] dark:autofill:[-webkit-text-fill-color:theme(--color-slate-50)]";
const selectContentClass =
	"bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50";
const selectItemClass =
	"cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoiceFormProps {
	form: UseFormReturn<InvoiceFormData>;
	onSubmit: (data: InvoiceFormData) => void;
	invoiceNumber: string;
	companyInfo: CompanyInfo | null;
	onCompanyChange: (data: CompanyInfo) => void;
	isSubmitting?: boolean;
	submitLabel?: string;
	/** Quand défini, n'affiche que les sections de cette étape (stepper) */
	visibleStep?: 1 | 2 | 3;
	/** Cache le bouton de soumission (le stepper gère sa propre navigation) */
	hideSubmit?: boolean;
	/** Plan effectif de l'utilisateur pour gater les features */
	effectivePlan?: string;
	/** Callback pour ouvrir la modale d'aperçu PDF — affiche un bouton à côté de Créer */
	onPdfPreview?: () => void;
	/** Callback appelé quand l'utilisateur modifie le numéro du document */
	onNumberChange?: (n: string) => void;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function InvoiceForm({
	form,
	onSubmit,
	invoiceNumber,
	companyInfo,
	onCompanyChange,
	isSubmitting = false,
	submitLabel = "Créer la facture",
	visibleStep,
	hideSubmit = false,
	effectivePlan = "FREE",
	onPdfPreview,
	onNumberChange,
}: InvoiceFormProps) {
	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = form;

	const { fields, append, remove } = useFieldArray({ control, name: "lines" });

	const [showCompanyModal, setShowCompanyModal] = useState(false);
	const [upgradeFeature, setUpgradeFeature] = useState<Feature | null>(null);

	// Vérifier l'accès aux providers de paiement (plan)
	const pseudoUser = { plan: effectivePlan, trialEndsAt: null };
	const canStripe = canUseFeature(pseudoUser, "payment_stripe");
	const canPaypal = canUseFeature(pseudoUser, "payment_paypal");
	const canGocardless = canUseFeature(pseudoUser, "payment_gocardless");

	// Vérifier si les providers sont réellement connectés (clé API configurée)
	const connectedProviders = useConnectedProviders();

	// État local des boutons de paiement actifs (toggle directs, sans checkbox parent)
	const [activePayments, setActivePayments] = useState(() => {
		const links = form.getValues("paymentLinks");
		return {
			stripe: !!(links?.stripe),
			paypal: !!(links?.paypal),
			gocardless: !!(links?.gocardless),
		};
	});

	const togglePayment = useCallback(
		(key: "stripe" | "paypal" | "gocardless") => {
			// Lire la valeur actuelle sans passer par le state updater
			// pour éviter d'appeler setValue() pendant un setState (interdit par React)
			setActivePayments((prev) => ({ ...prev, [key]: !prev[key] }));
			const current = form.getValues(`paymentLinks.${key}`);
			setValue(
				`paymentLinks.${key}` as "paymentLinks.stripe" | "paymentLinks.paypal" | "paymentLinks.gocardless",
				!current,
				{ shouldDirty: true },
			);
		},
		[setValue, form],
	);

	// ── Watch ──────────────────────────────────────────────────────────────
	const lines = useWatch({ control, name: "lines" });
	const vatRate = useWatch({ control, name: "vatRate" });
	const vatMode = useWatch({ control, name: "vatMode" }) ?? "global";
	const isPerLine = vatMode === "per_line";
	const clientId = useWatch({ control, name: "clientId" });
	const invoiceType = useWatch({ control, name: "invoiceType" }) ?? "basic";
	const discountType = useWatch({ control, name: "discountType" });
	const discountValue = useWatch({ control, name: "discountValue" }) ?? 0;
	const depositAmount = useWatch({ control, name: "depositAmount" }) ?? 0;
	const customNumber = useWatch({ control, name: "customNumber" });

	// Sync : quand le numéro auto-généré arrive (prop), initialiser le champ s'il est vide
	useEffect(() => {
		if (invoiceNumber && !form.getValues("customNumber")) {
			setValue("customNumber", invoiceNumber);
		}
	}, [invoiceNumber, setValue, form]);

	// Notifier le parent dès que customNumber change (pour màj preview/header)
	useEffect(() => {
		if (customNumber) onNumberChange?.(customNumber);
	}, [customNumber, onNumberChange]);

	// Quand on passe en mode "par ligne", initialiser le vatRate de chaque ligne
	// avec le taux global s'il n'est pas encore défini
	useEffect(() => {
		if (isPerLine) {
			const currentLines = form.getValues("lines");
			const defaultRate = (vatRate ?? 20) as 0 | 5.5 | 10 | 20;
			currentLines.forEach((line, idx) => {
				if (line.vatRate === undefined || line.vatRate === null) {
					setValue(`lines.${idx}.vatRate`, defaultRate, { shouldDirty: true });
				}
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPerLine]); // Déclenché uniquement quand isPerLine change

	// ── Config du type ─────────────────────────────────────────────────────
	const typeConfig = INVOICE_TYPE_CONFIG[invoiceType as InvoiceType] ?? INVOICE_TYPE_CONFIG.basic;

	// ── Calculs ────────────────────────────────────────────────────────────
	const totals = useMemo(() => calcInvoiceTotals({
		lines: (lines || []).map((l) => ({
			quantity: Number(l.quantity) || 0,
			unitPrice: Number(l.unitPrice) || 0,
			vatRate: l.vatRate,
		})),
		vatRate: (vatRate ?? 20) as 0 | 5.5 | 10 | 20,
		vatMode: isPerLine ? "per_line" : "global",
		discountType,
		discountValue,
		depositAmount,
	}), [lines, vatRate, isPerLine, discountType, discountValue, depositAmount]);

	// ── Handlers ───────────────────────────────────────────────────────────
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

	const onError = useCallback((formErrors: FieldErrors<InvoiceFormData>) => {
		console.warn("[InvoiceForm] Validation errors:", formErrors);

		// Collecter tous les messages d'erreur avec leur label
		const messages: string[] = [];

		if (formErrors.clientId?.message)
			messages.push("Destinataire : " + formErrors.clientId.message);
		if (formErrors.date?.message)
			messages.push("Date : " + formErrors.date.message);
		if (formErrors.dueDate?.message)
			messages.push("Échéance : " + formErrors.dueDate.message);

		// Erreurs dans les lignes
		type LineErr = { description?: { message?: string }; quantity?: { message?: string }; unitPrice?: { message?: string } };
		const linesErrors = formErrors.lines as ({ message?: string } & LineErr[]) | undefined;
		// zodResolver peut retourner un objet {0: ..., 1: ...} ou un vrai array — gérer les deux
		const lineEntries: [number, LineErr][] = linesErrors
			? Array.isArray(linesErrors)
				? (linesErrors as LineErr[]).map((err, i) => [i, err] as [number, LineErr])
				: Object.entries(linesErrors as Record<string, unknown>)
						.filter(([k]) => !isNaN(Number(k)))
						.map(([k, v]) => [Number(k), v] as [number, LineErr])
			: [];

		if (linesErrors) {
			if (linesErrors.message) messages.push("Lignes : " + linesErrors.message);
			for (const [i, lineErr] of lineEntries) {
				if (!lineErr) continue;
				const n = i + 1;
				const le = lineErr as LineErr;
				if (le.description?.message)
					messages.push(`Ligne ${n} — ${le.description.message}`);
				if (le.quantity?.message)
					messages.push(`Ligne ${n} — Quantité invalide`);
				if (le.unitPrice?.message)
					messages.push(`Ligne ${n} — Prix invalide`);
			}
		}

		const [first, ...rest] = messages.length > 0
			? messages
			: ["Veuillez corriger les erreurs dans le formulaire"];

		toast.error(first, {
			description: rest.length > 0 ? rest.join(" · ") : undefined,
			duration: 5000,
		});

		// Scroller vers le premier champ en erreur
		if (formErrors.clientId) {
			document.querySelector("[data-section='client']")?.scrollIntoView({ behavior: "smooth", block: "center" });
		} else if (formErrors.date) {
			form.setFocus("date");
		} else if (formErrors.dueDate) {
			form.setFocus("dueDate");
		} else if (linesErrors) {
			const firstEntry = lineEntries.find(([, e]) => !!e);
			if (firstEntry) {
				const [idx, lineErr] = firstEntry;
				const le = lineErr as LineErr;
				if (le?.description) form.setFocus(`lines.${idx}.description`);
				else if (le?.quantity) form.setFocus(`lines.${idx}.quantity`);
				else if (le?.unitPrice) form.setFocus(`lines.${idx}.unitPrice`);
			}
		}
	}, [form]);

	const handleAddLine = useCallback(() => {
		append({
			description: "",
			quantity: 1,
			unitPrice: 0,
			category: invoiceType === "artisan" ? "main_oeuvre" : undefined,
			// En mode par ligne, initialiser avec le taux global comme défaut
			vatRate: isPerLine ? ((vatRate ?? 20) as 0 | 5.5 | 10 | 20) : undefined,
		});
	}, [append, invoiceType, isPerLine, vatRate]);

	const fmt = useCallback(
		(n: number) =>
			n.toLocaleString("fr-FR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}),
		[],
	);

	// ── Render ─────────────────────────────────────────────────────────────
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
								<div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-100/60 dark:bg-[#251e4d] p-2.5 xs:p-3.5 text-[10px] xs:text-xs 2xl:text-sm shadow-sm">
									<p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
										{companyInfo.name}
									</p>
									<p className="text-slate-500 text-[10px] xs:text-xs dark:text-violet-300/80 mt-0.5">
										SIRET : {companyInfo.siret}
									</p>
									<p className="text-slate-500 text-[10px] xs:text-xs dark:text-violet-300/80">
										{companyInfo.address}
									</p>
									<p className="text-slate-500 dark:text-violet-300/80 text-[10px] xs:text-xs">
										{companyInfo.zipCode} {companyInfo.city}
									</p>
									<p className="text-slate-500 text-[10px] xs:text-xs dark:text-violet-300/80">
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

						{/* ── Destinataire ──────────────────────────────── */}
						<section className="space-y-3" data-section="client">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Destinataire</h3>
							<ClientSearch
								selectedClientId={clientId}
								onSelectClient={handleSelectClient}
								onClear={handleClearClient}
								error={errors.clientId?.message}
							/>
						</section>

						<div className={dividerClass} />

						{/* ── Informations (N° facture, date, échéance) ─── */}
						<section className="space-y-3">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Informations</h3>
							{/* N° Facture au-dessus avec max-width, dates alignées en dessous */}
							<div className="space-y-2">
								<div className="max-w-[130px] xs:max-w-xs">
									<Label className="text-xs text-slate-600 dark:text-violet-200">N° Facture</Label>
									<div className="relative">
										<Controller
											name="customNumber"
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													value={field.value ?? ""}
													placeholder={invoiceNumber || "Ex: FAC-2025-0001"}
													className={`${inputClass} pr-8 text-xs sm:text-sm font-mono`}
												/>
											)}
										/>
										<Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 dark:text-violet-400/60 pointer-events-none" />
									</div>
									{errors.customNumber && (
										<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.customNumber.message}</p>
									)}
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<Label className="text-xs text-slate-600 dark:text-violet-200">Date</Label>
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
											<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.date.message}</p>
										)}
									</div>
									<div>
										<Label className="text-xs text-slate-600 dark:text-violet-200">Échéance</Label>
										<Controller
											name="dueDate"
											control={control}
											render={({ field }) => (
												<Input
													type="date"
													value={field.value}
													onChange={field.onChange}
													onBlur={field.onBlur}
													className={`${inputClass} text-xs sm:text-sm dark:[&::-webkit-calendar-picker-indicator]:invert`}
													aria-invalid={!!errors.dueDate}
												/>
											)}
										/>
										{errors.dueDate && (
											<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.dueDate.message}</p>
										)}
									</div>
								</div>
								{/* Date de livraison optionnelle */}
								<div>
									<Label className="text-xs text-slate-600 dark:text-violet-200">
										Date de livraison{" "}
										<span className="font-normal text-slate-400 dark:text-violet-400/50">(optionnel)</span>
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
						</section>
					</>
				)}

				{/* ══════════════════════════════════════════════════════════
				    ÉTAPE 2 — Type de facture, Lignes, Totaux
				    ══════════════════════════════════════════════════════════ */}
				{(!visibleStep || visibleStep === 2) && (
					<>
						{/* Séparateur entre étapes uniquement en mode non-filtré */}
						{!visibleStep && <div className={dividerClass} />}

						{/* ── Type de facture ───────────────────────────── */}
						<section className="space-y-3">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
								<Layers className="size-4 text-violet-600 dark:text-violet-400" />
								Type de facture
							</h3>
							<Controller
								name="invoiceType"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value ?? "basic"}
										onValueChange={(v) =>
											field.onChange(v as InvoiceType)
										}
									>
										<SelectTrigger className={`h-9 w-full ${inputClass}`}>
											<SelectValue placeholder="Choisir un type…" />
										</SelectTrigger>
										<SelectContent side="bottom" avoidCollisions={false} className={selectContentClass}>
											{INVOICE_TYPES.map((t) => (
												<SelectItem key={t} value={t} className={selectItemClass}>
													{INVOICE_TYPE_LABELS[t]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</section>

						<div className={dividerClass} />

						{/* ── Lignes de facture ─────────────────────────── */}
						<section className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-xs xs:text-sm font-semibold text-slate-800 dark:text-slate-100">
									{invoiceType === "artisan" ? "Prestations" : "Lignes de facture"}
								</h3>
								<Button
									type="button"
									variant="outline"
									size="xs"
									onClick={handleAddLine}
									className="border-primary/20 text-xs xs:text-sm dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/15 dark:text-slate-100 transition-all duration-300 cursor-pointer"
								>
									<Plus className="size-3 xs:size-3.5" />
									Ajouter
								</Button>
							</div>

							{errors.lines?.root && (
								<p className="text-xs text-red-500 dark:text-red-400">{errors.lines.root.message}</p>
							)}
							{errors.lines?.message && (
								<p className="text-xs text-red-500 dark:text-red-400">{errors.lines.message}</p>
							)}

							<div className="space-y-3">
								{fields.map((field, index) => {
									const lineErrors = errors.lines?.[index];
									const qty = Number(lines?.[index]?.quantity) || 0;
									const price = Number(lines?.[index]?.unitPrice) || 0;
									const effectiveQty = typeConfig.quantityLabel === null ? 1 : qty;
									const lineHT = effectiveQty * price;

									return (
										<div
											key={field.id}
											className="rounded-xl border border-violet-200 dark:border-violet-400/25 p-2 xs:p-3 space-y-2 bg-violet-100/45 dark:bg-[#251e4d] transition-all duration-300 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-400/40 shadow-sm"
										>
											{/* Catégorie artisan */}
											{typeConfig.showCategory && (
												<Controller
													name={`lines.${index}.category`}
													control={control}
													render={({ field: f }) => (
														<div className="flex items-center gap-2">
															<Tag className="size-3.5 text-violet-400" />
															<Select
																value={f.value ?? "main_oeuvre"}
																onValueChange={f.onChange}
															>
																<SelectTrigger className="h-7 w-44 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs xs:text-sm text-slate-900 dark:text-slate-50">
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
														</div>
													)}
												/>
											)}

											{/* Description + bouton suppr */}
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

											{/* Qté + Prix + Total */}
											<div
												className={`grid gap-2 ${
													visibleStep
														? typeConfig.quantityLabel === null ? "grid-cols-1" : "grid-cols-2"
														: typeConfig.quantityLabel === null ? "grid-cols-2" : "grid-cols-3"
												}`}
											>
												{/* Quantité — cachée pour freelance_tache */}
												{typeConfig.quantityLabel !== null && (
													<div>
														<Label className="text-xs text-slate-500 dark:text-violet-200">
															{typeConfig.quantityLabel}
														</Label>
														<Controller
															name={`lines.${index}.quantity`}
															control={control}
															render={({ field: f }) => (
																<Input
																	type="number"
																	min={0}
																	step="any"
																	value={f.value === 0 ? "" : f.value}
																	onChange={(e) => {
																		const v = e.target.value;
																		f.onChange(v === "" ? 0 : Number(v));
																	}}
																	onBlur={(e) => {
																		const num = Number(e.target.value);
																		if (!e.target.value || num <= 0)
																			f.onChange(1);
																		f.onBlur();
																	}}
																	className={inputClass}
																	aria-invalid={!!lineErrors?.quantity}
																/>
															)}
														/>
														{lineErrors?.quantity && (
															<p className="text-xs text-red-500 dark:text-red-400 mt-1">{lineErrors.quantity.message}</p>
														)}
													</div>
												)}

												{/* Prix unitaire */}
												<div>
													<Label className="text-xs text-slate-500 dark:text-violet-200">
														{typeConfig.priceLabel}
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

												{/* TVA par ligne (mode per_line) */}
												{isPerLine && (
													<div>
														<Label className="text-xs text-slate-500 dark:text-violet-200">TVA</Label>
														<Controller
															name={`lines.${index}.vatRate`}
															control={control}
															render={({ field: f }) => (
																<Select
																	value={String(f.value ?? vatRate ?? 20)}
																	onValueChange={(v) => f.onChange(Number(v) as 0 | 5.5 | 10 | 20)}
																>
																	<SelectTrigger className={`h-9 w-full ${inputClass}`}>
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
															)}
														/>
													</div>
												)}

												{/* Total HT — dans le grid hors stepper */}
												{!visibleStep && (
													<div>
														<Label className="text-xs text-slate-500 dark:text-violet-200">
															Total HT
														</Label>
														<div className="h-9 flex items-center text-sm font-bold text-violet-700 dark:text-violet-300">
															{lineHT.toLocaleString("fr-FR", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}{" "}
															€
														</div>
													</div>
												)}
											</div>
											{/* Total HT en mode stepper — en dessous du grid */}
											{visibleStep && (
												<div className="flex items-center justify-between border-t border-violet-100 dark:border-violet-400/20 pt-2 mt-1">
													<span className="text-xs text-slate-500 dark:text-violet-200">Total HT</span>
													<span className="text-sm font-bold text-violet-700 dark:text-violet-300">
														{lineHT.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
													</span>
												</div>
											)}
										</div>
									);
								})}
							</div>

							{fields.length === 0 && (
								<Button
									type="button"
									variant="outline"
									className="w-full border-primary/20 dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/15 dark:text-slate-100 transition-all duration-300 cursor-pointer rounded-xl"
									onClick={handleAddLine}
								>
									<Plus className="size-4" />
									Ajouter une ligne
								</Button>
							)}
						</section>

						<div className={dividerClass} />

						{/* ── Totaux ────────────────────────────────────── */}
						<section className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-100/60 dark:bg-[#251e4d] p-3 xs:p-4 space-y-2 shadow-sm">
							{/* Sous-total HT */}
							<div className="flex justify-between text-xs xs:text-sm">
								<span className="text-slate-500 dark:text-violet-200">Sous-total HT</span>
								<span className="font-medium text-slate-800 dark:text-slate-100">
									{fmt(totals.subtotal)} €
								</span>
							</div>

							{/* Réduction */}
							<div className="flex items-center justify-between text-xs xs:text-sm">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-slate-500 dark:text-violet-200">Réduction</span>
									<Controller
										name="discountType"
										control={control}
										render={({ field }) => (
											<Select
												value={field.value ?? "none"}
												onValueChange={(v) =>
													field.onChange(v === "none" ? undefined : v)
												}
											>
												<SelectTrigger className="h-6 w-24 xs:h-7 xs:w-28 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50">
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
													className="h-6 w-16 xs:h-7 xs:w-20 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50"
												/>
											)}
										/>
									)}
								</div>
								<span className="font-medium text-rose-600 dark:text-rose-400">
									{totals.discountAmount > 0 ? `−${fmt(totals.discountAmount)} €` : "—"}
								</span>
							</div>

							{/* Net HT */}
							{totals.discountAmount > 0 && (
								<div className="flex justify-between text-xs xs:text-sm border-t border-violet-200 dark:border-violet-400/20 pt-2">
									<span className="text-slate-600 dark:text-violet-200 font-medium">Net HT</span>
									<span className="font-medium text-slate-800 dark:text-slate-100">
										{fmt(totals.netHT)} €
									</span>
								</div>
							)}

							{/* TVA — toggle globale / par ligne + sélecteur taux */}
							<div className="space-y-2">
								{/* Toggle mode TVA */}
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs text-slate-500 dark:text-violet-200">TVA</span>
									<div className="flex rounded-lg overflow-hidden border border-violet-200 dark:border-violet-400/30 text-xs">
										<button
											type="button"
											onClick={() => setValue("vatMode", "global", { shouldDirty: true })}
											className={`px-2.5 py-1 cursor-pointer transition-colors ${!isPerLine ? "bg-violet-600 text-white font-medium" : "bg-white/90 dark:bg-[#2a2254] text-slate-500 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/15"}`}
										>
											Globale
										</button>
										<button
											type="button"
											onClick={() => setValue("vatMode", "per_line", { shouldDirty: true })}
											className={`px-2.5 py-1 cursor-pointer transition-colors ${isPerLine ? "bg-violet-600 text-white font-medium" : "bg-white/90 dark:bg-[#2a2254] text-slate-500 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/15"}`}
										>
											Par ligne
										</button>
									</div>
								</div>

								{/* Taux global (masqué en mode par ligne) */}
								{!isPerLine && (
									<div className="flex items-center justify-between text-xs xs:text-sm">
										<div className="flex items-center gap-2">
											<span className="text-slate-500 dark:text-violet-200/60 text-xs">Taux</span>
											<Select
												value={String(vatRate ?? 20)}
												onValueChange={(v) =>
													setValue("vatRate", Number(v) as 0 | 5.5 | 10 | 20, {
														shouldValidate: true,
														shouldDirty: true,
													})
												}
											>
												<SelectTrigger className="h-6 w-16 xs:h-7 xs:w-20 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50">
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
								)}

								{/* Ventilation TVA en mode par ligne */}
								{isPerLine && totals.vatBreakdown && totals.vatBreakdown.map(({ rate, amount }) => (
									<div key={rate} className="flex justify-between text-xs xs:text-sm">
										<span className="text-slate-500 dark:text-violet-200">TVA {rate}%</span>
										<span className="font-medium text-slate-800 dark:text-slate-100">{fmt(amount)} €</span>
									</div>
								))}
							</div>

							{/* Séparateur */}
							<div className="h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />

							{/* Total TTC */}
							<div className="flex justify-between text-xs xs:text-sm font-bold">
								<span className="text-slate-800 dark:text-slate-50">Total TTC</span>
								<span className="text-violet-600 dark:text-violet-300">{fmt(totals.totalTTC)} €</span>
							</div>

							{/* Acompte versé */}
							<div className="flex items-center justify-between text-sm pt-1">
								<div className="flex items-center gap-2">
									<span className="text-slate-500 text-xs xs:text-sm dark:text-violet-200">Acompte versé <span className="text-[10px] xs:text-xs opacity-60">(TTC)</span></span>
									<Controller
										name="depositAmount"
										control={control}
										render={({ field: f }) => (
											<Input
												type="number"
												min={0}
												step={0.01}
												placeholder="0.00"
												value={f.value || ""}
												onChange={(e) => {
													const v = e.target.value;
													f.onChange(v === "" ? 0 : Number(v));
												}}
												className="h-6 w-20 xs:h-7 xs:w-24 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50"
											/>
										)}
									/>
								</div>
								<span className="font-medium text-rose-600 dark:text-rose-400">
									{depositAmount > 0 ? `−${fmt(depositAmount)} €` : "—"}
								</span>
							</div>

							{/* NET À PAYER */}
							<div className="flex justify-between items-center pt-2 border-t-2 border-violet-300 dark:border-violet-400/40 mt-1">
								<span className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">
									NET À PAYER
								</span>
								<span className="text-xl font-bold text-violet-700 dark:text-violet-200">
									{fmt(totals.netAPayer)} €
								</span>
							</div>
						</section>
					</>
				)}

				{/* ══════════════════════════════════════════════════════════
				    ÉTAPE 3 — Notes & conditions, Liens de paiement
				    ══════════════════════════════════════════════════════════ */}
				{(!visibleStep || visibleStep === 3) && (
					<>
						{/* Séparateur entre étapes uniquement en mode non-filtré */}
						{!visibleStep && <div className={dividerClass} />}

						{/* ── Notes & conditions ────────────────────────── */}
						<section className="space-y-3">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
								Notes & conditions
							</h3>
							<Textarea
								placeholder="Conditions de paiement, mentions particulières..."
								{...register("notes")}
								className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50"
							/>
						</section>

						{/* ── Liens de paiement ─────────────────────────── */}
						<section className="space-y-3">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
								Liens de paiement
							</h3>
							{/* Tip email */}
							<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-400/20 text-xs text-violet-600 dark:text-violet-300">
								<span className="shrink-0">💳</span>
								<span>Ces boutons apparaîtront dans l&apos;email envoyé au client pour un paiement rapide.</span>
							</div>
							<div className="flex flex-wrap gap-2 xs:gap-3">
								{/* Stripe */}
								{canStripe ? (
									connectedProviders.stripe ? (
										<button
											type="button"
											onClick={() => togglePayment("stripe")}
											className={`flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 transition-all duration-300 cursor-pointer text-xs xs:text-sm font-semibold ${
												activePayments.stripe
													? "border-[#635BFF]/40 bg-linear-to-r from-[#635BFF]/10 to-[#7C3AED]/10 text-[#635BFF] dark:text-violet-300 shadow-sm"
													: "border-dashed border-slate-300 dark:border-violet-400/20 text-slate-400 dark:text-violet-400/50 hover:border-[#635BFF]/40 hover:text-[#635BFF] dark:hover:border-violet-400/40"
											}`}
										>
											<SiStripe className="size-3.5 xs:size-4" />
											Stripe
											{activePayments.stripe && (
												<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-[#635BFF] to-[#7C3AED] text-white">
													Actif
												</span>
											)}
										</button>
									) : (
										<button
											type="button"
											disabled
											title="Connectez Stripe dans vos paramètres de paiement"
											className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed text-xs xs:text-sm font-semibold opacity-60"
										>
											<SiStripe className="size-3.5 xs:size-4" />
											Stripe
											<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">Non connecté</span>
										</button>
									)
								) : (
									<button
										type="button"
										onClick={() => setUpgradeFeature("payment_stripe")}
										className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-pointer text-xs xs:text-sm font-semibold"
									>
										<Lock className="size-3 text-slate-300 dark:text-slate-600" />
										<SiStripe className="size-3.5 xs:size-4" />
										Stripe
										<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-700">Pro</span>
									</button>
								)}

								{/* PayPal */}
								{canPaypal ? (
									connectedProviders.paypal ? (
										<button
											type="button"
											onClick={() => togglePayment("paypal")}
											className={`flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 transition-all duration-300 cursor-pointer text-xs xs:text-sm font-semibold ${
												activePayments.paypal
													? "border-[#003087]/30 bg-linear-to-r from-[#003087]/10 to-[#009CDE]/10 text-[#003087] dark:text-blue-300 shadow-sm"
													: "border-dashed border-slate-300 dark:border-violet-400/20 text-slate-400 dark:text-violet-400/50 hover:border-[#003087]/30 hover:text-[#003087] dark:hover:border-blue-400/40"
											}`}
										>
											<SiPaypal className="size-3.5 xs:size-4" />
											PayPal
											{activePayments.paypal && (
												<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-[#003087] to-[#009CDE] text-white">
													Actif
												</span>
											)}
										</button>
									) : (
										<button
											type="button"
											disabled
											title="Connectez PayPal dans vos paramètres de paiement"
											className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed text-xs xs:text-sm font-semibold opacity-60"
										>
											<SiPaypal className="size-3.5 xs:size-4" />
											PayPal
											<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">Non connecté</span>
										</button>
									)
								) : (
									<button
										type="button"
										onClick={() => setUpgradeFeature("payment_paypal")}
										className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-pointer text-xs xs:text-sm font-semibold"
									>
										<Lock className="size-3 text-slate-300 dark:text-slate-600" />
										<SiPaypal className="size-3.5 xs:size-4" />
										PayPal
										<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-700">Pro</span>
									</button>
								)}

								{/* GoCardless SEPA */}
								{canGocardless ? (
									connectedProviders.gocardless ? (
										<button
											type="button"
											onClick={() => togglePayment("gocardless")}
											className={`flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 transition-all duration-300 cursor-pointer text-xs xs:text-sm font-semibold ${
												activePayments.gocardless
													? "border-[#0F766E]/30 bg-linear-to-r from-[#0F766E]/10 to-[#059669]/10 text-[#0F766E] dark:text-emerald-300 shadow-sm"
													: "border-dashed border-slate-300 dark:border-violet-400/20 text-slate-400 dark:text-violet-400/50 hover:border-[#0F766E]/30 hover:text-[#0F766E] dark:hover:border-emerald-400/40"
											}`}
										>
											<span className="size-3.5 xs:size-4 flex items-center justify-center font-black text-[10px]">GC</span>
											SEPA
											{activePayments.gocardless && (
												<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-[#0F766E] to-[#059669] text-white">
													Actif
												</span>
											)}
										</button>
									) : (
										<button
											type="button"
											disabled
											title="Connectez GoCardless dans vos paramètres de paiement"
											className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed text-xs xs:text-sm font-semibold opacity-60"
										>
											<span className="size-3.5 xs:size-4 flex items-center justify-center font-black text-[10px]">GC</span>
											SEPA
											<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">Non connecté</span>
										</button>
									)
								) : (
									<button
										type="button"
										onClick={() => setUpgradeFeature("payment_gocardless")}
										className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-pointer text-xs xs:text-sm font-semibold"
									>
										<Lock className="size-3 text-slate-300 dark:text-slate-600" />
										<span className="size-3.5 xs:size-4 flex items-center justify-center font-black text-[10px]">GC</span>
										SEPA
										<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-700">Pro</span>
									</button>
								)}
							</div>
						</section>
					</>
				)}

				{/* Erreur client globale */}
				{errors.clientId?.message && (
					<p className="text-xs text-red-500 dark:text-red-400 text-center">
						{errors.clientId.message}
					</p>
				)}

				{/* Boutons d'action — cachés quand le stepper gère la navigation */}
				{!hideSubmit && (
					<div className="flex items-center gap-3 lg:justify-end">
						{/* Aperçu PDF — visible uniquement si le callback est fourni */}
						{onPdfPreview && (
							<button
								type="button"
								onClick={onPdfPreview}
								className="rounded-lg border px-4 h-11 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500/50 dark:text-sky-400 dark:hover:bg-sky-950/50 cursor-pointer shrink-0"
							>
								<Eye size={15} />
								Aperçu PDF
							</button>
						)}
						<Button
							type="submit"
							variant="gradient"
							disabled={isSubmitting}
							className="flex-1 lg:flex-none lg:min-w-44 h-11 cursor-pointer transition-all duration-300 hover:scale-103 disabled:opacity-70 disabled:cursor-not-allowed"
						>
							{isSubmitting ? "En cours…" : submitLabel}
						</Button>
					</div>
				)}
			</form>

			{/* Modale upgrade pour les providers de paiement */}
			{upgradeFeature && (
				<UpgradeModal
					open={!!upgradeFeature}
					onClose={() => setUpgradeFeature(null)}
					feature={upgradeFeature}
					plan={effectivePlan}
				/>
			)}
		</>
	);
}
