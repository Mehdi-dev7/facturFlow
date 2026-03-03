import { z } from "zod";

// ─── Schéma : mise à jour du profil personnel ────────────────────────────────

export const profileSchema = z.object({
  name: z.string().min(2, "Au moins 2 caractères"),
  phone: z.string().optional(),
  image: z.string().nullable().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ─── Schéma : changement de mot de passe ──────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/[A-Z]/, "Une majuscule minimum")
      .regex(/[0-9]/, "Un chiffre minimum"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
