"use client";

import React from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { InvoiceFormData, CompanyInfo } from "@/lib/validations/invoice";
import { mockClients } from "@/lib/mock-data/clients";

interface InvoicePreviewProps {
	form: UseFormReturn<InvoiceFormData>;
	invoiceNumber: string;
	companyInfo: CompanyInfo | null;
}

export function InvoicePreview({ form, invoiceNumber, companyInfo }: InvoicePreviewProps) {
	// useWatch se subscribe proprement au form control pour la réactivité
	const clientId = useWatch({ control: form.control, name: "clientId" });
	const newClient = useWatch({ control: form.control, name: "newClient" });
	const lines = useWatch({ control: form.control, name: "lines" });
	const vatRate = useWatch({ control: form.control, name: "vatRate" });
	const date = useWatch({ control: form.control, name: "date" });
	const dueDate = useWatch({ control: form.control, name: "dueDate" });
	const notes = useWatch({ control: form.control, name: "notes" });
	const paymentLinks = useWatch({ control: form.control, name: "paymentLinks" });

	const client = (() => {
		if (clientId && clientId !== "__new__") {
			const found = mockClients.find((c) => c.id === clientId);
			if (found) return { name: found.name, email: found.email, city: found.city };
		}
		if (newClient) {
			return {
				name: newClient.name,
				email: newClient.email,
				city: newClient.city,
			};
		}
		return null;
	})();

	const safeLines = lines || [];
	const subtotal = safeLines.reduce(
		(s, l) => s + (l.quantity || 0) * (l.unitPrice || 0),
		0,
	);
	const taxTotal = subtotal * ((vatRate || 0) / 100);
	const total = subtotal + taxTotal;

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

	return (
		<div className="bg-white rounded-2xl border border-slate-300/80 shadow-lg shadow-slate-200/50 overflow-hidden">
			{/* Header band */}
			<div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-lg font-bold tracking-tight font-heading">FACTURE</h2>
						<p className="text-violet-200 text-sm mt-0.5">{invoiceNumber}</p>
					</div>
					<div className="text-right text-sm">
						<p>Date : {formatDate(date)}</p>
						<p>Échéance : {formatDate(dueDate)}</p>
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

				{/* Lignes */}
				<div>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b-2 border-slate-200">
								<th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Description
								</th>
								<th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-14">
									Qté
								</th>
								<th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
									Prix unit.
								</th>
								<th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
									Total HT
								</th>
							</tr>
						</thead>
						<tbody>
							{safeLines.map((line, i) => {
								const ht = (line.quantity || 0) * (line.unitPrice || 0);
								return (
									<tr key={i} className="border-b border-slate-100">
										<td className="py-2.5 text-slate-700">
											{line.description || (
												<span className="text-slate-300 italic">
													Ligne {i + 1}
												</span>
											)}
										</td>
										<td className="py-2.5 text-right text-slate-600">
											{line.quantity || 0}
										</td>
										<td className="py-2.5 text-right text-slate-600">
											{fmt(line.unitPrice || 0)} €
										</td>
										<td className="py-2.5 text-right font-medium text-slate-800">
											{fmt(ht)} €
										</td>
									</tr>
								);
							})}
							{safeLines.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="py-8 text-center text-sm text-slate-400 italic"
									>
										Aucune ligne ajoutée
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Totaux */}
				<div className="flex justify-end">
					<div className="w-60 space-y-1.5">
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">Sous-total HT</span>
							<span className="text-slate-800 font-medium">{fmt(subtotal)} €</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">TVA ({vatRate || 0}%)</span>
							<span className="text-slate-800 font-medium">{fmt(taxTotal)} €</span>
						</div>
						<div className="h-px bg-slate-200 my-1" />
						<div className="flex justify-between text-base font-bold">
							<span className="text-slate-900">Total TTC</span>
							<span className="text-violet-600">{fmt(total)} €</span>
						</div>
					</div>
				</div>

				{/* Notes */}
				{notes && (
					<div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
						<p className="font-medium text-slate-700 mb-1">Notes</p>
						<p className="whitespace-pre-line">{notes}</p>
					</div>
				)}

				{/* Payment links */}
				{paymentLinks &&
					(paymentLinks.stripe ||
						paymentLinks.paypal ||
						paymentLinks.gocardless) && (
						<div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
							<p className="text-xs font-medium text-violet-700 mb-2">
								Liens de paiement
							</p>
							<div className="flex flex-wrap gap-2">
								{paymentLinks.stripe && (
									<span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
										Stripe
									</span>
								)}
								{paymentLinks.paypal && (
									<span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
										PayPal
									</span>
								)}
								{paymentLinks.gocardless && (
									<span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">
										GoCardless
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
