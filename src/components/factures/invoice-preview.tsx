"use client";

import { useMemo, Fragment } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useClients } from "@/hooks/use-clients";
import type {
	InvoiceFormData,
	CompanyInfo,
	InvoiceType,
} from "@/lib/validations/invoice";
import {
	INVOICE_TYPE_LABELS,
	INVOICE_TYPE_CONFIG,
} from "@/lib/validations/invoice";
import { calcInvoiceTotals, formatCurrency } from "@/lib/utils/calculs-facture";
import { SiStripe, SiPaypal } from "react-icons/si";
import { getFontFamily, getFontWeight, DEFAULT_THEME, DEFAULT_FONT, resolveHeaderTextColor, resolveContentColor } from "@/components/appearance/theme-config";
import { useAppearance } from "@/hooks/use-appearance";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface InvoicePreviewProps {
	form: UseFormReturn<InvoiceFormData>;
	invoiceNumber: string;
	companyInfo: CompanyInfo | null;
	compact?: boolean;
	themeColor?: string;
	companyFont?: string;
	companyLogo?: string | null;
	companyName?: string;
	invoiceFooter?: string;
	documentLabel?: string;
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function InvoicePreview({
	form,
	invoiceNumber,
	companyInfo,
	compact = false,
	themeColor = DEFAULT_THEME.primary,
	companyFont = DEFAULT_FONT.id,
	companyLogo,
	companyName = "",
	invoiceFooter = "",
	documentLabel = "FACTURE",
}: InvoicePreviewProps) {
	const clientId = useWatch({ control: form.control, name: "clientId" });
	const newClient = useWatch({ control: form.control, name: "newClient" });
	const lines = useWatch({ control: form.control, name: "lines" });
	const vatRate = useWatch({ control: form.control, name: "vatRate" });
	const vatMode = useWatch({ control: form.control, name: "vatMode" }) ?? "global";
	const date = useWatch({ control: form.control, name: "date" });
	const dueDate = useWatch({ control: form.control, name: "dueDate" });
	const notes = useWatch({ control: form.control, name: "notes" });
	const paymentLinks = useWatch({ control: form.control, name: "paymentLinks" });
	const invoiceType = (useWatch({ control: form.control, name: "invoiceType" }) ?? "basic") as InvoiceType;
	const discountType = useWatch({ control: form.control, name: "discountType" });
	const discountValue = useWatch({ control: form.control, name: "discountValue" }) ?? 0;
	const depositAmt = useWatch({ control: form.control, name: "depositAmount" }) ?? 0;
	const deliveryDate = useWatch({ control: form.control, name: "deliveryDate" });
	const isPerLine = vatMode === "per_line";

	// ── Lookup client existant ─────────────────────────────────────────────
	const { data: clients = [] } = useClients();
	const selectedClient = useMemo(
		() => clients.find((c) => c.id === clientId),
		[clients, clientId],
	);

	// ── Résolution du client ───────────────────────────────────────────────
	const client = (() => {
		if (newClient) return {
			name: newClient.name,
			email: newClient.email,
			city: newClient.city,
			address: newClient.address,
			postalCode: null as string | null,
			siret: newClient.siret,
		};
		if (clientId && clientId !== "__new__") {
			if (selectedClient) return {
				name: selectedClient.name,
				email: selectedClient.email ?? "",
				city: selectedClient.city ?? "",
				address: selectedClient.address ?? "",
				postalCode: selectedClient.postalCode ?? null,
				siret: selectedClient.siret ?? undefined,
			};
			return { name: "Chargement…", email: "", city: "", address: "", postalCode: null as string | null, siret: undefined };
		}
		return null;
	})();

	// ── Apparence ─────────────────────────────────────────────────────────
	const fontFamily = getFontFamily(companyFont);
	const fontWeight = getFontWeight(companyFont);
	const { currency, headerTextColor } = useAppearance();
	const resolvedTextColor = resolveHeaderTextColor(themeColor, headerTextColor);
	const contentColor = resolveContentColor(themeColor);

	// ── Calculs ────────────────────────────────────────────────────────────
	const safeLines = lines || [];
	const totals = calcInvoiceTotals({
		lines: safeLines,
		vatRate: vatRate ?? 20,
		vatMode: isPerLine ? "per_line" : "global",
		discountType,
		discountValue,
		depositAmount: depositAmt,
	});

	const typeConfig = INVOICE_TYPE_CONFIG[invoiceType] ?? INVOICE_TYPE_CONFIG["basic"];
	const isArtisan = invoiceType === "artisan";
	const isForfait = typeConfig.quantityLabel === null;

	const mainOeuvreLines = safeLines.filter((l) => !l.category || l.category === "main_oeuvre");
	const materiauLines = safeLines.filter((l) => l.category === "materiel");

	// ── Helpers ────────────────────────────────────────────────────────────
	// fmt : nombre brut sans devise (pour LinesTable qui ajoute la devise séparément)
	const fmt = (n: number) =>
		n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	// fmtC : formatage avec devise (remplace fmt(n) + " €")
	const fmtC = (n: number) => formatCurrency(n, currency);

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
	};

	// ── Mode compact (récapitulatif stepper) ───────────────────────────────
	if (compact) {
		return (
			<div className="space-y-3 text-xs">
				<div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-violet-400/70 border-b border-slate-100 dark:border-violet-500/20 pb-2">
					<span className="font-semibold" style={{ color: contentColor }}>{invoiceNumber}</span>
					<span>{formatDate(date)} · éch. {formatDate(dueDate)}</span>
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
							<p className="text-slate-500 dark:text-slate-400">{companyInfo.email}</p>
						</div>
					) : (
						<p className="text-xs text-slate-400 italic">Non renseigné</p>
					)}
				</div>

				<div>
					<p className="text-[10px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: contentColor }}>Destinataire</p>
					{client ? (
						<div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
							<p className="font-semibold">{client.name}</p>
							{client.address && <p className="text-slate-500 dark:text-slate-400 text-[10px]">{client.address}</p>}
							{(client.postalCode || client.city) && (
								<p className="text-slate-500 dark:text-slate-400 text-[10px]">
									{[client.postalCode, client.city].filter(Boolean).join(" ")}
								</p>
							)}
							{client.email && <p className="text-slate-500 dark:text-slate-400">{client.email}</p>}
						</div>
					) : (
						<p className="text-xs text-slate-400 italic">Aucun client sélectionné</p>
					)}
				</div>

				<div className="h-px bg-slate-100 dark:bg-violet-500/20" />

				<div className="space-y-1">
					{safeLines.length === 0 ? (
						<p className="text-xs text-slate-400 italic">Aucune ligne</p>
					) : safeLines.map((line, i) => {
						const qty = isForfait ? 1 : line.quantity || 0;
						const ht = qty * (line.unitPrice || 0);
						return (
							<div key={i} className="flex justify-between gap-2">
								<span className="text-slate-700 dark:text-slate-300 break-words min-w-0 flex-1">
									{line.description || <span className="italic text-slate-300">Ligne {i + 1}</span>}
								</span>
								<span className="text-slate-500 dark:text-slate-400 shrink-0">{fmtC(ht)}</span>
							</div>
						);
					})}
				</div>

				<div className="h-px bg-slate-100 dark:bg-violet-500/20" />

				<div className="space-y-1">
					<div className="flex justify-between text-slate-500 dark:text-slate-400">
						<span>Sous-total HT</span>
						<span>{fmtC(totals.subtotal)}</span>
					</div>
					{totals.discountAmount > 0 && (
						<div className="flex justify-between text-rose-500">
							<span>Réduction</span>
							<span>−{fmtC(totals.discountAmount)}</span>
						</div>
					)}
					{isPerLine && totals.vatBreakdown ? (
						totals.vatBreakdown.map(({ rate, baseHT, amount }) => (
							<Fragment key={rate}>
								<div className="flex justify-between text-slate-400 dark:text-slate-500">
									<span>Base HT {rate}%</span>
									<span>{fmtC(baseHT)}</span>
								</div>
								<div className="flex justify-between text-slate-500 dark:text-slate-400">
									<span>TVA {rate}%</span>
									<span>{fmtC(amount)}</span>
								</div>
							</Fragment>
						))
					) : (
						<div className="flex justify-between text-slate-500 dark:text-slate-400">
							<span>TVA ({vatRate ?? 0}%)</span>
							<span>{fmtC(totals.taxTotal)}</span>
						</div>
					)}
					<div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-violet-500/20">
						<span>Total TTC</span>
						<span className="truncate ml-2" style={{ color: contentColor }}>{fmtC(totals.totalTTC)}</span>
					</div>
					{totals.depositAmount > 0 && (
						<div className="flex justify-between text-rose-500">
							<span>Acompte versé</span>
							<span>−{fmtC(totals.depositAmount)}</span>
						</div>
					)}
					{(totals.depositAmount > 0 || totals.discountAmount > 0) && (
						<div className="flex justify-between font-extrabold text-slate-900 dark:text-slate-50 pt-1 border-t-2 border-slate-200 dark:border-violet-400/40">
							<span>NET À PAYER</span>
							<span style={{ color: contentColor }}>{fmtC(totals.netAPayer)}</span>
						</div>
					)}
				</div>

				{notes && (
					<p className="text-[10px] text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-violet-500/20 pt-2">
						{notes}
					</p>
				)}
			</div>
		);
	}

	// ── Mode normal (desktop preview A4) ──────────────────────────────────
	return (
		<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
			{/* Bandeau "Aperçu temps réel" */}
			<div className="p-3 px-4" style={{ backgroundColor: themeColor }}>
				<p className="text-xs font-semibold uppercase tracking-wide" style={{ color: resolvedTextColor, opacity: 0.9 }}>Aperçu temps réel</p>
			</div>

			{/* Contenu du document */}
			<div className="p-3 md:p-6 overflow-auto max-h-[calc(100vh-200px)]">
			<div className="bg-white rounded-lg border border-slate-200 p-3 md:p-6 space-y-6 shadow-sm">

			{/* Header 3 colonnes : type+N° | logo+nom | dates */}
			<div className="rounded-lg px-6 py-5" style={{ backgroundColor: themeColor }}>
				<div className="flex items-start gap-4">
					{/* Gauche : FACTURE + N° */}
					<div className="flex-1">
						<h2 className="text-lg font-bold tracking-tight" style={{ color: resolvedTextColor }}>{documentLabel}</h2>
						<p className="text-xs mt-0.5" style={{ color: resolvedTextColor, opacity: 0.9 }}>{invoiceNumber}</p>
						{invoiceType !== "basic" && (
							<span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
								{INVOICE_TYPE_LABELS[invoiceType]}
							</span>
						)}
					</div>
					{/* Centre : logo circulaire + nom entreprise */}
					<div className="flex-1 flex flex-col items-center gap-1.5">
						{companyLogo && (
							<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
								<img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
							</div>
						)}
						{companyName && (
							<p className="text-base font-bold text-center" style={{ fontFamily, fontWeight, color: resolvedTextColor }}>
								{companyName}
							</p>
						)}
					</div>
					{/* Droite : dates */}
					<div className="flex-1 text-right text-xs">
						<p style={{ color: resolvedTextColor, opacity: 0.9 }}>Date : {formatDate(date)}</p>
						<p style={{ color: resolvedTextColor, opacity: 0.9 }}>Échéance : {formatDate(dueDate)}</p>
						{deliveryDate && <p style={{ color: resolvedTextColor, opacity: 0.9 }}>Livraison : {formatDate(deliveryDate)}</p>}
					</div>
				</div>
			</div>

			{/* Émetteur & Destinataire */}
				<div className="grid grid-cols-2 gap-6">
					<div>
						<p className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: contentColor }}>
							Émetteur
						</p>
						{companyInfo ? (
							<div className="text-xs space-y-0.5">
								<p className="font-semibold text-slate-800">{companyInfo.name}</p>
								{companyInfo.address && <p className="text-slate-500 text-[11px]">{companyInfo.address}</p>}
								{(companyInfo.zipCode || companyInfo.city) && (
									<p className="text-slate-500 text-[11px]">
										{[companyInfo.zipCode, companyInfo.city].filter(Boolean).join(" ")}
									</p>
								)}
								<p className="text-slate-500 text-[11px]">SIRET : {companyInfo.siret}</p>
								<p className="text-slate-500">{companyInfo.email}</p>
								{companyInfo.phone && <p className="text-slate-500">{companyInfo.phone}</p>}
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Non renseigné</p>
						)}
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: contentColor }}>
							Destinataire
						</p>
						{client ? (
							<div className="text-xs space-y-0.5">
								<p className="font-semibold text-slate-800">{client.name}</p>
								{client.address && <p className="text-slate-500 text-[11px]">{client.address}</p>}
								{(client.postalCode || client.city) && (
									<p className="text-slate-500 text-[11px]">
										{[client.postalCode, client.city].filter(Boolean).join(" ")}
									</p>
								)}
								{client.siret && <p className="text-slate-500 text-[11px]">SIRET : {client.siret}</p>}
								{client.email && <p className="text-slate-500">{client.email}</p>}
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Aucun client sélectionné</p>
						)}
					</div>
				</div>

				<div className="h-px bg-slate-200 mt-2 mb-1" />

				{/* Lignes */}
				{isArtisan ? (
					<div className="space-y-4">
						<LinesTable title="Main d'œuvre" lines={mainOeuvreLines} isForfait={false} showVatColumn={isPerLine} globalVatRate={vatRate ?? 20} typeConfig={typeConfig} fmt={fmtC} themeColor={themeColor} contentColor={contentColor} />
						{materiauLines.length > 0 && (
							<LinesTable title="Matériaux" lines={materiauLines} isForfait={false} showVatColumn={isPerLine} globalVatRate={vatRate ?? 20} typeConfig={typeConfig} fmt={fmtC} themeColor={themeColor} contentColor={contentColor} />
						)}
					</div>
				) : (
					<LinesTable lines={safeLines} isForfait={isForfait} showVatColumn={isPerLine} globalVatRate={vatRate ?? 20} typeConfig={typeConfig} fmt={fmtC} themeColor={themeColor} contentColor={contentColor} />
				)}

				<div className="flex-1" />

				{/* Totaux */}
				<div className="flex justify-end">
					<div
						className="w-64 space-y-1.5 rounded-lg p-3 border"
						style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
					>
						<div className="flex justify-between text-sm">
							<span className="shrink-0" style={{ color: contentColor }}>Sous-total HT</span>
							<span className="text-slate-800 font-medium truncate ml-2">{fmtC(totals.subtotal)}</span>
						</div>

						{totals.discountAmount > 0 && (
							<>
								<div className="flex justify-between text-sm">
									<span style={{ color: contentColor }}>
										Réduction{discountType === "pourcentage" ? ` (${discountValue}%)` : ""}
									</span>
									<span className="text-rose-600 font-medium truncate ml-2">−{fmtC(totals.discountAmount)}</span>
								</div>
								<div className="flex justify-between text-sm" style={{ borderTop: `1px solid ${themeColor}33`, paddingTop: "4px" }}>
									<span className="text-slate-600 font-medium shrink-0">Net HT</span>
									<span className="text-slate-800 font-medium truncate ml-2">{fmtC(totals.netHT)}</span>
								</div>
							</>
						)}

						{/* TVA : globale ou ventilée par taux avec base HT */}
						{isPerLine && totals.vatBreakdown ? (
							totals.vatBreakdown.map(({ rate, baseHT, amount }) => (
								<Fragment key={rate}>
									<div className="flex justify-between text-sm">
										<span className="text-slate-500">Base HT {rate}%</span>
										<span className="text-slate-700 font-medium truncate ml-2">{fmtC(baseHT)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span style={{ color: contentColor }}>TVA {rate}%</span>
										<span className="text-slate-800 font-medium truncate ml-2">{fmtC(amount)}</span>
									</div>
								</Fragment>
							))
						) : (
							<div className="flex justify-between text-sm">
								<span style={{ color: contentColor }}>TVA ({vatRate ?? 0}%)</span>
								<span className="text-slate-800 font-medium truncate ml-2">{fmtC(totals.taxTotal)}</span>
							</div>
						)}

						<div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: `1px solid ${themeColor}33` }}>
							<span className="text-slate-900 shrink-0">Total TTC</span>
							<span className="truncate ml-2" style={{ color: contentColor }}>{fmtC(totals.totalTTC)}</span>
						</div>

						{totals.depositAmount > 0 && (
							<div className="flex justify-between text-sm" style={{ borderTop: `1px solid ${themeColor}33`, paddingTop: "4px" }}>
								<span style={{ color: contentColor }}>Acompte versé</span>
								<span className="text-rose-600 font-medium truncate ml-2">−{fmtC(totals.depositAmount)}</span>
							</div>
						)}

						{(totals.depositAmount > 0 || totals.discountAmount > 0) && (
							<div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: `2px solid ${themeColor}66` }}>
								<span className="text-sm font-extrabold text-slate-900 tracking-tight shrink-0">NET À PAYER</span>
								<span className="text-base font-extrabold truncate ml-2" style={{ color: contentColor }}>
									{fmtC(totals.netAPayer)}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Notes */}
				{notes && (
					<div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
						<p className="font-medium mb-1" style={{ color: contentColor }}>Notes</p>
						<p className="whitespace-pre-line text-slate-700">{notes}</p>
					</div>
				)}

				{/* Liens de paiement */}
				{paymentLinks && (paymentLinks.stripe || paymentLinks.paypal || paymentLinks.gocardless) && (
					<div className="space-y-1.5">
						<p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: contentColor }}>
							Payer par
						</p>
						<div className="flex flex-wrap gap-2">
							{paymentLinks.stripe && (
								<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#635BFF] to-[#7C3AED] px-3 py-1.5 rounded-lg">
									<SiStripe className="size-3.5" /> Carte bancaire
								</span>
							)}
							{paymentLinks.paypal && (
								<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#003087] to-[#009CDE] px-3 py-1.5 rounded-lg">
									<SiPaypal className="size-3.5" /> PayPal
								</span>
							)}
							{paymentLinks.gocardless && (
								<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#0F766E] to-[#059669] px-3 py-1.5 rounded-lg">
									<span className="flex size-3.5 items-center justify-center rounded bg-white/25 text-[7px] font-bold">GC</span>
									SEPA
								</span>
							)}
						</div>
					</div>
				)}

				{/* Footer */}
				<div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
					<p className="whitespace-pre-line">{invoiceFooter || "Document généré par FacturNow"}</p>
				</div>
			</div>{/* end inner white card */}
			</div>{/* end scrollable */}
		</div>
	);
}

