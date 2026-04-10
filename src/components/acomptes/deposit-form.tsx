"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Controller, useWatch, type UseFormReturn, type FieldErrors } from "react-hook-form";
import {
	Building2,
	AlertCircle,
	Calendar,
	Euro,
	FileText,
	Lock,
	Eye,
	Pencil,
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
import { SiStripe, SiPaypal } from "react-icons/si";
import { toast } from "sonner";
import { ClientSearch } from "@/components/factures/client-search";
import { ProductCombobox } from "@/components/shared/product-combobox";
import { CompanyInfoModal } from "@/components/factures/company-info-modal";
import type { CompanyInfo } from "@/lib/validations/invoice";
import { canUseFeature } from "@/lib/feature-gate";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import type { Feature } from "@/lib/feature-gate";
import { useConnectedProviders } from "@/hooks/use-payment-accounts";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Types ─────────────────────────────────────────────────────────────────

interface DepositFormData {
	clientId: string;
	customNumber?: string; // Numéro personnalisé (pré-rempli auto, éditable)
	amount: number;
	vatRate: 0 | 5.5 | 10 | 20;
	date: string;
	dueDate: string;
	deliveryDate?: string;
	description: string;
	notes?: string;
	paymentLinks: {
		stripe: boolean;
		paypal: boolean;
		gocardless: boolean;
	};
}

interface DepositFormProps {
	form: UseFormReturn<DepositFormData>;
	onSubmit: (data: DepositFormData) => void;
	companyInfo: CompanyInfo | null;
	onCompanyChange: (data: CompanyInfo) => void;
	isSubmitting: boolean;
	// Plan actif de l'utilisateur (pour gating des providers de paiement)
	effectivePlan?: string;
	// Numéro de l'acompte (affiché dans les pages edit)
	depositNumber?: string;
	// Label personnalisé pour le bouton submit (ex: "Sauvegarder" en mode édition)
	submitLabel?: string;
	// Stepper : n'affiche que les sections de l'étape active
	visibleStep?: 1 | 2 | 3;
	// Stepper : masque le bouton submit (navigation gérée par le stepper)
	hideSubmit?: boolean;
	// Callback pour ouvrir l'aperçu PDF (optionnel)
	onPdfPreview?: () => void;
	/** Callback appelé quand l'utilisateur modifie le numéro du document */
	onNumberChange?: (n: string) => void;
}

// ─── Styles partagés ─────────────────────────────────────────────────────────

const dividerClass =
	"mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent";
const inputClass =
	"bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

// Styles Select communs
const selectContentClass =
	"bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50";
const selectItemClass =
	"cursor-pointer rounded-lg transition-colors text-xs xs:text-sm dark:text-slate-100 hover:bg-violet-200/70 data-highlighted:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-highlighted:bg-violet-500/25 data-highlighted:text-violet-900 dark:data-highlighted:text-slate-50";

// ─── Composant principal ──────────────────────────────────────────────────────

export function DepositForm({
	form,
	onSubmit,
	companyInfo,
	onCompanyChange,
	isSubmitting,
	effectivePlan = "FREE",
	depositNumber,
	submitLabel,
	visibleStep,
	hideSubmit,
	onPdfPreview,
	onNumberChange,
}: DepositFormProps) {
	const [showCompanyModal, setShowCompanyModal] = useState(false);
	const [upgradeFeature, setUpgradeFeature] = useState<Feature | null>(null);

	const { register, handleSubmit, setValue, control, formState: { errors } } = form;

	// Vérifier l'accès aux providers de paiement (plan)
	const pseudoUser = { plan: effectivePlan, trialEndsAt: null };
	const canStripe = canUseFeature(pseudoUser, "payment_stripe");
	const canPaypal = canUseFeature(pseudoUser, "payment_paypal");
	const canGocardless = canUseFeature(pseudoUser, "payment_gocardless");

	// Vérifier si les providers sont réellement connectés
	const connectedProviders = useConnectedProviders();

	// Toggles locaux pour les boutons de paiement gradient
	const [activePayments, setActivePayments] = useState({
		stripe: form.getValues("paymentLinks.stripe"),
		paypal: form.getValues("paymentLinks.paypal"),
		gocardless: form.getValues("paymentLinks.gocardless"),
	});

	const togglePayment = useCallback(
		(key: "stripe" | "paypal" | "gocardless") => {
			setActivePayments((prev) => {
				const next = !prev[key];
				setValue(
					`paymentLinks.${key}` as
						| "paymentLinks.stripe"
						| "paymentLinks.paypal"
						| "paymentLinks.gocardless",
					next,
					{ shouldDirty: true },
				);
				return { ...prev, [key]: next };
			});
		},
		[setValue],
	);

	// Watch les champs pour la réactivité temps réel
	const amount = useWatch({ control, name: "amount" });
	const vatRate = useWatch({ control, name: "vatRate" });
	const clientId = useWatch({ control, name: "clientId" });
	const customNumber = useWatch({ control, name: "customNumber" });

	// Sync : quand le numéro auto-généré arrive (prop), initialiser le champ s'il est vide
	useEffect(() => {
		if (depositNumber && !form.getValues("customNumber")) {
			setValue("customNumber", depositNumber);
		}
	}, [depositNumber, setValue, form]);

	// Notifier le parent dès que customNumber change
	useEffect(() => {
		if (customNumber) onNumberChange?.(customNumber);
	}, [customNumber, onNumberChange]);

	const { currency } = useAppearance();
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

	const handleSelectClient = useCallback(
		(id: string) => setValue("clientId", id),
		[setValue],
	);

	const handleClearClient = useCallback(
		() => setValue("clientId", ""),
		[setValue],
	);

	const onError = useCallback((errs: FieldErrors<DepositFormData>) => {
		console.log("Erreurs:", errs);
		toast.error("Veuillez corriger les erreurs du formulaire");
	}, []);

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">

				{/* ══ ÉTAPE 1 : Émetteur + Destinataire ══════════════════ */}

				{(!visibleStep || visibleStep === 1) && (
					<>
						{/* ── Émetteur ──────────────────────────────── */}
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
								<div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-100/60 dark:bg-[#251e4d] p-3.5 shadow-sm">
									<p className="font-semibold text-[10px] xs:text-xs 2xl:text-sm  text-slate-800 dark:text-slate-100">
										{companyInfo.name}
									</p>
									<p className="text-[10px] xs:text-xs text-slate-500 dark:text-violet-300/80">
										{companyInfo.address}
									</p>
                  <p className="text-slate-500 dark:text-violet-300/80 text-[10px] xs:text-xs">
										{companyInfo.zipCode} {companyInfo.city}
									</p>
									<p className="text-[10px] xs:text-xs text-slate-500 dark:text-violet-300/80 mt-0.5">
										SIRET : {companyInfo.siret}
									</p>
									<p className="text-[10px] xs:text-xs text-slate-500 dark:text-violet-300/80">
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

						{/* ── Destinataire ──────────────────────────── */}
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
					</>
				)}

				{/* ══ ÉTAPE 2 : Dates + Détails + Paiement ═══════════════ */}

				{(!visibleStep || visibleStep === 2) && (
					<>
						{/* ── Numéro + Dates ───────────────────────── */}
						<section className="space-y-4">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
								<Calendar className="size-4 text-violet-600 dark:text-violet-400" />
								Informations
							</h3>
							{/* N° Acompte — éditable */}
							<div className="max-w-[130px] xs:max-w-xs">
								<Label className="text-xs text-slate-600 dark:text-violet-200">N° Acompte</Label>
								<div className="relative">
									<Controller
										name="customNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												value={field.value ?? ""}
												placeholder={depositNumber || "Ex: DEP-2025-0001"}
												className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-xs xs:text-sm text-slate-900 dark:text-slate-50 pr-8 font-mono"
											/>
										)}
									/>
									<Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 dark:text-violet-400/60 pointer-events-none" />
								</div>
								{errors.customNumber && (
									<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.customNumber.message}</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-3 xs:gap-4">
								<div className="space-y-2">
									<Label htmlFor="date" className="text-xs font-medium text-slate-700 dark:text-slate-300">
										Émission *
									</Label>
									<Input
										id="date"
										type="date"
										{...register("date")}
										className={inputClass}
									/>
									{errors.date && (
										<p className="text-xs text-red-500 dark:text-red-400">
											{errors.date.message}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="dueDate" className="text-xs font-medium text-slate-700 dark:text-slate-300">
										Échéance *
									</Label>
									<Input
										id="dueDate"
										type="date"
										{...register("dueDate")}
										className={inputClass}
									/>
									{errors.dueDate && (
										<p className="text-xs text-red-500 dark:text-red-400">
											{errors.dueDate.message}
										</p>
									)}
								</div>
							</div>
							{/* Date de livraison optionnelle */}
							<div className="space-y-2">
								<Label htmlFor="deliveryDate" className="text-xs font-medium text-slate-700 dark:text-slate-300">
									Date de livraison{" "}
									<span className="font-normal text-slate-400 dark:text-violet-400/50">(optionnel)</span>
								</Label>
								<Input
									id="deliveryDate"
									type="date"
									{...register("deliveryDate")}
									className={inputClass}
								/>
							</div>
						</section>

						<div className={dividerClass} />

						{/* ── Détails de l'acompte ──────────────────── */}
						<section className="space-y-4">
							<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
								<Euro className="size-4 text-violet-600 dark:text-violet-400" />
								Détails de l&apos;acompte
							</h3>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{/* Description */}
								<div className="space-y-2">
									<Label htmlFor="description" className="text-xs font-medium text-slate-700 dark:text-slate-300">
										Description *
									</Label>
									{/* Controller : évite la perte de valeur au re-render (même fix que quote-form) */}
									<Controller
										name="description"
										control={control}
										render={({ field }) => (
											<ProductCombobox
												value={field.value ?? ""}
												onChange={field.onChange}
												onProductSelect={({ description, unitPrice }) => {
													field.onChange(description);
													if (unitPrice > 0) setValue("amount", unitPrice, { shouldValidate: false });
												}}
												currentUnitPrice={Number(amount ?? 0)}
												placeholder="Acompte 30% - Projet X"
												className={inputClass}
											/>
										)}
									/>
									{errors.description && (
										<p className="text-xs text-red-500 dark:text-red-400">
											{errors.description.message}
										</p>
									)}
								</div>

								{/* Montant HT */}
								<div className="space-y-2">
									<Label htmlFor="amount" className="text-xs font-medium text-slate-700 dark:text-slate-300">
										Montant HT *
									</Label>
									{/* Controller : garantit la réactivité de useWatch */}
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
										<p className="text-xs text-red-500 dark:text-red-400">
											{errors.amount.message}
										</p>
									)}
								</div>

								{/* Taux de TVA */}
								<div className="space-y-2">
									<Label htmlFor="vatRate" className="text-xs font-medium text-slate-700 dark:text-slate-300">
										Taux de TVA
									</Label>
									<Controller
										name="vatRate"
										control={control}
										render={({ field }) => (
											<Select
												value={field.value.toString()}
												onValueChange={(v) => field.onChange(Number(v))}
											>
												<SelectTrigger className="h-10 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-lg text-xs xs:text-sm text-slate-900 dark:text-slate-50">
													<SelectValue />
												</SelectTrigger>
												<SelectContent
													side="bottom"
													avoidCollisions={false}
													className={selectContentClass}
												>
													<SelectItem value="0" className={selectItemClass}>0% (exonéré)</SelectItem>
													<SelectItem value="5.5" className={selectItemClass}>5,5% (réduit)</SelectItem>
													<SelectItem value="10" className={selectItemClass}>10% (intermédiaire)</SelectItem>
													<SelectItem value="20" className={selectItemClass}>20% (normal)</SelectItem>
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
									<div className="rounded-xl border bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border-violet-200/50 dark:border-violet-500/20 p-3 space-y-1 text-xs xs:text-sm">
										<div className="flex justify-between">
											<span className="text-slate-600 dark:text-slate-300">Montant HT :</span>
											<span className="font-medium text-slate-900 dark:text-slate-50">
												{formatCurrency(calculations.subtotal > 0 ? calculations.subtotal : 0, currency)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-600 dark:text-slate-300">TVA ({vatRate ?? 20}%) :</span>
											<span className="font-medium text-slate-900 dark:text-slate-50">
												{formatCurrency(calculations.taxAmount > 0 ? calculations.taxAmount : 0, currency)}
											</span>
										</div>
										<div className="flex justify-between border-t border-slate-300 dark:border-slate-600 pt-1 font-semibold">
											<span className="text-slate-600 dark:text-slate-300">Total TTC :</span>
											<span className="text-violet-600 dark:text-violet-400">
												{formatCurrency(calculations.total > 0 ? calculations.total : 0, currency)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</section>

						<div className={dividerClass} />

						{/* ── Liens de paiement ─────────────────────── */}
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
												<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-[#635BFF] to-[#7C3AED] text-white">Actif</span>
											)}
										</button>
									) : (
										<button type="button" disabled title="Connectez Stripe dans vos paramètres de paiement"
											className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed text-xs xs:text-sm font-semibold opacity-60">
											<SiStripe className="size-3.5 xs:size-4" />
											Stripe
											<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">Non connecté</span>
										</button>
									)
								) : (
									<button type="button" onClick={() => setUpgradeFeature("payment_stripe")}
										className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-pointer text-xs xs:text-sm font-semibold">
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
												<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-[#003087] to-[#009CDE] text-white">Actif</span>
											)}
										</button>
									) : (
										<button type="button" disabled title="Connectez PayPal dans vos paramètres de paiement"
											className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed text-xs xs:text-sm font-semibold opacity-60">
											<SiPaypal className="size-3.5 xs:size-4" />
											PayPal
											<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">Non connecté</span>
										</button>
									)
								) : (
									<button type="button" onClick={() => setUpgradeFeature("payment_paypal")}
										className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-pointer text-xs xs:text-sm font-semibold">
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
												<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-[#0F766E] to-[#059669] text-white">Actif</span>
											)}
										</button>
									) : (
										<button type="button" disabled title="Connectez GoCardless dans vos paramètres de paiement"
											className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed text-xs xs:text-sm font-semibold opacity-60">
											<span className="size-3.5 xs:size-4 flex items-center justify-center font-black text-[10px]">GC</span>
											SEPA
											<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">Non connecté</span>
										</button>
									)
								) : (
									<button type="button" onClick={() => setUpgradeFeature("payment_gocardless")}
										className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-pointer text-xs xs:text-sm font-semibold">
										<Lock className="size-3 text-slate-300 dark:text-slate-600" />
										<span className="size-3.5 xs:size-4 flex items-center justify-center font-black text-[10px]">GC</span>
										SEPA
										<span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-700">Pro</span>
									</button>
								)}
							</div>
							{upgradeFeature && (
								<UpgradeModal
									open={!!upgradeFeature}
									onClose={() => setUpgradeFeature(null)}
									feature={upgradeFeature}
									plan={effectivePlan}
								/>
							)}
						</section>
					</>
				)}

				{/* ══ ÉTAPE 3 : Notes ═════════════════════════════════════ */}

				{(!visibleStep || visibleStep === 3) && (
					<section className="space-y-4">
						<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
							<FileText className="size-4 text-violet-600 dark:text-violet-400" />
							Notes (optionnel)
						</h3>
						<Textarea
							{...register("notes")}
							placeholder="Notes additionnelles pour le client..."
							rows={3}
							className={inputClass}
						/>
					</section>
				)}

				{/* ── Bouton submit (masqué si hideSubmit = stepper) ─── */}
				{!hideSubmit && (
					<div className="flex items-center gap-3 lg:justify-end">
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
							className="flex-1 lg:flex-none lg:min-w-44 h-11 cursor-pointer transition-all duration-300 hover:scale-101"
						>
							{isSubmitting ? "En cours…" : (submitLabel ?? "Créer l'acompte")}
						</Button>
					</div>
				)}
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
