"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { SiStripe, SiPaypal } from "react-icons/si";
import type { CompanyInfo } from "@/lib/validations/invoice";
import { useClients } from "@/hooks/use-clients";

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

interface DepositPreviewProps {
	form: UseFormReturn<DepositFormData>;
	depositNumber: string;
	companyInfo: CompanyInfo | null;
	// Mode compact : récapitulatif texte pour le stepper (étape 4 + aperçu sheet)
	compact?: boolean;
}

// ─── Helper de formatage ──────────────────────────────────────────────────────

function fmtDate(dateStr: string | undefined) {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("fr-FR");
}

function fmtMoney(n: number) {
	return n.toLocaleString("fr-FR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function DepositPreview({
	form,
	depositNumber,
	companyInfo,
	compact,
}: DepositPreviewProps) {
	// Watch tous les champs pour la réactivité temps réel
	const formData = useWatch({ control: form.control });

	// Lookup client réel depuis la DB
	const { data: clients = [] } = useClients();
	const selectedClient = useMemo(
		() => clients.find((c) => c.id === formData.clientId),
		[clients, formData.clientId],
	);

	// Calculs automatiques
	const calc = useMemo(() => {
		const subtotal = Number(formData.amount) || 0;
		// ?? 20 : gère le cas 0% (exonéré) qui serait falsy avec ||
		const rate = formData.vatRate ?? 20;
		const taxAmount = (subtotal * Number(rate)) / 100;
		const total = subtotal + taxAmount;
		return {
			subtotal: Number(subtotal.toFixed(2)),
			taxAmount: Number(taxAmount.toFixed(2)),
			total: Number(total.toFixed(2)),
		};
	}, [formData.amount, formData.vatRate]);

	// ── Mode compact : récapitulatif léger pour le stepper ─────────────────────

	if (compact) {
		const clientName = selectedClient
			? selectedClient.name
			: formData.clientId
				? "Chargement..."
				: "Aucun client sélectionné";

		return (
			<div className="space-y-3 text-sm">
				{/* Header : N° + dates */}
				<div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500 dark:text-violet-400 border-b border-slate-100 dark:border-violet-500/20 pb-2">
					<span className="font-medium text-slate-700 dark:text-slate-300">
						N° {depositNumber}
					</span>
					<div className="flex gap-3 flex-wrap">
						<span>Émission : {fmtDate(formData.date)}</span>
						<span>Échéance : {fmtDate(formData.dueDate)}</span>
					</div>
				</div>

				{/* Émetteur */}
				<div>
					<p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-violet-400/60 mb-0.5 font-semibold">Émetteur</p>
					{companyInfo ? (
						<div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
							<p className="font-semibold">{companyInfo.name}</p>
							{companyInfo.address && <p className="text-slate-500 dark:text-slate-400 text-[10px]">{companyInfo.address}</p>}
							{(companyInfo.zipCode || companyInfo.city) && (
								<p className="text-slate-500 dark:text-slate-400 text-[10px]">
									{[companyInfo.zipCode, companyInfo.city].filter(Boolean).join(" ")}
								</p>
							)}
							{companyInfo.email && <p className="text-slate-500 dark:text-slate-400">{companyInfo.email}</p>}
						</div>
					) : (
						<p className="text-xs text-slate-400 italic">Non renseigné</p>
					)}
				</div>

				{/* Destinataire */}
				<div>
					<p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-violet-400/60 mb-0.5 font-semibold">Destinataire</p>
					{selectedClient ? (
						<div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
							<p className="font-semibold">{selectedClient.name}</p>
							{selectedClient.address && <p className="text-slate-500 dark:text-slate-400 text-[10px]">{selectedClient.address}</p>}
							{(selectedClient.postalCode || selectedClient.city) && (
								<p className="text-slate-500 dark:text-slate-400 text-[10px]">
									{[selectedClient.postalCode, selectedClient.city].filter(Boolean).join(" ")}
								</p>
							)}
							{selectedClient.email && <p className="text-slate-500 dark:text-slate-400">{selectedClient.email}</p>}
						</div>
					) : (
						<p className="text-xs text-slate-400 italic">
							{formData.clientId ? "Chargement..." : "Aucun client sélectionné"}
						</p>
					)}
				</div>

				{/* Description */}
				<div className="rounded-lg bg-slate-50 dark:bg-[#251e4d]/40 border border-slate-100 dark:border-violet-500/20 p-2.5">
					<p className="text-[10px] text-slate-500 dark:text-violet-400 uppercase tracking-wide mb-1">
						Description
					</p>
					<p className="text-xs font-medium text-slate-900 dark:text-slate-100">
						{formData.description || "—"}
					</p>
				</div>

				{/* Totaux */}
				<div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-500/20 p-2.5 space-y-1">
					<div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
						<span>Sous-total HT</span>
						<span>{fmtMoney(calc.subtotal)} €</span>
					</div>
					<div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
						<span>TVA ({formData.vatRate ?? 20}%)</span>
						<span>{fmtMoney(calc.taxAmount)} €</span>
					</div>
					<div className="flex justify-between text-sm font-bold border-t border-violet-200 dark:border-violet-500/30 pt-1.5 mt-1">
						<span className="text-slate-900 dark:text-slate-50">Total TTC</span>
						<span className="text-violet-600 dark:text-violet-400">
							{fmtMoney(calc.total)} €
						</span>
					</div>
				</div>

				{/* Modes de paiement activés */}
				{(formData.paymentLinks?.stripe ||
					formData.paymentLinks?.paypal ||
					formData.paymentLinks?.sepa) && (
					<div className="flex flex-wrap gap-2">
						{formData.paymentLinks?.stripe && (
							<span className="inline-flex items-center gap-1.5 text-[10px] xs:text-xs font-semibold text-white bg-linear-to-r from-[#635BFF] to-[#7C3AED] px-2.5 py-1 rounded-lg">
								<SiStripe className="size-3" /> Stripe
							</span>
						)}
						{formData.paymentLinks?.paypal && (
							<span className="inline-flex items-center gap-1.5 text-[10px] xs:text-xs font-semibold text-white bg-linear-to-r from-[#003087] to-[#009CDE] px-2.5 py-1 rounded-lg">
								<SiPaypal className="size-3" /> PayPal
							</span>
						)}
						{formData.paymentLinks?.sepa && (
							<span className="inline-flex items-center gap-1.5 text-[10px] xs:text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-2.5 py-1 rounded-lg">
								<span className="font-black text-[9px]">GC</span> SEPA
							</span>
						)}
					</div>
				)}
			</div>
		);
	}

	// ── Mode normal : aperçu A4 complet ────────────────────────────────────────

	const clientName = selectedClient
		? selectedClient.name
		: formData.clientId
			? "Chargement..."
			: null;

	return (
		<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
			{/* Bandeau "Aperçu temps réel" */}
			<div className="bg-linear-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 p-3 px-4">
				<p className="text-xs font-semibold text-white/90 uppercase tracking-wide">
					Aperçu temps réel
				</p>
			</div>

			{/* Contenu du document */}
			<div className="p-3 md:p-6 overflow-auto max-h-[calc(100vh-200px)]">
				<div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-sm">

					{/* En-tête du document avec bandeau coloré */}
					<div className="bg-linear-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 rounded-lg p-4 text-white">
						<div className="flex justify-between items-start">
							<div>
								<h1 className="text-lg md:text-xl font-bold mb-1">DEMANDE D&apos;ACOMPTE</h1>
								<p className="text-white/90 text-xs 2xl:text-sm">N° {depositNumber}</p>
							</div>
							<div className="text-right text-xs 2xl:text-sm">
								<p className="text-white/90">Date : {fmtDate(formData.date)}</p>
								<p className="text-white/90">Échéance : {fmtDate(formData.dueDate)}</p>
							</div>
						</div>
					</div>

					{/* Émetteur et destinataire */}
					<div className="grid grid-cols-2 gap-6">
						{/* Émetteur */}
						<div>
							<h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
								Émetteur
							</h3>
							{companyInfo ? (
								<div className="space-y-0.5 text-xs">
									<p className="font-semibold text-slate-900 dark:text-slate-50">
										{companyInfo.name}
									</p>
									<p className="text-slate-600 dark:text-violet-300/80 text-[11px]">
										{companyInfo.address}
									</p>
									<p className="text-slate-600 dark:text-violet-300/80 text-[11px]">
										{companyInfo.zipCode} {companyInfo.city}
									</p>
									<p className="text-slate-600 dark:text-violet-300/80 text-[11px]">
										SIRET : {companyInfo.siret}
									</p>
									<p className="text-slate-600 dark:text-violet-300/80">
										{companyInfo.email}
									</p>
									{companyInfo.phone && (
										<p className="text-slate-600 dark:text-violet-300/80 text-[11px]">
											{companyInfo.phone}
										</p>
									)}
								</div>
							) : (
								<p className="text-violet-300/80 italic text-xs lg:text-sm">
									Informations manquantes
								</p>
							)}
						</div>

						{/* Destinataire */}
						<div>
							<h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
								Destinataire
							</h3>
							{clientName ? (
								<div className="space-y-0.5">
									<p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
										{clientName}
									</p>
									{selectedClient?.email && (
										<p className="text-slate-600 dark:text-violet-300/80 text-[11px] lg:text-xs">
											{selectedClient.email}
										</p>
									)}
									{selectedClient?.address && (
										<p className="text-slate-600 dark:text-violet-300/80 text-[11px] lg:text-xs">
											{selectedClient.address}
										</p>
									)}
									{(selectedClient?.postalCode || selectedClient?.city) && (
										<p className="text-slate-600 dark:text-violet-300/80 text-[11px] lg:text-xs">
											{[selectedClient.postalCode, selectedClient.city]
												.filter(Boolean)
												.join(" ")}
										</p>
									)}
								</div>
							) : (
								<p className="text-violet-300/80 italic text-xs lg:text-sm">
									Aucun client sélectionné
								</p>
							)}
						</div>
					</div>

					{/* Ligne de séparation */}
					<div className="h-px bg-slate-200 dark:bg-slate-700" />

					{/* Tableau de la ligne d'acompte */}
					<div>
						<h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
							Détails
						</h3>
						<div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
							<table className="w-full">
								<thead className="bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
									<tr>
										<th className="text-left p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
											Description
										</th>
										<th className="text-right p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
											Montant HT
										</th>
										<th className="text-right p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
											TVA
										</th>
										<th className="text-right p-2 lg:p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
											Total TTC
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-slate-900 dark:text-slate-50">
											{formData.description || "Description de l'acompte"}
										</td>
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 dark:text-slate-50">
											{fmtMoney(calc.subtotal)} €
										</td>
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 dark:text-slate-50">
											{fmtMoney(calc.taxAmount)} €
										</td>
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium text-violet-600 dark:text-violet-400">
											{fmtMoney(calc.total)} €
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* Récapitulatif */}
					<div className="flex justify-end">
						<div className="w-64 space-y-1.5 bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-500/20">
							<div className="flex justify-between text-xs lg:text-sm">
								<span className="text-violet-700 dark:text-violet-300">Sous-total HT :</span>
								<span className="text-slate-900 dark:text-slate-50 font-medium">
									{fmtMoney(calc.subtotal)} €
								</span>
							</div>
							<div className="flex justify-between text-xs lg:text-sm">
								<span className="text-violet-700 dark:text-violet-300">TVA ({formData.vatRate ?? 20}%) :</span>
								<span className="text-slate-900 dark:text-slate-50 font-medium">
									{fmtMoney(calc.taxAmount)} €
								</span>
							</div>
							<div className="flex justify-between text-sm lg:text-base font-bold border-t border-violet-200 dark:border-violet-500/30 pt-2">
								<span className="text-slate-900 dark:text-slate-50">Total TTC :</span>
								<span className="text-violet-600 dark:text-violet-400">
									{fmtMoney(calc.total)} €
								</span>
							</div>
						</div>
					</div>

					{/* Notes */}
					{formData.notes && formData.notes.trim() && (
						<div className="rounded-lg bg-slate-50 dark:bg-[#1f4a3c]/60 border border-slate-100 dark:border-violet-500/20 p-3">
							<p className="font-medium text-slate-700 dark:text-slate-200 mb-1 text-xs lg:text-sm">Notes</p>
							<p className="text-[11px] lg:text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
								{formData.notes}
							</p>
						</div>
					)}

					{/* Modalités de paiement */}
					<div className="border-t border-slate-200 dark:border-slate-700 pt-4">
						<h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
							Modalités de paiement
						</h3>
						<div className="space-y-1 text-[11px] lg:text-xs text-slate-600 dark:text-slate-400">
							<p>• Paiement attendu avant le {fmtDate(formData.dueDate)}</p>
							<p>• Liens de paiement sécurisés inclus dans l&apos;email</p>
						</div>
						{(formData.paymentLinks?.stripe ||
							formData.paymentLinks?.paypal ||
							formData.paymentLinks?.sepa) && (
							<div className="mt-3 flex flex-wrap gap-2">
								{formData.paymentLinks?.stripe && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#635BFF] to-[#7C3AED] px-3 py-1.5 rounded-lg">
										<SiStripe className="size-3.5" /> Carte bancaire
									</span>
								)}
								{formData.paymentLinks?.paypal && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#003087] to-[#009CDE] px-3 py-1.5 rounded-lg">
										<SiPaypal className="size-3.5" /> PayPal
									</span>
								)}
								{formData.paymentLinks?.sepa && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-3 py-1.5 rounded-lg">
										<span className="font-black text-[10px]">GC</span> SEPA
									</span>
								)}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="text-center text-[10px] lg:text-xs text-slate-400 dark:text-violet-300/80 pt-4 border-t border-slate-100 dark:border-slate-700">
						<p>Document généré par FacturFlow</p>
					</div>
				</div>
			</div>
		</div>
	);
}
