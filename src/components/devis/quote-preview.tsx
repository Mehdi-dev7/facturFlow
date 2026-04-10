"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { CheckCircle2, XCircle, Lock } from "lucide-react";
import type { QuoteFormData, CompanyInfo, InvoiceType } from "@/lib/validations/quote";
import { INVOICE_TYPE_LABELS, INVOICE_TYPE_CONFIG } from "@/lib/validations/quote";
import { useClients } from "@/hooks/use-clients";
import { calcInvoiceTotals, formatCurrency } from "@/lib/utils/calculs-facture";
import { useAppearance } from "@/hooks/use-appearance";
import { getFontFamily, getFontWeight, DEFAULT_THEME, DEFAULT_FONT } from "@/components/appearance/theme-config";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface QuotePreviewProps {
	form: UseFormReturn<QuoteFormData>;
	quoteNumber: string;
	companyInfo: CompanyInfo | null;
	acceptUrl?: string;
	refuseUrl?: string;
	compact?: boolean;
	themeColor?: string;
	companyFont?: string;
	companyLogo?: string | null;
	companyName?: string;
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function QuotePreview({
	form,
	quoteNumber,
	companyInfo,
	acceptUrl,
	refuseUrl,
	compact = false,
	themeColor = DEFAULT_THEME.primary,
	companyFont = DEFAULT_FONT.id,
	companyLogo,
	companyName = "",
}: QuotePreviewProps) {
	const clientId      = useWatch({ control: form.control, name: "clientId" });
	const newClient     = useWatch({ control: form.control, name: "newClient" });
	const lines         = useWatch({ control: form.control, name: "lines" });
	const vatRate       = useWatch({ control: form.control, name: "vatRate" });
	const date          = useWatch({ control: form.control, name: "date" });
	const validUntil    = useWatch({ control: form.control, name: "validUntil" });
	const notes         = useWatch({ control: form.control, name: "notes" });
	const quoteType     = (useWatch({ control: form.control, name: "quoteType" }) ?? "basic") as InvoiceType;
	const discountType  = useWatch({ control: form.control, name: "discountType" });
	const discountValue = useWatch({ control: form.control, name: "discountValue" }) ?? 0;
	const depositAmt    = (useWatch({ control: form.control, name: "depositAmount" }) ?? 0) as number;
	const deliveryDate  = useWatch({ control: form.control, name: "deliveryDate" });

	// ── Lookup client existant depuis la DB ────────────────────────────────
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
			address: newClient.address,
			postalCode: null as string | null,
			city: newClient.city,
			siret: newClient.siret,
		};
		if (clientId && clientId !== "__new__") {
			if (selectedClient) return {
				name: selectedClient.name,
				email: selectedClient.email ?? "",
				address: selectedClient.address ?? "",
				postalCode: selectedClient.postalCode ?? null,
				city: selectedClient.city ?? "",
				siret: selectedClient.siret ?? undefined,
			};
			return { name: "Chargement…", email: "", address: "", postalCode: null as string | null, city: "", siret: undefined };
		}
		return null;
	})();

	// ── Apparence ─────────────────────────────────────────────────────────
	const fontFamily = getFontFamily(companyFont);
	const fontWeight = getFontWeight(companyFont);
	const { currency } = useAppearance();

	const safeLines  = lines || [];
	const typeConfig = INVOICE_TYPE_CONFIG[quoteType] ?? INVOICE_TYPE_CONFIG["basic"];
	const isForfait  = typeConfig.quantityLabel === null;
	const isArtisan  = quoteType === "artisan";

	const totals = calcInvoiceTotals({
		lines: safeLines.map((l) => ({
			quantity: isForfait ? 1 : (l.quantity || 0),
			unitPrice: l.unitPrice || 0,
		})),
		vatRate: vatRate ?? 20,
		discountType,
		discountValue,
		// depositAmt non passé : l'acompte est informatif sur un devis
	});

	const fmt = (n: number) =>
		n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const fmtC = (n: number) => formatCurrency(n, currency);

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
	};

	const mainOeuvreLines = isArtisan
		? safeLines.filter((l) => !l.category || l.category === "main_oeuvre")
		: safeLines;
	const materiauLines = isArtisan
		? safeLines.filter((l) => l.category === "materiel")
		: [];

	// ── Mode compact (récapitulatif stepper) ───────────────────────────────
	if (compact) {
		return (
			<div className="space-y-3 text-xs">
				<div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-violet-400/70 border-b border-slate-100 dark:border-violet-500/20 pb-2">
					<span className="font-semibold" style={{ color: themeColor }}>{quoteNumber}</span>
					<span>{formatDate(date)} · val. {formatDate(validUntil)}</span>
				</div>

				<div>
					<p className="text-[10px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: themeColor }}>Émetteur</p>
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
					<p className="text-[10px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: themeColor }}>Destinataire</p>
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
						const qty = isForfait ? 1 : (line.quantity || 0);
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
					<div className="flex justify-between text-slate-500 dark:text-slate-400">
						<span>TVA ({vatRate ?? 0}%)</span>
						<span>{fmtC(totals.taxTotal)}</span>
					</div>
					<div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-violet-500/20">
						<span>Total TTC</span>
						<span className="truncate ml-2" style={{ color: themeColor }}>{fmtC(totals.totalTTC)}</span>
					</div>
					{depositAmt > 0 && (
						<div className="flex justify-between pt-1 border-t border-slate-100 dark:border-violet-500/20">
							<span className="font-medium" style={{ color: themeColor }}>Acompte à verser</span>
							<span className="font-bold" style={{ color: themeColor }}>{fmtC(depositAmt)}</span>
						</div>
					)}
				</div>

				{notes && (
					<p className="text-[10px] text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-violet-500/20 pt-2">{notes}</p>
				)}
			</div>
		);
	}

	// ── Mode normal (desktop preview A4) ──────────────────────────────────
	return (
		<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
			{/* Bandeau "Aperçu temps réel" */}
			<div className="p-3 px-4" style={{ backgroundColor: themeColor }}>
				<p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Aperçu temps réel</p>
			</div>

			{/* Contenu du document */}
			<div className="p-3 md:p-6 overflow-auto max-h-[calc(100vh-200px)]">
			<div className="bg-white rounded-lg border border-slate-200 p-3 md:p-6 space-y-6 shadow-sm">

			{/* Header 3 colonnes : type+N° | logo+nom | dates */}
			<div className="rounded-lg px-6 py-5 text-white" style={{ backgroundColor: themeColor }}>
				<div className="flex items-start gap-4">
					{/* Gauche : DEVIS + N° */}
					<div className="flex-1">
						<h2 className="text-lg font-bold tracking-tight">DEVIS</h2>
						<p className="text-white/90 text-xs mt-0.5">{quoteNumber}</p>
						{quoteType !== "basic" && (
							<span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
								{INVOICE_TYPE_LABELS[quoteType]}
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
							<p className="text-white/90 text-sm font-bold text-center" style={{ fontFamily, fontWeight }}>
								{companyName}
							</p>
						)}
					</div>
					{/* Droite : dates */}
					<div className="flex-1 text-right text-xs">
						<p className="text-white/90">Date : {formatDate(date)}</p>
						<p className="text-white/90">Validité : {formatDate(validUntil)}</p>
						{deliveryDate && <p className="text-white/90">Livraison : {formatDate(deliveryDate)}</p>}
					</div>
				</div>
			</div>

			{/* Émetteur & Destinataire */}
				<div className="grid grid-cols-2 gap-6">
					<div>
						<p className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: themeColor }}>
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
								{companyInfo.phone && <p className="text-slate-500 text-[11px]">{companyInfo.phone}</p>}
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Non renseigné</p>
						)}
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: themeColor }}>
							Destinataire
						</p>
						{client ? (
							<div className="text-xs space-y-0.5">
								<p className="font-semibold text-slate-800">{client.name}</p>
								{client.address && <p className="text-slate-500 text-[11px]">{client.address}</p>}
								{(client.postalCode || client.city) && (
									<p className="text-slate-500 text-[11px]">{[client.postalCode, client.city].filter(Boolean).join(" ")}</p>
								)}
								{client.siret && <p className="text-slate-500 text-[11px]">SIRET : {client.siret}</p>}
								{client.email && <p className="text-slate-500">{client.email}</p>}
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Aucun client sélectionné</p>
						)}
					</div>
				</div>

				<div className="h-px bg-slate-200" />

				{/* Lignes */}
				{isArtisan ? (
					<div className="space-y-4">
						<LinesTable title="Main d'œuvre" lines={mainOeuvreLines} isForfait={false} typeConfig={typeConfig} fmt={fmtC} themeColor={themeColor} />
						{materiauLines.length > 0 && (
							<LinesTable title="Matériaux" lines={materiauLines} isForfait={false} typeConfig={typeConfig} fmt={fmtC} themeColor={themeColor} />
						)}
					</div>
				) : (
					<LinesTable lines={safeLines} isForfait={isForfait} typeConfig={typeConfig} fmt={fmtC} themeColor={themeColor} />
				)}

				{/* Totaux */}
				<div className="flex justify-end">
					<div
						className="w-64 space-y-1.5 rounded-lg p-3 border"
						style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
					>
						<div className="flex justify-between text-sm">
							<span className="shrink-0" style={{ color: themeColor }}>Sous-total HT</span>
							<span className="text-slate-800 font-medium truncate ml-2">{fmtC(totals.subtotal)}</span>
						</div>

						{totals.discountAmount > 0 && (
							<>
								<div className="flex justify-between text-sm">
									<span style={{ color: themeColor }}>
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

						<div className="flex justify-between text-sm">
							<span style={{ color: themeColor }}>TVA ({vatRate ?? 0}%)</span>
							<span className="text-slate-800 font-medium truncate ml-2">{fmtC(totals.taxTotal)}</span>
						</div>

						<div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: `1px solid ${themeColor}33` }}>
							<span className="text-slate-900 shrink-0">Total TTC</span>
							<span className="truncate ml-2" style={{ color: themeColor }}>{fmtC(totals.totalTTC)}</span>
						</div>

						{totals.discountAmount > 0 && (
							<div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: `2px solid ${themeColor}66` }}>
								<span className="text-sm font-extrabold text-slate-900 tracking-tight shrink-0">NET À PAYER</span>
								<span className="text-base font-extrabold truncate ml-2" style={{ color: themeColor }}>
									{fmtC(totals.netAPayer)}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Notes */}
				{notes && (
					<div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
						<p className="font-medium mb-1" style={{ color: themeColor }}>Notes</p>
						<p className="whitespace-pre-line text-slate-700">{notes}</p>
					</div>
				)}

				{/* Acompte à verser — callout informatif */}
				{depositAmt > 0 && (
					<div
						className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
						style={{ backgroundColor: themeColor + "0d", borderColor: themeColor + "33" }}
					>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide" style={{ color: themeColor }}>
								Acompte à verser
							</p>
							<p className="text-[11px] mt-0.5" style={{ color: themeColor + "99" }}>
								À régler avant le démarrage du projet
							</p>
						</div>
						<span className="text-base font-bold shrink-0" style={{ color: themeColor }}>
							{fmtC(depositAmt)}
						</span>
					</div>
				)}

				{/* Actions accepter / refuser */}
				{acceptUrl && refuseUrl ? (
					<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-xs text-slate-500 text-center mb-3 font-medium">
							En tant que client, vous pouvez répondre à ce devis :
						</p>
						<div className="flex gap-3">
							<a
								href={acceptUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors hover:opacity-90"
								style={{ backgroundColor: themeColor }}
							>
								<CheckCircle2 className="size-4" />
								Accepter le devis
							</a>
							<a
								href={refuseUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 text-sm font-semibold transition-colors"
							>
								<XCircle className="size-4" />
								Refuser
							</a>
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
						<div className="flex flex-col items-center gap-2 text-center">
							<div className="flex gap-3 w-full opacity-40 pointer-events-none select-none">
								<div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: themeColor }}>
									<CheckCircle2 className="size-4" />
									Accepter le devis
								</div>
								<div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 text-rose-600 text-sm font-semibold">
									<XCircle className="size-4" />
									Refuser
								</div>
							</div>
							<p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
								<Lock className="size-3" />
								Liens disponibles après sauvegarde du devis
							</p>
						</div>
					</div>
				)}

				{/* Footer */}
				<div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
					<p>Document généré par FacturNow</p>
				</div>
			</div>{/* end inner white card */}
			</div>{/* end scrollable */}
		</div>
	);
}

