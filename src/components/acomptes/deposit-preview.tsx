"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { SiStripe, SiPaypal } from "react-icons/si";
import type { CompanyInfo } from "@/lib/validations/invoice";
import { useClients } from "@/hooks/use-clients";
import { getFontFamily, getFontWeight, DEFAULT_THEME, DEFAULT_FONT, resolveHeaderTextColor, resolveContentColor } from "@/components/appearance/theme-config";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Types locaux ──────────────────────────────────────────────────────────────

interface DepositFormData {
	clientId: string;
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

interface DepositPreviewProps {
	form: UseFormReturn<DepositFormData>;
	depositNumber: string;
	companyInfo: CompanyInfo | null;
	compact?: boolean;
	themeColor?: string;
	companyFont?: string;
	companyLogo?: string | null;
	companyName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string | undefined) {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("fr-FR");
}

function fmtMoney(n: number) {
	return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function DepositPreview({
	form,
	depositNumber,
	companyInfo,
	compact,
	themeColor = DEFAULT_THEME.primary,
	companyFont = DEFAULT_FONT.id,
	companyLogo,
	companyName = "",
}: DepositPreviewProps) {
	const formData = useWatch({ control: form.control });

	const { data: clients = [] } = useClients();
	const selectedClient = useMemo(
		() => clients.find((c) => c.id === formData.clientId),
		[clients, formData.clientId],
	);

	// ── Apparence ─────────────────────────────────────────────────────────
	const fontFamily = getFontFamily(companyFont);
	const fontWeight = getFontWeight(companyFont);
	const { currency, headerTextColor } = useAppearance();
	const resolvedTextColor = resolveHeaderTextColor(themeColor, headerTextColor);
	const contentColor = resolveContentColor(themeColor);
	const fmtC = (n: number) => formatCurrency(n, currency);

	// ── Calculs ────────────────────────────────────────────────────────────
	const calc = useMemo(() => {
		const subtotal = Number(formData.amount) || 0;
		const rate = formData.vatRate ?? 20;
		const taxAmount = (subtotal * Number(rate)) / 100;
		const total = subtotal + taxAmount;
		return {
			subtotal: Number(subtotal.toFixed(2)),
			taxAmount: Number(taxAmount.toFixed(2)),
			total: Number(total.toFixed(2)),
		};
	}, [formData.amount, formData.vatRate]);

	// ── Mode compact (récapitulatif stepper) ───────────────────────────────
	if (compact) {
		const clientName = selectedClient
			? selectedClient.name
			: formData.clientId ? "Chargement..." : "Aucun client sélectionné";

		return (
			<div className="space-y-3 text-sm">
				<div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500 dark:text-violet-400 border-b border-slate-100 dark:border-violet-500/20 pb-2">
					<span className="font-medium text-slate-700 dark:text-slate-300">N° {depositNumber}</span>
					<div className="flex gap-3 flex-wrap">
						<span>Émission : {fmtDate(formData.date)}</span>
						<span>Échéance : {fmtDate(formData.dueDate)}</span>
					</div>
				</div>

				<div>
					<p className="text-[10px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: contentColor }}>Émetteur</p>
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

				<div>
					<p className="text-[10px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: contentColor }}>Destinataire</p>
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
						<p className="text-xs text-slate-400 italic">{clientName}</p>
					)}
				</div>

				<div className="rounded-lg bg-slate-50 dark:bg-[#251e4d]/40 border border-slate-100 dark:border-violet-500/20 p-2.5">
					<p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: contentColor }}>Description</p>
					<p className="text-xs font-medium text-slate-900 dark:text-slate-100">
						{formData.description || "—"}
					</p>
				</div>

				<div
					className="rounded-lg border p-2.5 space-y-1"
					style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
				>
					<div className="flex justify-between text-xs text-slate-600">
						<span>Sous-total HT</span>
						<span>{fmtC(calc.subtotal)}</span>
					</div>
					<div className="flex justify-between text-xs text-slate-600">
						<span>TVA ({formData.vatRate ?? 20}%)</span>
						<span>{fmtC(calc.taxAmount)}</span>
					</div>
					<div className="flex justify-between text-sm font-bold pt-1.5 mt-1" style={{ borderTop: `1px solid ${themeColor}33` }}>
						<span className="text-slate-900">Total TTC</span>
						<span className="truncate ml-2" style={{ color: contentColor }}>{fmtC(calc.total)}</span>
					</div>
				</div>

