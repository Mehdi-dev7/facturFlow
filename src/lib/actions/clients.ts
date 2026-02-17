"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clientFormSchema, type ClientFormData } from "@/lib/validations/client";

// ─── Type exporté (utilisé par les hooks et les pages) ──────────────────────

export interface SavedClient {
  id: string;
  type: "entreprise" | "particulier";
  name: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  siret: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  notes: string | null;
  totalInvoiced: number;
  totalPaid: number;
  documentCount: number;
  createdAt: string;
}

// ─── Helper : mapper un Client Prisma vers SavedClient ──────────────────────

type PrismaClientRow = {
  id: string;
  type: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  companySiret: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  notes: string | null;
  totalInvoiced: { toNumber: () => number };
  totalPaid: { toNumber: () => number };
  createdAt: Date;
  _count?: { documents: number };
};

function mapToSavedClient(row: PrismaClientRow): SavedClient {
  // Nom affiché : raison sociale pour entreprises, prénom + nom pour particuliers
  const displayName =
    row.companyName ?? ([row.firstName, row.lastName].filter(Boolean).join(" ") || row.email);

  return {
    id: row.id,
    type: row.type === "COMPANY" ? "entreprise" : "particulier",
    name: displayName,
    companyName: row.companyName,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    siret: row.companySiret,
    address: row.address,
    postalCode: row.postalCode,
    city: row.city,
    notes: row.notes,
    totalInvoiced: row.totalInvoiced.toNumber(),
    totalPaid: row.totalPaid.toNumber(),
    documentCount: row._count?.documents ?? 0,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Action : liste des clients ─────────────────────────────────────────────

export async function getClients(filters?: { search?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: [] } as const;
  }

  try {
    // Filtre par recherche (nom, email, ville)
    const searchFilter = filters?.search
      ? {
          OR: [
            { companyName: { contains: filters.search, mode: "insensitive" as const } },
            { firstName: { contains: filters.search, mode: "insensitive" as const } },
            { lastName: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
            { city: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
        ...searchFilter,
      },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = clients.map((c) => mapToSavedClient(c as unknown as PrismaClientRow));

    return { success: true, data: mapped } as const;
  } catch (error) {
    console.error("[getClients] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des clients", data: [] } as const;
  }
}

// ─── Action : récupérer un client par ID ────────────────────────────────────

export async function getClient(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: null } as const;
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
      include: {
        _count: { select: { documents: true } },
      },
    });

    if (!client) {
      return { success: false, error: "Client introuvable", data: null } as const;
    }

    return { success: true, data: mapToSavedClient(client as unknown as PrismaClientRow) } as const;
  } catch (error) {
    console.error("[getClient] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération du client", data: null } as const;
  }
}

// ─── Action : créer un client ───────────────────────────────────────────────

export async function createClient(data: ClientFormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  // Validation Zod côté serveur
  try {
    clientFormSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    const isCompany = data.type === "entreprise";

    // Vérifier si un client avec le même email existe déjà pour cet utilisateur
    const existing = await prisma.client.findFirst({
      where: { email: data.email, userId: session.user.id },
    });

    if (existing) {
      return { success: false, error: "Un client avec cet email existe déjà" } as const;
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        type: isCompany ? "COMPANY" : "INDIVIDUAL",
        companyName: isCompany ? data.name : null,
        firstName: isCompany ? null : data.name.split(" ")[0] ?? data.name,
        lastName: isCompany ? null : data.name.split(" ").slice(1).join(" ") || null,
        companySiret: data.siret || null,
        email: data.email,
        phone: data.phone || null,
        address: data.address,
        postalCode: data.zipCode || null,
        city: data.city,
        notes: data.notes || null,
      },
      include: {
        _count: { select: { documents: true } },
      },
    });

    revalidatePath("/dashboard/clients");

    return {
      success: true,
      data: mapToSavedClient(client as unknown as PrismaClientRow),
    } as const;
  } catch (error) {
    console.error("[createClient] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du client" } as const;
  }
}

// ─── Action : mettre à jour un client ───────────────────────────────────────

export async function updateClient(id: string, data: ClientFormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  // Validation Zod côté serveur
  try {
    clientFormSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Données invalides", details: error.issues } as const;
    }
    return { success: false, error: "Erreur de validation" } as const;
  }

  try {
    // Vérifier que le client existe et appartient à l'utilisateur
    const existing = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Client introuvable" } as const;
    }

    const isCompany = data.type === "entreprise";

    // Vérifier unicité email si changé
    if (data.email !== existing.email) {
      const duplicate = await prisma.client.findFirst({
        where: { email: data.email, userId: session.user.id, NOT: { id } },
      });
      if (duplicate) {
        return { success: false, error: "Un client avec cet email existe déjà" } as const;
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        type: isCompany ? "COMPANY" : "INDIVIDUAL",
        companyName: isCompany ? data.name : null,
        firstName: isCompany ? null : data.name.split(" ")[0] ?? data.name,
        lastName: isCompany ? null : data.name.split(" ").slice(1).join(" ") || null,
        companySiret: data.siret || null,
        email: data.email,
        phone: data.phone || null,
        address: data.address,
        postalCode: data.zipCode || null,
        city: data.city,
        notes: data.notes || null,
      },
      include: {
        _count: { select: { documents: true } },
      },
    });

    revalidatePath("/dashboard/clients");

    return {
      success: true,
      data: mapToSavedClient(client as unknown as PrismaClientRow),
    } as const;
  } catch (error) {
    console.error("[updateClient] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour du client" } as const;
  }
}

// ─── Action : supprimer un client ───────────────────────────────────────────

export async function deleteClient(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const;
  }

  try {
    // Vérifier que le client existe et appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
      include: { _count: { select: { documents: true } } },
    });

    if (!client) {
      return { success: false, error: "Client introuvable" } as const;
    }

    // Empêcher la suppression si des documents sont liés
    if (client._count.documents > 0) {
      return {
        success: false,
        error: `Ce client est lié à ${client._count.documents} document(s). Supprimez d'abord les documents associés.`,
      } as const;
    }

    await prisma.client.delete({ where: { id } });

    revalidatePath("/dashboard/clients");

    return { success: true } as const;
  } catch (error) {
    console.error("[deleteClient] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression du client" } as const;
  }
}
