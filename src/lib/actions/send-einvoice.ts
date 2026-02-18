"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
	convertInvoiceToXml,
	sendInvoiceXml,
	type EN16931Invoice,
} from "@/lib/superpdp";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// ─── Types internes ───────────────────────────────────────────────────────────

/** Données complètes de facture avec toutes les infos nécessaires pour l'EN16931 */
type InvoiceWithFullData = {
	id: string;
	number: string;
	date: Date;
	dueDate: Date | null;
	notes: string | null;
	subtotal: { toNumber: () => number };
	taxTotal: { toNumber: () => number };
	total: { toNumber: () => number };
	depositAmount: { toNumber: () => number } | null;
	businessMetadata: unknown;
	lineItems: {
		description: string;
		quantity: { toNumber: () => number };
		unitPrice: { toNumber: () => number };
		vatRate: { toNumber: () => number };
		subtotal: { toNumber: () => number };
	}[];
	client: {
		companyName: string | null;
		firstName: string | null;
		lastName: string | null;
		companySiren: string | null;
		companySiret: string | null;
		companyVatNumber: string | null;
		email: string;
		address: string | null;
		postalCode: string | null;
		city: string | null;
		country: string | null;
		phone: string | null;
	};
	user: {
		companyName: string | null;
		companySiren: string | null;
		companySiret: string | null;
		companyVatNumber: string | null;
		companyAddress: string | null;
		companyPostalCode: string | null;
		companyCity: string | null;
		companyEmail: string | null;
		companyPhone: string | null;
		iban: string | null;
		bic: string | null;
	};
};

// ─── Builder EN16931 ──────────────────────────────────────────────────────────

/**
 * Convertit nos données de facture en format EN16931 (norme européenne).
 *
 * Le format EN16931 est le modèle sémantique commun à tous les pays européens.
 * SuperPDP prend ce JSON et génère le XML CII conforme DGFiP + Peppol.
 */
// Helper pour supprimer les propriétés undefined/null/empty de manière plus agressive
function removeEmptyProperties(obj: any): any {
	if (obj === null || obj === undefined || obj === '') return undefined;
	
	if (Array.isArray(obj)) {
		const filtered = obj.map(removeEmptyProperties).filter(item => item !== undefined);
		return filtered.length > 0 ? filtered : undefined;
	}
	
	if (typeof obj === 'object') {
		const cleaned: any = {};
		for (const [key, value] of Object.entries(obj)) {
			const cleanedValue = removeEmptyProperties(value);
			if (cleanedValue !== undefined) {
				cleaned[key] = cleanedValue;
			}
		}
		return Object.keys(cleaned).length > 0 ? cleaned : undefined;
	}
	
	return obj;
}

