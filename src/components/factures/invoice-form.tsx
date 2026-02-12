"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import {
	Plus,
	Trash2,
	Building2,
	AlertCircle,
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
import { ClientSearch } from "./client-search";
import { CompanyInfoModal } from "./company-info-modal";
import {
	VAT_RATES,
	type InvoiceFormData,
	type CompanyInfo,
	type QuickClientData,
} from "@/lib/validations/invoice";

function generateInvoiceNumber(): string {
	const year = new Date().getFullYear();
	const count = Math.floor(Math.random() * 900) + 100;
	return `FAC-${year}-${String(count).padStart(3, "0")}`;
}

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

function dueDateISO(): string {
	const d = new Date();
	d.setDate(d.getDate() + 30);
	return d.toISOString().split("T")[0];
}

interface InvoiceFormProps {
	form: UseFormReturn<InvoiceFormData>;
	onSubmit: (data: InvoiceFormData) => void;
	invoiceNumber: string;
	companyInfo: CompanyInfo | null;
	onCompanyChange: (data: CompanyInfo) => void;
}

export function InvoiceForm({ form, onSubmit, invoiceNumber, companyInfo, onCompanyChange }: InvoiceFormProps) {
	const {
		register,
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = form;

	const { fields, append, remove } = useFieldArray({
		control,
		name: "lines",
	});

	const [showCompanyModal, setShowCompanyModal] = useState(false);
	const [showPaymentLinks, setShowPaymentLinks] = useState(false);

	const lines = watch("lines");

	const totals = useMemo(() => {
		const subtotal = (lines || []).reduce(
			(sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0),
			0,
		);
		const taxTotal = (lines || []).reduce(
			(sum, line) =>
				sum +
				(line.quantity || 0) *
					(line.unitPrice || 0) *
					((line.vatRate || 0) / 100),
			0,
		);
		return { subtotal, taxTotal, total: subtotal + taxTotal };
	}, [lines]);

	const handleSelectClient = useCallback(
		(clientId: string, clientData?: QuickClientData) => {
			setValue("clientId", clientId, { shouldValidate: true });
			if (clientData) {
				setValue("newClient", clientData);
			} else {
				setValue("newClient", undefined);
			}
		},
		[setValue],
	);

	const handleClearClient = useCallback(() => {
		setValue("clientId", undefined, { shouldValidate: true });
		setValue("newClient", undefined);
	}, [setValue]);

	const Divider = () => (
		<div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />
	);

	// Inputs : fond plus contrasté en dark pour bien se détacher du bg card
	const inputClass = "bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

	// Date inputs : idem + couleur du calendar icon
	const dateInputClass = `${inputClass} [&::-webkit-calendar-picker-indicator]:dark:invert`;

	return (
		<>
			<CompanyInfoModal
				open={showCompanyModal}
				onOpenChange={setShowCompanyModal}
				defaultValues={companyInfo ?? undefined}
				onSave={onCompanyChange}
			/>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
						<div className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-3.5 text-sm shadow-sm">
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

				<Divider />

				{/* Destinataire */}
				<section className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Destinataire
					</h3>
					<ClientSearch
						selectedClientId={watch("clientId")}
						onSelectClient={handleSelectClient}
						onClear={handleClearClient}
						error={errors.clientId?.message}
					/>
				</section>

				<Divider />

				{/* Infos facture */}
				<section className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Informations
					</h3>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<Label className="text-slate-600 dark:text-violet-200">N° Facture</Label>
							<Input value={invoiceNumber} disabled className="bg-slate-100 dark:bg-[#1e1845] border-slate-300 dark:border-violet-400/70 rounded-xl text-slate-500 dark:text-violet-100/80" />
						</div>
						<div>
							<Label htmlFor="invoiceDate" className="text-slate-600 dark:text-violet-200">Date</Label>
							<Input
								id="invoiceDate"
								type="date"
								{...register("date")}
								className={dateInputClass}
								aria-invalid={!!errors.date}
							/>
							{errors.date && (
								<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.date.message}</p>
							)}
						</div>
						<div>
							<Label htmlFor="invoiceDueDate" className="text-slate-600 dark:text-violet-200">Échéance</Label>
							<Input
								id="invoiceDueDate"
								type="date"
								{...register("dueDate")}
								className={dateInputClass}
								aria-invalid={!!errors.dueDate}
							/>
							{errors.dueDate && (
								<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.dueDate.message}</p>
							)}
						</div>
					</div>
				</section>

				<Divider />

				{/* Lignes */}
				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
							Lignes de facture
						</h3>
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={() =>
								append({ description: "", quantity: 1, unitPrice: 0, vatRate: 20 })
							}
							className="border-primary/20 dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/15 dark:text-slate-100 transition-all duration-300 cursor-pointer"
						>
							<Plus className="size-3.5" />
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
							const qty = lines?.[index]?.quantity || 0;
							const price = lines?.[index]?.unitPrice || 0;
							const vat = lines?.[index]?.vatRate || 0;
							const lineHT = qty * price;
							const lineTVA = lineHT * (vat / 100);
							const lineTTC = lineHT + lineTVA;

							return (
								<div
									key={field.id}
									className="rounded-xl border border-violet-200 dark:border-violet-400/25 p-3.5 space-y-2.5 bg-violet-50/50 dark:bg-[#251e4d]/70 transition-all duration-300 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-400/40 shadow-sm"
								>
									<div className="flex items-start gap-2">
										<div className="flex-1">
											<Input
												placeholder="Description du produit/service"
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
									<div className="grid grid-cols-4 gap-2">
										<div>
											<Label className="text-xs text-slate-500 dark:text-violet-200">Qté</Label>
											<Input
												type="number"
												min={1}
												step={1}
												{...register(`lines.${index}.quantity`, {
													valueAsNumber: true,
												})}
												className={inputClass}
												aria-invalid={!!lineErrors?.quantity}
											/>
										</div>
										<div>
											<Label className="text-xs text-slate-500 dark:text-violet-200">Prix unit. (€)</Label>
											<Input
												type="number"
												min={0}
												step={0.01}
												{...register(`lines.${index}.unitPrice`, {
													valueAsNumber: true,
												})}
												className={inputClass}
												aria-invalid={!!lineErrors?.unitPrice}
											/>
										</div>
										<div>
											<Label className="text-xs text-slate-500 dark:text-violet-200">TVA</Label>
											<Select
												value={String(vat)}
												onValueChange={(v) =>
													setValue(`lines.${index}.vatRate`, Number(v) as 0 | 5.5 | 10 | 20, {
														shouldValidate: true,
													})
												}
											>
												<SelectTrigger className="h-9 w-full bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30">
													{VAT_RATES.map((rate) => (
														<SelectItem key={rate} value={String(rate)} className="cursor-pointer hover:bg-violet-200/30 dark:hover:bg-violet-500/15 dark:text-slate-100">
															{rate}%
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label className="text-xs text-slate-500 dark:text-violet-200">Total TTC</Label>
											<div className="h-9 flex items-center text-sm font-bold text-violet-700 dark:text-violet-300">
												{lineTTC.toLocaleString("fr-FR", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}{" "}
												€
											</div>
										</div>
									</div>
									{/* Détail HT + TVA par ligne */}
									<div className="flex gap-4 text-[11px] text-slate-500 dark:text-violet-300/70 pt-0.5 border-t border-slate-100 dark:border-violet-400/10">
										<span className="pt-1.5">HT : {lineHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
										<span className="pt-1.5">TVA ({vat}%) : {lineTVA.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
									</div>
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
								append({ description: "", quantity: 1, unitPrice: 0, vatRate: 20 })
							}
						>
							<Plus className="size-4" />
							Ajouter une ligne
						</Button>
					)}
				</section>

				<Divider />

				{/* Totaux */}
				<section className="rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-4 space-y-2 shadow-sm">
					<div className="flex justify-between text-sm">
						<span className="text-slate-500 dark:text-violet-200">Sous-total HT</span>
						<span className="font-medium text-slate-800 dark:text-slate-100">
							{totals.subtotal.toLocaleString("fr-FR", {
								minimumFractionDigits: 2,
							})}{" "}
							€
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-slate-500 dark:text-violet-200">TVA</span>
						<span className="font-medium text-slate-800 dark:text-slate-100">
							{totals.taxTotal.toLocaleString("fr-FR", {
								minimumFractionDigits: 2,
							})}{" "}
							€
						</span>
					</div>
					<div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />
					<div className="flex justify-between text-base font-bold">
						<span className="text-slate-800 dark:text-slate-50">Total TTC</span>
						<span className="text-violet-600 dark:text-violet-300">
							{totals.total.toLocaleString("fr-FR", {
								minimumFractionDigits: 2,
							})}{" "}
							€
						</span>
					</div>
				</section>

				{/* Notes */}
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

				{/* Payment Links */}
				<section className="space-y-3">
					<div className="flex items-center gap-2">
						<Checkbox
							id="togglePayments"
							checked={showPaymentLinks}
							onCheckedChange={(v) => setShowPaymentLinks(!!v)}
						/>
						<Label htmlFor="togglePayments" className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-violet-200">
							<LinkIcon className="size-3.5" />
							Liens de paiement
						</Label>
					</div>
					{showPaymentLinks && (
						<div className="space-y-2 pl-6">
							<div>
								<Label className="text-xs text-slate-500 dark:text-violet-200">Stripe</Label>
								<Input
									placeholder="https://checkout.stripe.com/..."
									{...register("paymentLinks.stripe")}
									className={inputClass}
								/>
							</div>
							<div>
								<Label className="text-xs text-slate-500 dark:text-violet-200">PayPal</Label>
								<Input
									placeholder="https://paypal.me/..."
									{...register("paymentLinks.paypal")}
									className={inputClass}
								/>
							</div>
							<div>
								<Label className="text-xs text-slate-500 dark:text-violet-200">GoCardless</Label>
								<Input
									placeholder="https://pay.gocardless.com/..."
									{...register("paymentLinks.gocardless")}
									className={inputClass}
								/>
							</div>
						</div>
					)}
				</section>

				<Button type="submit" variant="gradient" className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-105">
					Créer la facture
				</Button>
			</form>
		</>
	);
}

export { generateInvoiceNumber, todayISO, dueDateISO };
