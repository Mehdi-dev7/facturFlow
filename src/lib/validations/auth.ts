import { z } from "zod";

export const passwordSchema = z
	.string()
	.min(8, "Le mot de passe doit contenir au moins 8 caractères")
	.regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
	.regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
	.regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
	.regex(
		/[!@#$%^&*(),.?":{}|<>_\-+=;'\/\[\]\\`~]/,
		"Le mot de passe doit contenir au moins un caractère spécial (!@#$%...)",
	);

export const signUpSchema = z
	.object({
		name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
		email: z.string().email("Adresse email invalide"),
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});

export type SignUpFormData = z.infer<typeof signUpSchema>;
