import { z } from "zod";

export const clientFormSchema = z.object({
	type: z.enum(["entreprise", "particulier"]),
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	siret: z.string().optional(),
	email: z.string().email("Email invalide"),
	phone: z.string().optional(),
	address: z.string().min(5, "L'adresse est requise"),
	zipCode: z.string().optional(),
	city: z.string().min(2, "La ville est requise"),
	notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
