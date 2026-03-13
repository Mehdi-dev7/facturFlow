"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Types exportés ──────────────────────────────────────────────────────────

export interface SavedProduct {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  vatRate: number;
  unit: string;
}

// ─── Récupérer les produits de l'user connecté ───────────────────────────────

export async function getProducts(): Promise<SavedProduct[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  const products = await prisma.product.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      unitPrice: true,
      vatRate: true,
      unit: true,
    },
  });

  // Convertir les Decimal Prisma en number
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    unitPrice: Number(p.unitPrice),
    vatRate: Number(p.vatRate),
    unit: p.unit,
  }));
}

// ─── Sauvegarder un nouveau produit ──────────────────────────────────────────

export async function saveProduct(data: {
  name: string;
  description?: string;
  unitPrice: number;
  vatRate: number;
  unit?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false, error: "Non autorisé" };

  try {
    // Upsert par (userId + name) : crée ou met à jour le prix si le produit existe déjà
    await prisma.product.upsert({
      where: { userId_name: { userId: session.user.id, name: data.name } },
      update: {
        unitPrice: data.unitPrice,
        vatRate: data.vatRate,
        unit: data.unit ?? "unité",
      },
      create: {
        userId: session.user.id,
        name: data.name,
        description: data.description ?? null,
        unitPrice: data.unitPrice,
        vatRate: data.vatRate,
        unit: data.unit ?? "unité",
        type: "SERVICE",
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Impossible de sauvegarder le produit" };
  }
}
