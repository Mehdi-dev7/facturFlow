"use server";
// src/lib/actions/payments.ts
// Server Actions pour la gestion des comptes de paiement (Stripe, PayPal, GoCardless)

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/encrypt";
import { getStripeClient } from "@/lib/stripe";
import type { PaymentProvider } from "@prisma/client";

// ─── Types publics (sans credentials) ────────────────────────────────────────

export interface PaymentAccountInfo {
  provider: PaymentProvider;
  isActive: boolean;
  connectedAt: string;
}

// Credentials déchiffrées (usage serveur uniquement)
export interface StripeCredential {
  secretKey: string;
  webhookSecret?: string;
}
export interface PaypalCredential {
  clientId: string;
  clientSecret: string;
}
export interface GocardlessCredential {
  accessToken: string;
}

// ─── Récupérer les comptes connectés (sans les credentials) ───────────────────

export async function getPaymentAccounts(): Promise<PaymentAccountInfo[] | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const accounts = await prisma.paymentAccount.findMany({
    where: { userId: session.user.id },
    select: { provider: true, isActive: true, connectedAt: true },
    orderBy: { connectedAt: "asc" },
  });

  return accounts.map((a) => ({
    ...a,
    connectedAt: a.connectedAt.toISOString(),
  }));
}

// ─── Récupérer les credentials déchiffrées d'un provider ──────────────────────
// Usage interne (routes API, webhooks) — jamais exposé au client

export async function getStripeCredential(
  userId: string
): Promise<StripeCredential | null> {
  const account = await prisma.paymentAccount.findUnique({
    where: { userId_provider: { userId, provider: "STRIPE" } },
    select: { credential: true, isActive: true },
  });
  if (!account || !account.isActive) return null;

  try {
    return JSON.parse(decrypt(account.credential)) as StripeCredential;
  } catch {
    return null;
  }
}

// ─── Connecter Stripe ─────────────────────────────────────────────────────────

export async function connectStripe(
  secretKey: string,
  webhookSecret?: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Non authentifié" } as const;

  // Valider le format de la clé
  if (!secretKey.startsWith("sk_live_") && !secretKey.startsWith("sk_test_")) {
    return {
      success: false,
      error: "Clé invalide (doit commencer par sk_live_ ou sk_test_)",
    } as const;
  }

  // Vérifier la clé auprès de l'API Stripe
  try {
    const stripe = getStripeClient(secretKey);
    await stripe.balance.retrieve(); // appel simple pour valider la clé
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Clé rejetée";
    return { success: false, error: `Clé Stripe invalide : ${msg}` } as const;
  }

  try {
    // Chiffrer et upsert
    const credentialData: StripeCredential = { secretKey };
    if (webhookSecret?.trim()) credentialData.webhookSecret = webhookSecret.trim();

    const credential = encrypt(JSON.stringify(credentialData));

    await prisma.paymentAccount.upsert({
      where: {
        userId_provider: { userId: session.user.id, provider: "STRIPE" },
      },
      create: {
        userId: session.user.id,
        provider: "STRIPE",
        credential,
      },
      update: {
        credential,
        isActive: true,
        connectedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/payments");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Erreur lors de la sauvegarde" } as const;
  }
}

// ─── Connecter PayPal ─────────────────────────────────────────────────────────

export async function connectPayPal(clientId: string, clientSecret: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Non authentifié" } as const;

  if (!clientId.trim() || !clientSecret.trim()) {
    return { success: false, error: "Client ID et Client Secret requis" } as const;
  }

  try {
    const credential = encrypt(JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }));

    await prisma.paymentAccount.upsert({
      where: {
        userId_provider: { userId: session.user.id, provider: "PAYPAL" },
      },
      create: {
        userId: session.user.id,
        provider: "PAYPAL",
        credential,
      },
      update: {
        credential,
        isActive: true,
        connectedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/payments");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Erreur lors de la sauvegarde" } as const;
  }
}

// ─── Connecter GoCardless ─────────────────────────────────────────────────────

export async function connectGoCardless(accessToken: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Non authentifié" } as const;

  if (!accessToken.trim()) {
    return { success: false, error: "Access token requis" } as const;
  }

  try {
    const credential = encrypt(JSON.stringify({ accessToken: accessToken.trim() }));

    await prisma.paymentAccount.upsert({
      where: {
        userId_provider: { userId: session.user.id, provider: "GOCARDLESS" },
      },
      create: {
        userId: session.user.id,
        provider: "GOCARDLESS",
        credential,
      },
      update: {
        credential,
        isActive: true,
        connectedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/payments");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Erreur lors de la sauvegarde" } as const;
  }
}

// ─── Déconnecter un provider ──────────────────────────────────────────────────

export async function disconnectProvider(provider: PaymentProvider) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Non authentifié" } as const;

  try {
    await prisma.paymentAccount.deleteMany({
      where: { userId: session.user.id, provider },
    });

    revalidatePath("/dashboard/payments");
    return { success: true } as const;
  } catch {
    return { success: false, error: "Erreur lors de la déconnexion" } as const;
  }
}
