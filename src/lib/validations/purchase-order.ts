import { z } from "zod";
import {
	INVOICE_TYPES,
	INVOICE_TYPE_LABELS,
	INVOICE_TYPE_CONFIG,
} from "@/lib/validations/invoice";

// Re-exports utiles pour les composants qui importent depuis ce fichier
export { INVOICE_TYPES, INVOICE_TYPE_LABELS, INVOICE_TYPE_CONFIG };
export type { InvoiceType } from "@/lib/validations/invoice";

export const VAT_RATES = [0, 5.5, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

// ─── Schéma d'une ligne de bon de commande ───────────────────────────────────

export const purchaseOrderLineSchema = z.object({
	description: z.string().min(1, "La description est requise"),
	quantity: z.number().min(0.01, "La quantité doit être positive"),
	unitPrice: z.number().min(0, "Le prix unitaire doit être positif"),
	category: z.enum(["main_oeuvre", "materiel"]).optional(),
});

// ─── Schéma client rapide (création inline) ──────────────────────────────────

export const quickClientSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	email: z.string().email("Email invalide"),
	address: z.string().min(5, "L'adresse est requise"),
	city: z.string().min(2, "La ville est requise"),
	siret: z.string().optional(),
});

// ─── Schéma émetteur (informations entreprise) ───────────────────────────────

export const companyInfoSchema = z.object({
	name: z.string().min(2, "Le nom de l'entreprise est requis"),
	siret: z.string().min(14, "Le SIRET doit contenir 14 chiffres").max(14),
	address: z.string().min(5, "L'adresse est requise"),
	zipCode: z.string().optional(),
	city: z.string().min(2, "La ville est requise"),
	email: z.string().email("Email invalide"),
	phone: z.string().optional(),
});

// ─── Schéma principal du formulaire bon de commande ─────────────────────────

export const purchaseOrderFormSchema = z
	.object({
		clientId: z.string().optional(),
		newClient: quickClientSchema.optional(),
		date: z.string().min(1, "La date est requise"),
		// Date de livraison souhaitée — optionnelle (contrairement à validUntil sur les devis)
		deliveryDate: z.string().optional(),
		// Référence interne du BC côté client (ex: "PO-2024-100")
		bcReference: z.string().optional(),
		// Type de prestation (freelance_heures, btp, etc.)
		orderType: z.enum(INVOICE_TYPES),
		lines: z.array(purchaseOrderLineSchema).min(1, "Au moins une ligne est requise"),
		vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)], {
			message: "Taux de TVA invalide",
		}),
		discountType: z.enum(["pourcentage", "montant"]).optional(),
		discountValue: z.number().min(0).optional(),
		notes: z.string().optional(),
	})
	.refine((data) => data.clientId || data.newClient, {
		message: "Veuillez sélectionner ou créer un client",
		path: ["clientId"],
	});

// ─── Types inférés ───────────────────────────────────────────────────────────

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderFormSchema>;
export type PurchaseOrderLine = z.infer<typeof purchaseOrderLineSchema>;
export type QuickClientData = z.infer<typeof quickClientSchema>;
export type CompanyInfo = z.infer<typeof companyInfoSchema>;
