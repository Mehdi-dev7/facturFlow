"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileSchema, changePasswordSchema } from "@/lib/validations/account";

// ─── Mettre à jour le profil (nom, téléphone, avatar) ────────────────────────

export async function updateProfile(formData: {
  name: string;
  phone?: string;
  image?: string | null;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Non authentifié" };

    const data = profileSchema.parse(formData);

    // Mise à jour du nom et de l'image via Better Auth
    await auth.api.updateUser({
      body: { name: data.name, image: data.image ?? undefined },
      headers: await headers(),
    });

    // Mise à jour du téléphone directement en DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: data.phone ?? null },
    });

    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (error) {
    console.error("[updateProfile]", error);
    return { success: false, error: "Impossible de mettre à jour le profil" };
  }
}

// ─── Changer le mot de passe (comptes credential uniquement) ──────────────────

export async function changePassword(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Non authentifié" };

    const data = changePasswordSchema.parse(formData);

    // Récupérer le compte credential
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: "credential" },
    });

    if (!account) {
      return { success: false, error: "Aucun mot de passe configuré pour ce compte" };
    }

    // Vérifier le mot de passe actuel
    const isValid = await bcrypt.compare(data.currentPassword, account.password!);
    if (!isValid) {
      return { success: false, error: "Mot de passe actuel incorrect" };
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const newHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash },
    });

    return { success: true };
  } catch (error) {
    console.error("[changePassword]", error);
    return { success: false, error: "Impossible de changer le mot de passe" };
  }
}

// ─── Sauvegarder la devise ────────────────────────────────────────────────────

export async function saveCurrency(currency: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Non authentifié" } as const;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { currency },
    });

    revalidatePath("/dashboard");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Impossible de sauvegarder la devise" } as const;
  }
}

// ─── Supprimer le compte et toutes les données associées ──────────────────────

export async function deleteAccount() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Non authentifié" };

    const userId = session.user.id;

    // Suppression des données liées dans l'ordre (éviter les FK constraints)
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.client.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { userId } });
    await prisma.paymentAccount.deleteMany({ where: { userId } });

    // Suppression du user (cascade Better Auth : sessions + accounts)
    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
  } catch (error) {
    console.error("[deleteAccount]", error);
    return { success: false, error: "Impossible de supprimer le compte" };
  }
}
