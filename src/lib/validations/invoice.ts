import { z } from "zod";

export const VAT_RATES = [0, 5.5, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

export const invoiceLineSchema = z.object({
	description: z.string().min(1, "La description est requise"),
	quantity: z.number().min(1, "La quantité doit être au moins 1"),
	unitPrice: z.number().min(0, "Le prix unitaire doit être positif"),
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

export const invoiceFormSchema = z.object({
	clientId: z.string().optional(),
	newClient: quickClientSchema.optional(),
	date: z.string().min(1, "La date est requise"),
	dueDate: z.string().min(1, "La date d'échéance est requise"),
	lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
	vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)], {
		message: "Taux de TVA invalide",
	}),
	notes: z.string().optional(),
	paymentLinks: z
		.object({
			stripe: z.string().url("URL invalide").optional().or(z.literal("")),
			paypal: z.string().url("URL invalide").optional().or(z.literal("")),
			gocardless: z.string().url("URL invalide").optional().or(z.literal("")),
		})
		.optional(),
}).refine((data) => data.clientId || data.newClient, {
	message: "Veuillez sélectionner ou créer un client",
	path: ["clientId"],
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type InvoiceLine = z.infer<typeof invoiceLineSchema>;
export type QuickClientData = z.infer<typeof quickClientSchema>;
export type CompanyInfo = z.infer<typeof companyInfoSchema>;

export interface DraftInvoice {
	id: string;
	emitter: CompanyInfo;
	client: QuickClientData;
	date: string;
	dueDate: string;
	lines: InvoiceLine[];
	vatRate: VatRate;
	subtotal: number;
	taxTotal: number;
	total: number;
	notes?: string;
	paymentLinks?: { stripe?: string; paypal?: string; gocardless?: string };
	status: "brouillon";
}
