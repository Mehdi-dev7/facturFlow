import { z } from "zod";
import {
	INVOICE_TYPES,
	INVOICE_TYPE_LABELS,
	INVOICE_TYPE_CONFIG,
} from "@/lib/validations/invoice";

export { INVOICE_TYPES, INVOICE_TYPE_LABELS, INVOICE_TYPE_CONFIG };
export type { InvoiceType } from "@/lib/validations/invoice";

export const VAT_RATES = [0, 5.5, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

export const quoteLineSchema = z.object({
	description: z.string().min(1, "La description est requise"),
	quantity: z.number().min(0.01, "La quantité doit être positive"),
	unitPrice: z.number().min(0, "Le prix unitaire doit être positif"),
	category: z.enum(["main_oeuvre", "materiel"]).optional(),
});

export const quickClientSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	email: z.string().email("Email invalide"),
	address: z.string().min(5, "L'adresse est requise"),
	city: z.string().min(2, "La ville est requise"),
	siret: z.string().optional(),
});

export const companyInfoSchema = z.object({
	name: z.string().min(2, "Le nom de l'entreprise est requis"),
	siret: z.string().min(14, "Le SIRET doit contenir 14 chiffres").max(14),
	address: z.string().min(5, "L'adresse est requise"),
	city: z.string().min(2, "La ville est requise"),
	email: z.string().email("Email invalide"),
	phone: z.string().optional(),
});

export const quoteFormSchema = z
	.object({
		clientId: z.string().optional(),
		newClient: quickClientSchema.optional(),
		date: z.string().min(1, "La date est requise"),
		validUntil: z.string().min(1, "La date de validité est requise"),
		quoteType: z.enum(INVOICE_TYPES),
		lines: z.array(quoteLineSchema).min(1, "Au moins une ligne est requise"),
		vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)], {
			message: "Taux de TVA invalide",
		}),
		discountType: z.enum(["pourcentage", "montant"]).optional(),
		discountValue: z.number().min(0).optional(),
		depositAmount: z.number().min(0).optional(),
		notes: z.string().optional(),
	})
	.refine((data) => data.clientId || data.newClient, {
		message: "Veuillez sélectionner ou créer un client",
		path: ["clientId"],
	});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;
export type QuoteLine = z.infer<typeof quoteLineSchema>;
export type QuickClientData = z.infer<typeof quickClientSchema>;
export type CompanyInfo = z.infer<typeof companyInfoSchema>;

export interface DraftQuote {
	id: string;
	emitter: CompanyInfo;
	client: QuickClientData;
	date: string;
	validUntil: string;
	quoteType: string;
	lines: QuoteLine[];
	vatRate: VatRate;
	subtotal: number;
	discountAmount: number;
	netHT: number;
	taxTotal: number;
	total: number;
	depositAmount: number;
	netAPayer: number;
	notes?: string;
	status: "brouillon";
}