function buildEN16931(invoice: InvoiceWithFullData): EN16931Invoice {
	const subtotal = invoice.subtotal.toNumber();
	const taxTotal = invoice.taxTotal.toNumber();
	const total = invoice.total.toNumber();
	const depositAmount = invoice.depositAmount?.toNumber() ?? 0;
	const netAPayer = total - depositAmount;

	// TVA : on prend le taux de la 1ère ligne (toutes les lignes ont le même taux pour l'instant)
	const vatRate = invoice.lineItems[0]?.vatRate.toNumber() ?? 20;
	const vatCategoryCode = vatRate === 0 ? "Z" : "S";

	const { client, user } = invoice;

	// Nom affiché du client
	const fullName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();
	const buyerName = client.companyName ?? (fullName || client.email);

	return {
		// ─ En-tête ─
		type_code: 380, // 380 = Facture commerciale (norme UNTDID 1001)
		number: invoice.number,
		issue_date: invoice.date.toISOString().substring(0, 10),
		...(invoice.dueDate && {
			payment_due_date: invoice.dueDate.toISOString().substring(0, 10),
		}),
		currency_code: "EUR",

		// ─ Notes légales obligatoires (France) ─
		notes: [
			{
				subject_code: "PMT",
				note: "L'indemnité forfaitaire légale pour frais de recouvrement est de 40 €.",
			},
			{
				subject_code: "PMD",
				note: "À défaut de règlement à la date d'échéance, une pénalité de 10 % du net à payer sera applicable immédiatement.",
			},
			{
				subject_code: "AAB",
				note: "Aucun escompte pour paiement anticipé.",
			},
		],

		// ─ Processus Peppol ─
		process_control: {
			business_process_type: "M1",
			specification_identifier: "urn:cen.eu:en16931:2017",
		},

		// ─ Vendeur (notre utilisateur) ─
		seller: (() => {
			const seller: any = {
				name: user.companyName ?? "FacturFlow User",
				identifiers: [
					{
						value: user.companySiren,
						scheme: "0225",
					},
				],
				postal_address: {
					country_code: "FR",
				},
				electronic_address: { scheme: "0225", value: user.companySiren },
				legal_registration_identifier: {
					scheme: "0002",
					value: user.companySiren,
				},
			};
			
			// Ajouter les champs d'adresse seulement s'ils existent
			if (user.companyAddress) seller.postal_address.address_line1 = user.companyAddress;
			if (user.companyCity) seller.postal_address.city = user.companyCity;
			if (user.companyPostalCode) seller.postal_address.post_code = user.companyPostalCode;
			
			// Ajouter le numéro de TVA seulement s'il existe
			if (user.companyVatNumber) seller.vat_identifier = user.companyVatNumber;
			
			return seller;
		})(),

		// ─ Acheteur (client) ─
		buyer: (() => {
			const buyer: any = {
				name: buyerName,
				postal_address: {
					country_code: client.country === "France" ? "FR" : (client.country ?? "FR"),
				},
			};
			
			// Ajouter les identifiants seulement si le client a un SIREN
			if (client.companySiren) {
				buyer.identifiers = [
					{
						value: client.companySiren,
						scheme: "0225",
					},
				];
				buyer.electronic_address = { scheme: "0225", value: client.companySiren };
				buyer.legal_registration_identifier = {
					scheme: "0002",
					value: client.companySiren,
				};
			}
			
			// Ajouter les champs d'adresse seulement s'ils existent
			if (client.address) buyer.postal_address.address_line1 = client.address;
			if (client.city) buyer.postal_address.city = client.city;
			if (client.postalCode) buyer.postal_address.post_code = client.postalCode;
			
			// Ajouter le numéro de TVA seulement s'il existe et n'est pas vide
			if (client.companyVatNumber && client.companyVatNumber.trim()) {
				buyer.vat_identifier = client.companyVatNumber;
			}
			
			return buyer;
		})(),

		// ─ Lignes de facture ─
		lines: invoice.lineItems.map((li, idx) => ({
			identifier: String(idx + 1),
			invoiced_quantity: li.quantity.toNumber().toString(),
			invoiced_quantity_code: "C62", // C62 = unité (pièce)
			net_amount: li.subtotal.toNumber().toFixed(2),
			item_information: { name: li.description },
			vat_information: {
				invoiced_item_vat_category_code: vatCategoryCode,
				...(vatRate > 0 && { invoiced_item_vat_rate: vatRate.toFixed(2) }),
			},
			price_details: { item_net_price: li.unitPrice.toNumber().toFixed(2) },
		})),

		// ─ Totaux ─
		totals: {
			sum_invoice_lines_amount: subtotal.toFixed(2),
			total_without_vat: subtotal.toFixed(2),
			total_vat_amount: { currency_code: "EUR", value: taxTotal.toFixed(2) },
			total_with_vat: total.toFixed(2),
			amount_due_for_payment: netAPayer.toFixed(2),
			...(depositAmount > 0 && { paid_amount: depositAmount.toFixed(2) }),
		},

		// ─ Ventilation TVA ─
		vat_break_down: [
			{
				vat_category_code: vatCategoryCode,
				...(vatRate > 0 && { vat_category_rate: vatRate.toFixed(2) }),
				vat_category_taxable_amount: subtotal.toFixed(2),
				vat_category_tax_amount: taxTotal.toFixed(2),
				// Pour les auto-entrepreneurs : exonération article 293 B du CGI
				...(vatRate === 0 && {
					vat_exemption_reason_code: "VATEX-FR-FRANCHISE",
					vat_exemption_reason: "TVA non applicable, article 293 B du CGI",
				}),
			},
		],

		// ─ Notes ─
		...(invoice.notes && {
			notes: [{ note: invoice.notes }],
		}),

		// ─ Instructions de paiement (virement SEPA si IBAN disponible) ─
		...(user.iban && {
			payment_instructions: {
				payment_means_type_code: "30", // 30 = virement bancaire
				credit_transfers: [
					{
						payment_account_identifier: { scheme: "IBAN", value: user.iban },
						...(user.bic && { payment_service_provider_identifier: user.bic }),
					},
				],
			},
		}),
	};
}

// ─── Action principale ────────────────────────────────────────────────────────