				{(formData.paymentLinks?.stripe || formData.paymentLinks?.paypal || formData.paymentLinks?.gocardless) && (
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
						{formData.paymentLinks?.gocardless && (
							<span className="inline-flex items-center gap-1.5 text-[10px] xs:text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-2.5 py-1 rounded-lg">
								<span className="font-black text-[9px]">GC</span> SEPA
							</span>
						)}
					</div>
				)}
			</div>
		);
	}

	// ── Mode normal (aperçu A4 complet) ────────────────────────────────────

	const clientName = selectedClient
		? selectedClient.name
		: formData.clientId ? "Chargement..." : null;

	return (
		<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
			{/* Bandeau "Aperçu temps réel" */}
			<div className="p-3 px-4" style={{ backgroundColor: themeColor }}>
				<p className="text-xs font-semibold uppercase tracking-wide" style={{ color: resolvedTextColor, opacity: 0.9 }}>Aperçu temps réel</p>
			</div>

			{/* Contenu du document */}
			<div className="p-3 md:p-6 overflow-auto max-h-[calc(100vh-200px)]">
				<div className="bg-white rounded-lg border border-slate-200 p-3 md:p-6 space-y-6 shadow-sm">

					{/* En-tête 3 colonnes : ACOMPTE+N° | logo+nom | dates */}
					<div className="rounded-lg p-4" style={{ backgroundColor: themeColor }}>
						<div className="flex items-start gap-4">
							{/* Gauche : ACOMPTE + N° */}
							<div className="flex-1">
								<h1 className="text-lg md:text-xl font-bold mb-1" style={{ color: resolvedTextColor }}>ACOMPTE</h1>
								<p className="text-xs md:text-sm" style={{ color: resolvedTextColor, opacity: 0.9 }}>N° {depositNumber}</p>
							</div>
							{/* Centre : logo circulaire + nom entreprise */}
							<div className="flex-1 flex flex-col items-center gap-1.5">
								{companyLogo && (
									<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
										<img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
									</div>
								)}
								{companyName && (
									<p className="text-sm font-bold text-center" style={{ fontFamily, fontWeight, color: resolvedTextColor }}>
										{companyName}
									</p>
								)}
							</div>
							{/* Droite : dates */}
							<div className="flex-1 text-right text-xs md:text-sm">
								<p style={{ color: resolvedTextColor, opacity: 0.9 }}>Date : {fmtDate(formData.date)}</p>
								<p style={{ color: resolvedTextColor, opacity: 0.9 }}>Échéance : {fmtDate(formData.dueDate)}</p>
								{formData.deliveryDate && <p style={{ color: resolvedTextColor, opacity: 0.9 }}>Livraison : {fmtDate(formData.deliveryDate)}</p>}
							</div>
						</div>
					</div>

					{/* Émetteur et destinataire */}
					<div className="grid grid-cols-2 gap-6">
						<div>
							<h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
								Émetteur
							</h3>
							{companyInfo ? (
								<div className="space-y-0.5 text-xs">
									<p className="font-semibold text-slate-900">{companyInfo.name}</p>
									{companyInfo.address && (
										<p className="text-slate-600 text-[11px]">{companyInfo.address}</p>
									)}
									{(companyInfo.zipCode || companyInfo.city) && (
										<p className="text-slate-600 text-[11px]">
											{[companyInfo.zipCode, companyInfo.city].filter(Boolean).join(" ")}
										</p>
									)}
									<p className="text-slate-600 text-[11px]">SIRET : {companyInfo.siret}</p>
									<p className="text-slate-600">{companyInfo.email}</p>
									{companyInfo.phone && (
										<p className="text-slate-600 text-[11px]">{companyInfo.phone}</p>
									)}
								</div>
							) : (
								<p className="text-slate-400 italic text-xs lg:text-sm">Informations manquantes</p>
							)}
						</div>

						<div>
							<h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
								Destinataire
							</h3>
							{clientName ? (
								<div className="space-y-0.5">
									<p className="font-medium text-slate-900 text-xs lg:text-sm">{clientName}</p>
									{selectedClient?.email && (
										<p className="text-slate-600 text-[11px] lg:text-xs">{selectedClient.email}</p>
									)}
									{selectedClient?.address && (
										<p className="text-slate-600 text-[11px] lg:text-xs">{selectedClient.address}</p>
									)}
									{(selectedClient?.postalCode || selectedClient?.city) && (
										<p className="text-slate-600 text-[11px] lg:text-xs">
											{[selectedClient.postalCode, selectedClient.city].filter(Boolean).join(" ")}
										</p>
									)}
								</div>
							) : (
								<p className="text-slate-400 italic text-xs lg:text-sm">Aucun client sélectionné</p>
							)}
						</div>
					</div>

					<div className="h-px bg-slate-200" />

					{/* Tableau de la ligne d'acompte */}
					<div>
						<h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
							Détails
						</h3>
						<div className="border border-slate-200 rounded-lg overflow-hidden">
							<table className="w-full table-fixed">
								<thead style={{ backgroundColor: themeColor + "1a" }}>
									<tr>
										<th className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: contentColor }}>
											Description
										</th>
										<th className="w-24 text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
											Montant HT
										</th>
										<th className="w-16 text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
											TVA
										</th>
										<th className="w-24 text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
											Total TTC
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-t border-slate-200 bg-slate-50/50">
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-slate-900 break-words overflow-hidden">
											{formData.description || "Description de l'acompte"}
										</td>
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 whitespace-nowrap">
											{fmtC(calc.subtotal)}
										</td>
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 whitespace-nowrap">
											{fmtC(calc.taxAmount)}
										</td>
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium whitespace-nowrap" style={{ color: contentColor }}>
											{fmtC(calc.total)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* Récapitulatif */}
					<div className="flex justify-end">
						<div
							className="w-64 space-y-1.5 rounded-lg p-4 border"
							style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
						>
							<div className="flex justify-between text-xs lg:text-sm">
								<span style={{ color: contentColor }}>Sous-total HT :</span>
								<span className="text-slate-900 font-medium truncate ml-2">{fmtC(calc.subtotal)}</span>
							</div>
							<div className="flex justify-between text-xs lg:text-sm">
								<span style={{ color: contentColor }}>TVA ({formData.vatRate ?? 20}%) :</span>
								<span className="text-slate-900 font-medium truncate ml-2">{fmtC(calc.taxAmount)}</span>
							</div>
							<div
								className="flex justify-between text-sm lg:text-base font-bold pt-2"
								style={{ borderTop: `1px solid ${themeColor}33` }}
							>
								<span className="text-slate-900">Total TTC :</span>
								<span className="truncate ml-2" style={{ color: contentColor }}>{fmtC(calc.total)}</span>
							</div>
						</div>
					</div>

					{/* Notes */}
					{formData.notes && formData.notes.trim() && (
						<div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
							<p className="font-medium mb-1 text-xs lg:text-sm" style={{ color: contentColor }}>Notes</p>
							<p className="text-[11px] lg:text-xs text-slate-600 whitespace-pre-line">
								{formData.notes}
							</p>
						</div>
					)}

					{/* Modalités de paiement */}
					<div className="border-t border-slate-200 pt-4">
						<h3 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: contentColor }}>
							Modalités de paiement
						</h3>
						<div className="space-y-1 text-[11px] lg:text-xs text-slate-600">
							<p>• Paiement attendu avant le {fmtDate(formData.dueDate)}</p>
							<p>• Liens de paiement sécurisés inclus dans l&apos;email</p>
						</div>
						{(formData.paymentLinks?.stripe || formData.paymentLinks?.paypal || formData.paymentLinks?.gocardless) && (
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
								{formData.paymentLinks?.gocardless && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-3 py-1.5 rounded-lg">
										<span className="font-black text-[10px]">GC</span> SEPA
									</span>
								)}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="text-center text-[10px] lg:text-xs text-slate-400 pt-4 border-t border-slate-100">
						<p>Document généré par FacturNow</p>
					</div>
				</div>
			</div>
		</div>
	);
}
