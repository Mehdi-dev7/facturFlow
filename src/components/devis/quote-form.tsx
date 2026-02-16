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
	X,
	Banknote,
} from "lucide-react";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { ClientSearch } from "@/components/factures/client-search";
import { CompanyInfoModal } from "@/components/factures/company-info-modal";
import {
	VAT_RATES,
	INVOICE_TYPES,
	INVOICE_TYPE_LABELS,
	INVOICE_TYPE_CONFIG,
	type InvoiceType,
	type QuoteFormData,
	type CompanyInfo,
	type QuickClientData,
} from "@/lib/validations/quote";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";

const dividerClass =
	"mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent";
const inputClass =
	"bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50 autofill:shadow-[inset_0_0_0_30px_white] dark:autofill:shadow-[inset_0_0_0_30px_#2a2254] autofill:[-webkit-text-fill-color:theme(--color-slate-900)] dark:autofill:[-webkit-text-fill-color:theme(--color-slate-50)]";

interface QuoteFormProps {
	form: UseFormReturn<QuoteFormData>;
	onSubmit: (data: QuoteFormData) => void;
	quoteNumber: string;
	companyInfo: CompanyInfo | null;
	onCompanyChange: (data: CompanyInfo) => void;
}

export function QuoteForm({
	form,
	onSubmit,
	quoteNumber,
	companyInfo,
	onCompanyChange,
}: QuoteFormProps) {
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
	const [showDepositDialog, setShowDepositDialog] = useState(false);
	const [depositInput, setDepositInput] = useState("");

	const lines        = useWatch({ control, name: "lines" });
	const vatRate      = useWatch({ control, name: "vatRate" });
	const clientId     = useWatch({ control, name: "clientId" });
	const quoteType    = (useWatch({ control, name: "quoteType" }) ?? "basic") as InvoiceType;
	const discountType = useWatch({ control, name: "discountType" });
	const discountValue = useWatch({ control, name: "discountValue" }) ?? 0;
	const depositAmount = useWatch({ control, name: "depositAmount" }) ?? 0;

	const typeConfig = INVOICE_TYPE_CONFIG[quoteType];
	const isForfait  = typeConfig.quantityLabel === null;
	const isArtisan  = quoteType === "artisan";

	const fmt = useCallback(
		(n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		[],
	);

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

	const onError = useCallback((formErrors: FieldErrors<QuoteFormData>) => {
		console.warn("[QuoteForm] Validation errors:", formErrors);
	}, []);

	const handleConfirmDeposit = useCallback(() => {
		const val = Math.max(0, Number(depositInput) || 0);
		setValue("depositAmount", val, { shouldDirty: true });
		setShowDepositDialog(false);
	}, [depositInput, setValue]);

	const handleRemoveDeposit = useCallback(() => {
		setValue("depositAmount", 0, { shouldDirty: true });
		setDepositInput("");
	}, [setValue]);

	return (
		<>
			<CompanyInfoModal
				open={showCompanyModal}
				onOpenChange={setShowCompanyModal}
				defaultValues={companyInfo ?? undefined}
				onSave={onCompanyChange}
			/>

			{/* Dialog acompte */}
			<Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
				<DialogContent className="sm:max-w-xs bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
							<Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
							Acompte à verser
						</DialogTitle>
						<DialogDescription className="text-slate-500 dark:text-slate-400">
							Somme que le client devra régler avant le démarrage du projet.
						</DialogDescription>
					</DialogHeader>
					<div className="py-2">
						<div className="relative">
							<Input
								type="number"
								min={0}
								step={0.01}
								value={depositInput}
								onChange={(e) => setDepositInput(e.target.value)}
								className={`${inputClass} pr-8`}
								placeholder="0.00"
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleConfirmDeposit();
									}
								}}
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
								€
							</span>
						</div>
					</div>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setShowDepositDialog(false)}
							className="text-slate-500 dark:text-violet-300 hover:bg-slate-100 dark:hover:bg-violet-500/15 cursor-pointer"
						>
							Annuler
						</Button>
						<Button
							type="button"
							variant="gradient"
							size="sm"
							onClick={handleConfirmDeposit}
							className="cursor-pointer"
						>
							Confirmer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
				{/* Émetteur */}
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
							<p className="font-semibold text-slate-800 dark:text-slate-100">
								{companyInfo.name}
							</p>
							<p className="text-slate-500 dark:text-violet-300/80 mt-0.5">
								SIRET : {companyInfo.siret}
							</p>
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
							<p className="text-xs text-amber-600/70 dark:text-amber-400/60">
								Cliquez pour compléter
							</p>
						</button>
					)}
				</section>

				<div className={dividerClass} />

				{/* Destinataire */}
				<section className="space-y-3">
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

				{/* Informations */}
				<section className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Informations
					</h3>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<Label className="text-slate-600 dark:text-violet-200">N° Devis</Label>
							<Input
								value={quoteNumber}
								disabled
								className="bg-slate-100 dark:bg-[#1e1845] border-slate-300 dark:border-violet-400/70 rounded-xl text-slate-500 dark:text-violet-100/80"
							/>
						</div>
						<div>
							<Label className="text-slate-600 dark:text-violet-200">Date</Label>
							<Controller
								name="date"
								control={control}
								render={({ field }) => (
									<Input
										type="date"
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
										className={`${inputClass} dark:[&::-webkit-calendar-picker-indicator]:invert`}
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
							<Label className="text-slate-600 dark:text-violet-200">
								Valable jusqu'au
							</Label>
							<Controller
								name="validUntil"
								control={control}
								render={({ field }) => (
									<Input
										type="date"
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
										className={`${inputClass} dark:[&::-webkit-calendar-picker-indicator]:invert`}
										aria-invalid={!!errors.validUntil}
									/>
								)}
							/>
							{errors.validUntil && (
								<p className="text-xs text-red-500 dark:text-red-400 mt-1">
									{errors.validUntil.message}
								</p>
							)}
						</div>
					</div>
				</section>

				<div className={dividerClass} />

				{/* Type de devis */}
				<section className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
						<Layers className="size-4 text-violet-600 dark:text-violet-400" />
						Type de devis
					</h3>
					<Controller
						name="quoteType"
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
								<SelectTrigger className={`${inputClass} w-full`}>
									<SelectValue placeholder="Choisir un type" />
								</SelectTrigger>
								<SelectContent side="bottom" avoidCollisions={false} className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
									{INVOICE_TYPES.map((type) => (
										<SelectItem
											key={type}
											value={type}
											className="cursor-pointer rounded-lg transition-colors text-sm dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50"
										>
											{INVOICE_TYPE_LABELS[type]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</section>

				<div className={dividerClass} />

				{/* Lignes */}
				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
							Lignes de devis
						</h3>
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={() =>
								append({ description: "", quantity: 1, unitPrice: 0 })
							}
							className="border-primary/20 dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/15 dark:text-slate-100 transition-all duration-300 cursor-pointer"
						>
							<Plus className="size-3.5" />
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
									className="rounded-xl border border-violet-200 dark:border-violet-400/25 p-3.5 space-y-2.5 bg-violet-100/45 dark:bg-[#251e4d] transition-all duration-300 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-400/40 shadow-sm"
								>
									<div className="flex items-start gap-2">
										<div className="flex-1">
											<Input
												placeholder={typeConfig.descriptionLabel}
												{...register(`lines.${index}.description`)}
												className={inputClass}
												aria-invalid={!!lineErrors?.description}
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

									<div className={`grid gap-2 ${isForfait ? "grid-cols-2" : "grid-cols-3"}`}>
										{/* Quantité (masquée en mode forfait) */}
										{!isForfait && (
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
											<Label className="text-xs text-slate-500 dark:text-violet-200">
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

										{/* Total HT */}
										<div>
											<Label className="text-xs text-slate-500 dark:text-violet-200">
												Total HT
											</Label>
											<div className="h-9 flex items-center text-sm font-bold text-violet-700 dark:text-violet-300">
												{fmt(lineHT)} €
											</div>
										</div>
									</div>

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
														<SelectTrigger className="h-7 text-xs bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg dark:text-slate-50">
															<SelectValue />
														</SelectTrigger>
														<SelectContent side="bottom" avoidCollisions={false} className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
															<SelectItem value="main_oeuvre" className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50">
																Main d'œuvre
															</SelectItem>
															<SelectItem value="materiel" className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50">
																Matériaux
															</SelectItem>
														</SelectContent>
													</Select>
												)}
											/>
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
							onClick={() =>
								append({ description: "", quantity: 1, unitPrice: 0 })
							}
						>
							<Plus className="size-4" />
							Ajouter une ligne
						</Button>
					)}
				</section>

				{/* Acompte à verser — informatif, placé sous les lignes */}
				{depositAmount > 0 ? (
					<div className="rounded-xl border border-emerald-200 dark:border-emerald-400/25 bg-emerald-50/60 dark:bg-emerald-900/10 px-4 py-3 flex items-center justify-between gap-3">
						<div className="flex items-center gap-2.5">
							<Banknote className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
							<div>
								<p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
									Acompte à verser
								</p>
								<p className="text-xs text-slate-500 dark:text-violet-300/70">
									À régler avant le démarrage du projet
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<button
								type="button"
								onClick={() => {
									setDepositInput(String(depositAmount));
									setShowDepositDialog(true);
								}}
								className="text-base font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
							>
								{fmt(depositAmount)} €
							</button>
							<button
								type="button"
								onClick={handleRemoveDeposit}
								className="size-5 rounded-full bg-white dark:bg-[#2a2254] border border-slate-200 dark:border-violet-400/30 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
								aria-label="Supprimer l'acompte"
							>
								<X className="size-3" />
							</button>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={() => {
							setDepositInput("");
							setShowDepositDialog(true);
						}}
						className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-violet-400/20 text-sm text-slate-400 dark:text-violet-400/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-400/40 dark:hover:text-emerald-400 transition-colors cursor-pointer"
					>
						<Banknote className="size-4" />
						Ajouter un acompte à verser
					</button>
				)}

				<div className={dividerClass} />

				{/* Totaux + TVA + Réduction */}
				<section className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-100/60 dark:bg-[#251e4d] p-4 space-y-2 shadow-sm">

					{/* Sous-total HT */}
					<div className="flex justify-between text-sm">
						<span className="text-slate-500 dark:text-violet-200">Sous-total HT</span>
						<span className="font-medium text-slate-800 dark:text-slate-100">
							{fmt(totals.subtotal)} €
						</span>
					</div>

					{/* Réduction — même style que la facture */}
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-slate-500 dark:text-violet-200">Réduction</span>
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
										<SelectTrigger className="h-7 w-28 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50">
											<SelectValue placeholder="Aucune" />
										</SelectTrigger>
										<SelectContent side="bottom" avoidCollisions={false} className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
											<SelectItem value="none" className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50">Aucune</SelectItem>
											<SelectItem value="pourcentage" className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50">
												Pourcentage (%)
											</SelectItem>
											<SelectItem value="montant" className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50">
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
											className="h-7 w-20 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50"
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
						<div className="flex justify-between text-sm border-t border-violet-200 dark:border-violet-400/20 pt-2">
							<span className="text-slate-600 dark:text-violet-200 font-medium">Net HT</span>
							<span className="font-medium text-slate-800 dark:text-slate-100">
								{fmt(totals.netHT)} €
							</span>
						</div>
					)}

					{/* TVA */}
					<div className="flex justify-between items-center text-sm">
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
								<SelectTrigger className="h-7 w-20 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs text-slate-900 dark:text-slate-50">
									<SelectValue />
								</SelectTrigger>
								<SelectContent side="bottom" avoidCollisions={false} className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
									{VAT_RATES.map((rate) => (
										<SelectItem
											key={rate}
											value={String(rate)}
											className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50"
										>
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

					<div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />

					{/* Total TTC */}
					<div className="flex justify-between text-base font-bold">
						<span className="text-slate-800 dark:text-slate-50">Total TTC</span>
						<span className="text-emerald-600 dark:text-emerald-400">
							{fmt(totals.totalTTC)} €
						</span>
					</div>

					{/* NET À PAYER si réduction */}
					{totals.discountAmount > 0 && (
						<div className="flex justify-between items-center pt-2 border-t-2 border-emerald-400/40 dark:border-emerald-500/30 mt-1">
							<span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
								NET À PAYER
							</span>
							<span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
								{fmt(totals.netAPayer)} €
							</span>
						</div>
					)}
				</section>

				{/* Notes */}
				<section className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Notes & conditions
					</h3>
					<Textarea
						placeholder="Conditions d'acceptation, mentions particulières..."
						{...register("notes")}
						className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50"
					/>
				</section>

				{/* Erreur globale (refine) */}
				{errors.clientId?.message && (
					<p className="text-xs text-red-500 dark:text-red-400 text-center">
						{errors.clientId.message}
					</p>
				)}

				<div className="lg:ml-auto lg:w-1/3">
					<Button
						type="submit"
						variant="gradient"
						className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-101"
					>
						Créer le devis
					</Button>
				</div>
			</form>
		</>
	);
}