/**
 * Envoie une facture en tant que facture électronique certifiée via SuperPDP.
 *
 * Flux :
 * 1. Récupère la facture complète en DB
 * 2. Vérifie que le client et le vendeur ont un SIREN (routage Peppol)
 * 3. Construit l'objet EN16931 JSON
 * 4. POST /invoices/convert?from=en16931&to=cii → XML CII
 * 5. POST /invoices (application/xml) → envoi réseau Peppol
 * 6. Stocke l'ID SuperPDP + statut en DB
 */
export async function sendEInvoice(invoiceId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		// ─ 1. Récupérer la facture avec toutes les données nécessaires ─
		const invoice = await prisma.document.findFirst({
			where: { id: invoiceId, userId: session.user.id, type: "INVOICE" },
			select: {
				id: true,
				number: true,
				date: true,
				dueDate: true,
				notes: true,
				subtotal: true,
				taxTotal: true,
				total: true,
				depositAmount: true,
				businessMetadata: true,
				einvoiceRef: true,
				lineItems: {
					select: {
						description: true,
						quantity: true,
						unitPrice: true,
						vatRate: true,
						subtotal: true,
					},
					orderBy: { order: "asc" },
				},
				client: {
					select: {
						companyName: true,
						firstName: true,
						lastName: true,
						companySiren: true,
						companySiret: true,
						companyVatNumber: true,
						email: true,
						address: true,
						postalCode: true,
						city: true,
						country: true,
						phone: true,
					},
				},
				user: {
					select: {
						companyName: true,
						companySiren: true,
						companySiret: true,
						companyVatNumber: true,
						companyAddress: true,
						companyPostalCode: true,
						companyCity: true,
						companyEmail: true,
						companyPhone: true,
						iban: true,
						bic: true,
					},
				},
			},
		});

		if (!invoice) {
			return { success: false, error: "Facture introuvable" } as const;
		}

		// ─ 2. Vérification : on a déjà envoyé cette facture ? ─
		if (invoice.einvoiceRef) {
			return {
				success: false,
				error: "Cette facture a déjà été envoyée électroniquement",
			} as const;
		}

		// ─ 3. Vérification : le client doit avoir un SIREN pour le routage Peppol ─
		if (!invoice.client.companySiren) {
			return {
				success: false,
				error:
					"Le client doit avoir un SIREN pour recevoir une facture électronique. " +
					"Ajoutez son SIREN dans la fiche client.",
			} as const;
		}

		// ─ 4. Vérification : le vendeur doit avoir un SIREN (requis pour son adresse Peppol) ─
		if (!invoice.user.companySiren) {
			return {
				success: false,
				error:
					'Votre SIREN doit être renseigné dans "Mon entreprise" pour envoyer des factures électroniques.',
			} as const;
		}

		// ─ 5. Construire l'objet EN16931 ─
		const en16931Raw = buildEN16931(invoice as unknown as InvoiceWithFullData);
		
		// ─ 5.1. Nettoyer l'objet pour supprimer les éléments vides ─
		const en16931 = removeEmptyProperties(en16931Raw) as EN16931Invoice;

		// ─ 6. Convertir EN16931 JSON → XML CII via SuperPDP ─
		const xml = await convertInvoiceToXml(en16931);

		// ─ 7. Envoyer le XML CII sur le réseau Peppol ─
		const response = await sendInvoiceXml(xml);

		// ─ 8. Persister l'ID SuperPDP et le statut initial en DB ─
		const initialStatus = response.events?.[0]?.status_code ?? "api:uploaded";
		await prisma.document.update({
			where: { id: invoiceId },
			data: {
				einvoiceRef: String(response.id),
				einvoiceStatus: initialStatus,
				einvoiceSentAt: new Date(),
			},
		});

		revalidatePath("/dashboard/invoices");

		return {
			success: true,
			data: { superpdpId: response.id, status: initialStatus },
		} as const;
	} catch (error) {
		console.error("[sendEInvoice] Erreur:", error);
		const message = error instanceof Error ? error.message : "Erreur inconnue";
		return {
			success: false,
			error: `Envoi électronique échoué : ${message}`,
		} as const;
	}
}

// ─── Action : récupérer le statut e-invoice d'une facture ────────────────────

export async function getEInvoiceStatus(invoiceId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié", data: null } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id: invoiceId, userId: session.user.id },
			select: {
				einvoiceRef: true,
				einvoiceStatus: true,
				einvoiceSentAt: true,
			},
		});

		if (!doc) {
			return {
				success: false,
				error: "Facture introuvable",
				data: null,
			} as const;
		}

		return { success: true, data: doc } as const;
	} catch (error) {
		console.error("[getEInvoiceStatus] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la récupération du statut",
			data: null,
		} as const;
	}
}
