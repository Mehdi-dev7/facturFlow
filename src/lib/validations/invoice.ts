import { z } from "zod";

export const VAT_RATES = [0, 5.5, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

export const INVOICE_TYPES = [
	"basic",
	"freelance_heures",
	"freelance_tache",
	"artisan",
	"ecommerce",
] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
	basic: "Facture basique (libre)",
	freelance_heures: "Freelance — Facturation horaire",
	freelance_tache: "Freelance — Facturation à la tâche",
	artisan: "Artisan — Main d'œuvre + Matériaux",
	ecommerce: "E-commerce — Liste produits",
};

// Configuration des labels de colonnes par type
export const INVOICE_TYPE_CONFIG: Record<
	InvoiceType,
	{
		descriptionLabel: string;
		quantityLabel: string | null; // null = caché (forfait)
		priceLabel: string;
		showCategory: boolean;
	}
> = {
	basic: {
		descriptionLabel: "Description",
		quantityLabel: "Qté",
		priceLabel: "Prix unit. (€)",
		showCategory: false,
	},
	freelance_heures: {
		descriptionLabel: "Description de la tâche",
		quantityLabel: "Heures",
		priceLabel: "Taux horaire (€/h)",
		showCategory: false,
	},
	freelance_tache: {
		descriptionLabel: "Tâche / Livrable",
		quantityLabel: null,
		priceLabel: "Montant forfaitaire (€)",
		showCategory: false,
	},
	artisan: {
		descriptionLabel: "Description",
		quantityLabel: "Qté",
		priceLabel: "Prix unit. (€)",
		showCategory: true,
	},
	ecommerce: {
		descriptionLabel: "Produit",
		quantityLabel: "Quantité",
		priceLabel: "Prix unitaire (€)",
		showCategory: false,
	},
};

export const invoiceLineSchema = z.object({
	description: z.string().min(1, "La description est requise"),
	quantity: z.number().min(0.01, "La quantité doit être supérieure à 0"),
	unitPrice: z.number().min(0, "Le prix unitaire ne peut pas être négatif"),
	category: z.enum(["main_oeuvre", "materiel"]).optional(), // artisan uniquement
});

export const quickClientSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	email: z.string().email("Email invalide"),
	address: z.string().min(5, "L'adresse est requise"),
	zipCode: z.string().optional(),
	city: z.string().min(2, "La ville est requise"),
	siret: z.string().optional(),
});

export const companyInfoSchema = z.object({
	name: z.string().min(2, "Le nom de l'entreprise est requis"),
	siret: z.string().min(14, "Le SIRET doit contenir 14 chiffres").max(14),
	address: z.string().min(5, "L'adresse est requise"),
	zipCode: z.string().optional(),
	city: z.string().min(2, "La ville est requise"),
	email: z.string().email("Email invalide"),
	phone: z.string().optional(),
});

export const invoiceFormSchema = z
	.object({
		clientId: z.string().optional(),
		newClient: quickClientSchema.optional(),
		date: z.string().min(1, "La date est requise"),
		dueDate: z.string().min(1, "La date d'échéance est requise"),
		invoiceType: z.enum(INVOICE_TYPES),
		lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
		vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)], {
			message: "Taux de TVA invalide",
		}),
		discountType: z.enum(["pourcentage", "montant"]).optional(),
		discountValue: z.number().min(0).optional(),
		depositAmount: z.number().min(0).optional(),
		notes: z.string().optional(),
		paymentLinks: z
			.object({
				stripe: z.union([z.literal(""), z.url()]).optional(),
				paypal: z.union([z.literal(""), z.url()]).optional(),
				gocardless: z.union([z.literal(""), z.url()]).optional(),
			})
			.optional(),
	})
	.refine((data) => data.clientId || data.newClient, {
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
	invoiceType: InvoiceType;
	lines: InvoiceLine[];
	vatRate: VatRate;
	subtotal: number;
	discountAmount: number;
	netHT: number;
	taxTotal: number;
	total: number;
	depositAmount: number;
	netAPayer: number;
	notes?: string;
	paymentLinks?: { stripe?: string; paypal?: string; gocardless?: string };
	status: "brouillon";
}