// ─── Sous-composant tableau de lignes (avec themeColor) ────────────────────────

interface LinesTableProps {
	title?: string;
	lines: { description?: string; quantity?: number; unitPrice?: number }[];
	isForfait: boolean;
	typeConfig: { descriptionLabel: string; quantityLabel: string | null; priceLabel: string };
	fmt: (n: number) => string;
	themeColor: string;
}

function LinesTable({ title, lines, isForfait, typeConfig, fmt, themeColor }: LinesTableProps) {
	return (
		<div>
			{title && (
				<p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: themeColor }}>
					{title}
				</p>
			)}
			<div className="border border-slate-200 rounded-lg overflow-hidden">
				<table className="w-full text-sm table-fixed">
					<colgroup>
						<col />
						{!isForfait && <col style={{ width: "10%" }} />}
						<col style={{ width: "18%" }} />
						{!isForfait && <col style={{ width: "18%" }} />}
					</colgroup>
					<thead style={{ backgroundColor: themeColor + "1a" }}>
						<tr>
							<th className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide" style={{ color: themeColor }}>
								{typeConfig.descriptionLabel}
							</th>
							{!isForfait && (
								<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: themeColor }}>
									{typeConfig.quantityLabel}
								</th>
							)}
							<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: themeColor }}>
								{isForfait ? "Montant" : "Prix unit."}
							</th>
							{!isForfait && (
								<th className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: themeColor }}>
									Total HT
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{lines.map((line, i) => {
							const qty = isForfait ? 1 : (line.quantity || 0);
							const ht = qty * (line.unitPrice || 0);
							return (
								<tr key={i} className="border-t border-slate-100 bg-slate-50/50">
									<td className="p-2 lg:p-3 text-xs lg:text-sm text-slate-700 break-all">
										{line.description || <span className="text-slate-300 italic">Ligne {i + 1}</span>}
									</td>
									{!isForfait && (
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-600 whitespace-nowrap overflow-hidden">{line.quantity || 0}</td>
									)}
									<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-600 whitespace-nowrap overflow-hidden">
										{fmt(line.unitPrice || 0)} €
									</td>
									{!isForfait && (
										<td className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium whitespace-nowrap" style={{ color: themeColor }}>
											{fmt(ht)} €
										</td>
									)}
								</tr>
							);
						})}
						{lines.length === 0 && (
							<tr>
								<td colSpan={isForfait ? 2 : 4} className="py-6 text-center text-sm text-slate-400 italic">
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
