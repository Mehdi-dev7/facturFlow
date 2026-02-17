"use client";

import React from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { CheckCircle2, XCircle, Lock } from "lucide-react";
import type { QuoteFormData, CompanyInfo, InvoiceType } from "@/lib/validations/quote";
import { INVOICE_TYPE_LABELS, INVOICE_TYPE_CONFIG } from "@/lib/validations/quote";
import { mockClients } from "@/lib/mock-data/clients";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";

interface QuotePreviewProps {
	form: UseFormReturn<QuoteFormData>;
	quoteNumber: string;
	companyInfo: CompanyInfo | null;
	/** URL d'acceptation — disponible uniquement après sauvegarde du devis */
	acceptUrl?: string;
	/** URL de refus — disponible uniquement après sauvegarde du devis */
	refuseUrl?: string;
}

export function QuotePreview({ form, quoteNumber, companyInfo, acceptUrl, refuseUrl }: QuotePreviewProps) {
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

	const client = (() => {
		if (clientId && clientId !== "__new__") {
			const found = mockClients.find((c) => c.id === clientId);
			if (found) return { name: found.name, email: found.email, city: found.city };
		}
		if (newClient) {
			return { name: newClient.name, email: newClient.email, city: newClient.city };
		}
		return null;
	})();

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
		// depositAmt n'est pas passé : l'acompte est informatif, ne change pas le total
	});

	const fmt = (n: number) =>
		n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "—";
		const d = new Date(dateStr);
		return d.toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const mainOeuvreLines = isArtisan
		? safeLines.filter((l) => !l.category || l.category === "main_oeuvre")
		: safeLines;
	const materiauLines = isArtisan
		? safeLines.filter((l) => l.category === "materiel")
		: [];

	return (
		<div className="bg-white rounded-2xl border border-slate-300/80 shadow-lg shadow-slate-200/50 overflow-hidden">
			{/* Header band — vert émeraude pour différencier du devis */}
			<div className="bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-lg font-bold tracking-tight font-heading">DEVIS</h2>
						<p className="text-emerald-200 text-sm mt-0.5">{quoteNumber}</p>
						{quoteType !== "basic" && (
							<span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
								{INVOICE_TYPE_LABELS[quoteType]}
							</span>
						)}
					</div>
					<div className="text-right text-sm">
						<p>Date : {formatDate(date)}</p>
						<p>Validité : {formatDate(validUntil)}</p>
					</div>
				</div>
			</div>

			<div className="p-6 space-y-6">
				{/* Émetteur & Destinataire */}
				<div className="grid grid-cols-2 gap-6">
					<div>
						<p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
							Émetteur
						</p>
						{companyInfo ? (
							<div className="text-sm space-y-0.5">
								<p className="font-semibold text-slate-800">{companyInfo.name}</p>
								<p className="text-slate-500">{companyInfo.address}, {companyInfo.city}</p>
								<p className="text-slate-500">SIRET : {companyInfo.siret}</p>
								<p className="text-slate-500">{companyInfo.email}</p>
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Non renseigné</p>
						)}
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
							Destinataire
						</p>
						{client ? (
							<div className="text-sm space-y-0.5">
								<p className="font-semibold text-slate-800">{client.name}</p>
								<p className="text-slate-500">{client.email}</p>
								<p className="text-slate-500">{client.city}</p>
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Aucun client sélectionné</p>
						)}
					</div>
				</div>

				{/* Separator */}
				<div className="h-px bg-slate-200" />

				{/* Lignes — artisan : 2 sections, autres : tableau simple */}
				{isArtisan ? (
					<div className="space-y-4">
						<LinesTable
							title="Main d'œuvre"
							lines={mainOeuvreLines}
							isForfait={false}
							typeConfig={typeConfig}
							fmt={fmt}
						/>
						{materiauLines.length > 0 && (
							<LinesTable
								title="Matériaux"
								lines={materiauLines}
								isForfait={false}
								typeConfig={typeConfig}
								fmt={fmt}
							/>
						)}
					</div>
				) : (
					<LinesTable
						lines={safeLines}
						isForfait={isForfait}
						typeConfig={typeConfig}
						fmt={fmt}
					/>
				)}

				{/* Totaux */}
				<div className="flex justify-end">
					<div className="w-64 space-y-1.5">
						{/* Sous-total HT */}
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">Sous-total HT</span>
							<span className="text-slate-800 font-medium">{fmt(totals.subtotal)} €</span>
						</div>

						{/* Réduction */}
						{totals.discountAmount > 0 && (
							<>
								<div className="flex justify-between text-sm">
									<span className="text-slate-500">
										Réduction
										{discountType === "pourcentage" ? ` (${discountValue}%)` : ""}
									</span>
									<span className="text-rose-600 font-medium">−{fmt(totals.discountAmount)} €</span>
								</div>
								<div className="flex justify-between text-sm border-t border-slate-100 pt-1">
									<span className="text-slate-600 font-medium">Net HT</span>
									<span className="text-slate-800 font-medium">{fmt(totals.netHT)} €</span>
								</div>
							</>
						)}

						{/* TVA */}
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">TVA ({vatRate ?? 0}%)</span>
							<span className="text-slate-800 font-medium">{fmt(totals.taxTotal)} €</span>
						</div>

						<div className="h-px bg-slate-200 my-1" />

						{/* Total TTC */}
						<div className="flex justify-between text-base font-bold">
							<span className="text-slate-900">Total TTC</span>
							<span className="text-emerald-600">{fmt(totals.totalTTC)} €</span>
						</div>

						{/* NET À PAYER si réduction */}
						{totals.discountAmount > 0 && (
							<div className="flex justify-between items-center pt-2 border-t-2 border-emerald-400/50 mt-1">
								<span className="text-sm font-extrabold text-slate-900 tracking-tight">
									NET À PAYER
								</span>
								<span className="text-base font-extrabold text-emerald-700">
									{fmt(totals.netAPayer)} €
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Notes */}
				{notes && (
					<div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
						<p className="font-medium text-slate-700 mb-1">Notes</p>
						<p className="whitespace-pre-line">{notes}</p>
					</div>
				)}

				{/* Acompte à verser — callout informatif */}
			{depositAmt > 0 && (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
					<div>
						<p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
							Acompte à verser
						</p>
						<p className="text-[11px] text-emerald-600 mt-0.5">
							À régler avant le démarrage du projet
						</p>
					</div>
					<span className="text-base font-bold text-emerald-700 shrink-0">
						{fmt(depositAmt)} €
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
								className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
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
								<div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
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
					<p>Document généré par FacturFlow</p>
				</div>
			</div>
		</div>
	);
}

// ─── Sous-composant tableau de lignes ─────────────────────────────────────────

interface LinesTableProps {
	title?: string;
	lines: { description?: string; quantity?: number; unitPrice?: number }[];
	isForfait: boolean;
	typeConfig: { descriptionLabel: string; quantityLabel: string | null; priceLabel: string };
	fmt: (n: number) => string;
}

function LinesTable({ title, lines, isForfait, typeConfig, fmt }: LinesTableProps) {
	return (
		<div>
			{title && (
				<p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-1.5">
					{title}
				</p>
			)}
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b-2 border-slate-200">
						<th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
							{typeConfig.descriptionLabel}
						</th>
						{!isForfait && (
							<th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-14">
								{typeConfig.quantityLabel}
							</th>
						)}
						<th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
							{isForfait ? "Montant" : "Prix unit."}
						</th>
						{!isForfait && (
							<th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
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
							<tr key={i} className="border-b border-slate-100">
								<td className="py-2.5 text-slate-700">
									{line.description || (
										<span className="text-slate-300 italic">Ligne {i + 1}</span>
									)}
								</td>
								{!isForfait && (
									<td className="py-2.5 text-right text-slate-600">
										{line.quantity || 0}
									</td>
								)}
								<td className="py-2.5 text-right text-slate-600">
									{fmt(line.unitPrice || 0)} €
								</td>
								{!isForfait && (
									<td className="py-2.5 text-right font-medium text-slate-800">
										{fmt(ht)} €
									</td>
								)}
							</tr>
						);
					})}
					{lines.length === 0 && (
						<tr>
							<td
								colSpan={isForfait ? 2 : 4}
								className="py-6 text-center text-sm text-slate-400 italic"
							>
								Aucune ligne
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
