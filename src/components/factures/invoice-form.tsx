"use client";

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
} from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ClientSearch } from "./client-search";
import { CompanyInfoModal } from "./company-info-modal";
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
	const clientId = useWatch({ control, name: "clientId" });
	const invoiceType = useWatch({ control, name: "invoiceType" }) ?? "basic";
	const discountType = useWatch({ control, name: "discountType" });
	const discountValue = useWatch({ control, name: "discountValue" }) ?? 0;
	const depositAmount = useWatch({ control, name: "depositAmount" }) ?? 0;

	// ── Config du type ─────────────────────────────────────────────────────
	const typeConfig = INVOICE_TYPE_CONFIG[invoiceType as InvoiceType] ?? INVOICE_TYPE_CONFIG.basic;

	// ── Calculs ────────────────────────────────────────────────────────────
	const totals = useMemo(() => {
		const subtotal = (lines || []).reduce(
			(sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
			0,
		);

		let discountAmount = 0;
		if (discountType === "pourcentage" && discountValue > 0) {
			discountAmount = subtotal * (discountValue / 100);
		} else if (discountType === "montant" && discountValue > 0) {
			discountAmount = Math.min(discountValue, subtotal);
		}

		const netHT = Math.max(0, subtotal - discountAmount);
		const taxTotal = netHT * ((vatRate || 0) / 100);
		const totalTTC = netHT + taxTotal;
		const netAPayer = Math.max(0, totalTTC - (depositAmount || 0));

		return { subtotal, discountAmount, netHT, taxTotal, totalTTC, netAPayer };
	}, [lines, vatRate, discountType, discountValue, depositAmount]);

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
			quantity: typeConfig.quantityLabel === null ? 1 : 1,
			unitPrice: 0,
			category: invoiceType === "artisan" ? "main_oeuvre" : undefined,
		});
	}, [append, typeConfig, invoiceType]);

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
									<Input
										value={invoiceNumber}
										disabled
										className="bg-slate-100 dark:bg-[#1e1845] border-slate-300 dark:border-violet-400/70 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-violet-100/80"
									/>
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
															<Input
																placeholder={typeConfig.descriptionLabel}
																value={f.value ?? ""}
																onChange={(e) => f.onChange(e.target.value)}
																onBlur={f.onBlur}
																ref={f.ref}
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

							{/* TVA */}
							<div className="flex justify-between items-center text-xs xs:text-sm">
								<div className="flex items-center gap-2">
									<span className="text-slate-500 dark:text-violet-200">TVA</span>
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
									<span className="text-slate-500 text-xs xs:text-sm dark:text-violet-200">Acompte versé</span>
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

								{/* PayPal */}
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

								{/* GoCardless SEPA */}
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

				{/* Bouton de soumission — caché quand le stepper gère la navigation */}
				{!hideSubmit && (
					<div className="lg:ml-auto lg:w-1/3">
						<Button
							type="submit"
							variant="gradient"
							disabled={isSubmitting}
							className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-103 disabled:opacity-70 disabled:cursor-not-allowed"
						>
							{isSubmitting ? "En cours…" : submitLabel}
						</Button>
					</div>
				)}
			</form>
		</>
	);
}