// ─── Sous-composant tableau de lignes (avec themeColor) ────────────────────────

interface LinesTableProps {
	title?: string;
	lines: { description?: string; quantity?: number; unitPrice?: number; vatRate?: number }[];
	isForfait: boolean;
	showVatColumn?: boolean;
	globalVatRate?: number;
	typeConfig: { descriptionLabel: string; quantityLabel: string | null; priceLabel: string };
	fmt: (n: number) => string;
	themeColor: string;
	contentColor: string;
}

function LinesTable({ title, lines, isForfait, showVatColumn = false, globalVatRate = 20, typeConfig, fmt, themeColor, contentColor }: LinesTableProps) {
	return (
		<div>
			{title && (
				<p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: contentColor }}>
					{title}
				</p>
			)}
			<div className="border border-slate-200 rounded-lg overflow-hidden">
				<table className="w-full text-sm table-fixed">
					<colgroup>
						{/* Description prend tout l'espace restant */}
						<col />
						{!isForfait && <col style={{ width: "10%" }} />}
						<col style={{ width: "18%" }} />
						{showVatColumn && <col style={{ width: "8%" }} />}
						{!isForfait && <col style={{ width: "18%" }} />}
					</colgroup>
					<thead style={{ backgroundColor: themeColor + "1a" }}>
						<tr>
							<th className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: contentColor }}>
								{typeConfig.descriptionLabel}
							</th>
							{!isForfait && (
								<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
									{typeConfig.quantityLabel}
								</th>
							)}
							<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
								{isForfait ? "Montant" : "Prix unit."}
							</th>
							{showVatColumn && (
								<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
									TVA
								</th>
							)}
							{!isForfait && (
								<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: contentColor }}>
									Total HT
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{lines.map((line, i) => {
							const qty = isForfait ? 1 : line.quantity || 0;
							const ht = qty * (line.unitPrice || 0);
							return (
								<tr key={i} className="border-t border-slate-100 bg-slate-50/50">
									<td className="p-2 lg:p-3 text-xs lg:text-sm text-slate-700 break-all">
										{line.description || <span className="text-slate-300 italic">Ligne {i + 1}</span>}
									</td>
									{!isForfait && (
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-600 whitespace-nowrap">
											{line.quantity || 0}
										</td>
									)}
									<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-600 whitespace-nowrap overflow-hidden">
										{fmt(line.unitPrice || 0)}
									</td>
									{showVatColumn && (
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-500 whitespace-nowrap">
											{line.vatRate ?? globalVatRate}%
										</td>
									)}
									{!isForfait && (
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium whitespace-nowrap" style={{ color: contentColor }}>
											{fmt(ht)}
										</td>
									)}
								</tr>
							);
						})}
						{lines.length === 0 && (
							<tr>
								<td colSpan={isForfait ? 2 : (showVatColumn ? 5 : 4)} className="py-6 text-center text-sm text-slate-400 italic">
									Aucune ligne
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
