"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useClients } from "@/hooks/use-clients";
import type { InvoiceFormData, CompanyInfo, InvoiceType } from "@/lib/validations/invoice";
import { INVOICE_TYPE_LABELS, INVOICE_TYPE_CONFIG } from "@/lib/validations/invoice";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";
import { SiStripe, SiPaypal } from "react-icons/si";

interface InvoicePreviewProps {
	form: UseFormReturn<InvoiceFormData>;
	invoiceNumber: string;
	companyInfo: CompanyInfo | null;
	compact?: boolean;
}

export function InvoicePreview({ form, invoiceNumber, companyInfo, compact = false }: InvoicePreviewProps) {
	const clientId     = useWatch({ control: form.control, name: "clientId" });
	const newClient    = useWatch({ control: form.control, name: "newClient" });
	const lines        = useWatch({ control: form.control, name: "lines" });
	const vatRate      = useWatch({ control: form.control, name: "vatRate" });
	const date         = useWatch({ control: form.control, name: "date" });
	const dueDate      = useWatch({ control: form.control, name: "dueDate" });
	const notes        = useWatch({ control: form.control, name: "notes" });
	const paymentLinks = useWatch({ control: form.control, name: "paymentLinks" });
	const invoiceType  = (useWatch({ control: form.control, name: "invoiceType" }) ?? "basic") as InvoiceType;
	const discountType  = useWatch({ control: form.control, name: "discountType" });
	const discountValue = useWatch({ control: form.control, name: "discountValue" }) ?? 0;
	const depositAmt    = useWatch({ control: form.control, name: "depositAmount" }) ?? 0;

	// ── Lookup client existant ─────────────────────────────────────────────
	const { data: clients = [] } = useClients();
	const selectedClient = useMemo(
		() => clients.find((c) => c.id === clientId),
		[clients, clientId],
	);

	// ── Client ─────────────────────────────────────────────────────────────
	// Pour les clients existants (clientId), les données détaillées ne sont pas
	// disponibles dans le form — on affiche juste un placeholder.
	// Pour les nouveaux clients (__new__), toutes les données sont dans newClient.
	const client = (() => {
		if (newClient) return {
			name: newClient.name,
			email: newClient.email,
			city: newClient.city,
			address: newClient.address,
			siret: newClient.siret,
		};
		if (clientId && clientId !== "__new__") {
			if (selectedClient) {
				return {
					name: selectedClient.name,
					email: selectedClient.email ?? "",
					city: selectedClient.city ?? "",
					address: selectedClient.address ?? "",
					siret: selectedClient.siret ?? undefined,
				};
			}
			return { name: "Chargement…", email: "", city: "", address: "", siret: undefined };
		}
		return null;
	})();

	// ── Calculs ────────────────────────────────────────────────────────────
	const safeLines = lines || [];
	const totals = calcInvoiceTotals({
		lines: safeLines,
		vatRate: vatRate ?? 20,
		discountType,
		discountValue,
		depositAmount: depositAmt,
	});

	const typeConfig = INVOICE_TYPE_CONFIG[invoiceType] ?? INVOICE_TYPE_CONFIG["basic"];

	// ── Helpers ────────────────────────────────────────────────────────────
	const fmt = (n: number) =>
		n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	// ── Groupement artisan ─────────────────────────────────────────────────
	const isArtisan = invoiceType === "artisan";
	const mainOeuvreLines = safeLines.filter((l) => !l.category || l.category === "main_oeuvre");
	const materiauLines   = safeLines.filter((l) => l.category === "materiel");
	const isForfait       = typeConfig.quantityLabel === null;

	// ── Render ─────────────────────────────────────────────────────────────

	// ── Mode compact (recap stepper) ──────────────────────────────────────
	if (compact) {
		return (
			<div className="space-y-3 text-xs">
				{/* Infos facture */}
				<div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-violet-400/70 border-b border-slate-100 dark:border-violet-500/20 pb-2">
					<span className="font-semibold text-violet-600 dark:text-violet-400">{invoiceNumber}</span>
					<span>{formatDate(date)} · éch. {formatDate(dueDate)}</span>
				</div>

				{/* Émetteur */}
				<div>
					<p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-violet-400/60 mb-0.5 font-semibold">Émetteur</p>
					{companyInfo ? (
						<div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
							<p className="font-semibold">{companyInfo.name}</p>
							<p className="text-slate-500 dark:text-slate-400">{companyInfo.address}, {companyInfo.city}</p>
							<p className="text-slate-500 dark:text-slate-400">{companyInfo.email}</p>
						</div>
					) : (
						<p className="text-xs text-slate-400 italic">Non renseigné</p>
					)}
				</div>

				{/* Destinataire */}
				<div>
					<p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-violet-400/60 mb-0.5 font-semibold">Destinataire</p>
					{client ? (
						<div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
							<p className="font-semibold">{client.name}</p>
							{client.email && <p className="text-slate-500 dark:text-slate-400">{client.email}</p>}
							{client.city && <p className="text-slate-500 dark:text-slate-400">{client.city}</p>}
						</div>
					) : (
						<p className="text-xs text-slate-400 italic">Aucun client sélectionné</p>
					)}
				</div>

				<div className="h-px bg-slate-100 dark:bg-violet-500/20" />

				{/* Lignes */}
				<div className="space-y-1">
					{safeLines.length === 0 ? (
						<p className="text-xs text-slate-400 italic">Aucune ligne</p>
					) : safeLines.map((line, i) => {
						const qty = isForfait ? 1 : (line.quantity || 0);
						const ht = qty * (line.unitPrice || 0);
						return (
							<div key={i} className="flex justify-between gap-2">
								<span className="text-slate-700 dark:text-slate-300 truncate flex-1">
									{line.description || <span className="italic text-slate-300">Ligne {i + 1}</span>}
								</span>
								<span className="text-slate-500 dark:text-slate-400 shrink-0">{fmt(ht)} €</span>
							</div>
						);
					})}
				</div>

				<div className="h-px bg-slate-100 dark:bg-violet-500/20" />

				{/* Totaux */}
				<div className="space-y-1">
					<div className="flex justify-between text-slate-500 dark:text-slate-400">
						<span>Sous-total HT</span>
						<span>{fmt(totals.subtotal)} €</span>
					</div>
					{totals.discountAmount > 0 && (
						<div className="flex justify-between text-rose-500">
							<span>Réduction</span>
							<span>−{fmt(totals.discountAmount)} €</span>
						</div>
					)}
					<div className="flex justify-between text-slate-500 dark:text-slate-400">
						<span>TVA ({vatRate ?? 0}%)</span>
						<span>{fmt(totals.taxTotal)} €</span>
					</div>
					<div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-violet-500/20">
						<span>Total TTC</span>
						<span className="text-violet-600 dark:text-violet-400">{fmt(totals.totalTTC)} €</span>
					</div>
					{totals.depositAmount > 0 && (
						<div className="flex justify-between text-rose-500">
							<span>Acompte versé</span>
							<span>−{fmt(totals.depositAmount)} €</span>
						</div>
					)}
					{(totals.depositAmount > 0 || totals.discountAmount > 0) && (
						<div className="flex justify-between font-extrabold text-slate-900 dark:text-slate-50 pt-1 border-t-2 border-violet-300 dark:border-violet-400/40">
							<span>NET À PAYER</span>
							<span className="text-violet-600 dark:text-violet-300">{fmt(totals.netAPayer)} €</span>
						</div>
					)}
				</div>

				{/* Notes */}
				{notes && (
					<p className="text-[10px] text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-violet-500/20 pt-2">{notes}</p>
				)}
			</div>
		);
	}

	// ── Mode normal (desktop preview A4) ──────────────────────────────────
	return (
		<div className="w-full min-h-[800px] bg-white rounded-2xl border border-slate-300/80 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col">
			{/* Header */}
			<div className="bg-linear-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-lg font-bold tracking-tight font-heading">FACTURE</h2>
						<p className="text-violet-200 text-sm mt-0.5">{invoiceNumber}</p>
						{invoiceType !== "basic" && (
							<span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
								{INVOICE_TYPE_LABELS[invoiceType]}
							</span>
						)}
					</div>
					<div className="text-right text-sm">
						<p>Date : {formatDate(date)}</p>
						<p>Échéance : {formatDate(dueDate)}</p>
					</div>
				</div>
			</div>

			<div className="p-6 flex-1 flex flex-col gap-5">
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
								{client.email && <p className="text-slate-500">{client.email}</p>}
								{client.address && <p className="text-slate-500">{client.address}</p>}
								{client.city && <p className="text-slate-500">{client.city}</p>}
								{client.siret && <p className="text-slate-500">SIRET : {client.siret}</p>}
							</div>
						) : (
							<p className="text-xs text-slate-400 italic">Aucun client sélectionné</p>
						)}
					</div>
				</div>

				<div className="h-px bg-slate-200 mt-2 mb-1" />

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

				{/* Spacer : pousse les totaux vers le bas de la page A4 */}
				<div className="flex-1" />

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
							<span className="text-violet-600">{fmt(totals.totalTTC)} €</span>
						</div>

						{/* Acompte */}
						{totals.depositAmount > 0 && (
							<div className="flex justify-between text-sm">
								<span className="text-slate-500">Acompte versé</span>
								<span className="text-rose-600 font-medium">−{fmt(totals.depositAmount)} €</span>
							</div>
						)}

						{/* NET À PAYER */}
						{(totals.depositAmount > 0 || totals.discountAmount > 0) && (
							<div className="flex justify-between items-center pt-2 border-t-2 border-violet-300 mt-1">
								<span className="text-sm font-extrabold text-slate-900 tracking-tight">
									NET À PAYER
								</span>
								<span className="text-base font-extrabold text-violet-700">
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

				{/* Liens de paiement */}
				{paymentLinks &&
					(paymentLinks.stripe || paymentLinks.paypal || paymentLinks.gocardless) && (
						<div className="space-y-1.5">
							<p className="text-[10px] font-medium text-slate-400 dark:text-violet-400 uppercase tracking-wider">Payer par</p>
							<div className="flex flex-wrap gap-2">
								{paymentLinks.stripe && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#635BFF] to-[#7C3AED] px-3 py-1.5 rounded-lg">
										<SiStripe className="size-3.5" />
										Carte bancaire
									</span>
								)}
								{paymentLinks.paypal && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#003087] to-[#009CDE] px-3 py-1.5 rounded-lg">
										<SiPaypal className="size-3.5" />
										PayPal
									</span>
								)}
								{paymentLinks.gocardless && (
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0F766E] to-[#059669] px-3 py-1.5 rounded-lg">
										<span className="flex size-3.5 items-center justify-center rounded bg-white/25 text-[7px] font-bold">GC</span>
										SEPA
									</span>
								)}
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
				<p className="text-[10px] uppercase tracking-wider text-violet-500 font-semibold mb-1.5">
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
