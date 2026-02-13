"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Schema de validation ────────────────────────────────────────────────────

const createQuoteSchema = z.object({
	clientId: z.string().min(1, "Le client est requis"),
	date: z.string().min(1, "La date est requise"),
	validUntil: z.string().min(1, "La date de validité est requise"),
	lines: z
		.array(
			z.object({
				description: z.string().min(1, "La description est requise"),
				quantity: z.number().min(1),
				unitPrice: z.number().min(0),
				vatRate: z.number().min(0).max(100).default(20),
			}),
		)
		.min(1, "Au moins une ligne est requise"),
	vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
	notes: z.string().optional(),
	number: z.string().min(1),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

// ─── Helper ──────────────────────────────────────────────────────────────────

function calcLine(quantity: number, unitPrice: number, vatRate: number) {
	const subtotal = quantity * unitPrice;
	const taxAmount = subtotal * (vatRate / 100);
	return { subtotal, taxAmount, total: subtotal + taxAmount };
}

// ─── Server Action ───────────────────────────────────────────────────────────

export async function createQuote(input: CreateQuoteInput) {
	// Auth
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const data = createQuoteSchema.parse(input);

		// Vérifier que le client appartient bien à cet utilisateur
		const client = await prisma.client.findFirst({
			where: { id: data.clientId, userId: session.user.id },
			select: { id: true },
		});
		if (!client) {
			return { success: false, error: "Client introuvable" } as const;
		}

		// Calculer les montants
		const linesWithTotals = data.lines.map((line) => {
			const { subtotal, taxAmount, total } = calcLine(
				line.quantity,
				line.unitPrice,
				line.vatRate,
			);
			return { ...line, subtotal, taxAmount, total };
		});

		const subtotal = linesWithTotals.reduce((s, l) => s + l.subtotal, 0);
		const taxTotal = linesWithTotals.reduce((s, l) => s + l.taxAmount, 0);
		const total = subtotal + taxTotal;

		// Générer les tokens de validation (UUID v4 via crypto)
		const acceptToken = crypto.randomUUID();
		const refuseToken = crypto.randomUUID();

		// Créer le devis en base
		const quote = await prisma.document.create({
			data: {
				userId: session.user.id,
				type: "QUOTE",
				number: data.number,
				clientId: data.clientId,
				date: new Date(data.date),
				validUntil: new Date(data.validUntil),
				status: "DRAFT",
				subtotal,
				taxTotal,
				total,
				notes: data.notes,
				acceptToken,
				refuseToken,
				lineItems: {
					create: linesWithTotals.map((line, index) => ({
						description: line.description,
						quantity: line.quantity,
						unit: "unité",
						unitPrice: line.unitPrice,
						vatRate: line.vatRate,
						subtotal: line.subtotal,
						taxAmount: line.taxAmount,
						total: line.total,
						order: index,
					})),
				},
			},
			select: {
				id: true,
				number: true,
				acceptToken: true,
				refuseToken: true,
			},
		});

		revalidatePath("/dashboard/quotes");

		return {
			success: true,
			data: quote,
		} as const;
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Données invalides",
				details: error.issues,
			} as const;
		}
		console.error("[createQuote] Erreur:", error);
		return { success: false, error: "Erreur lors de la création du devis" } as const;
	}
}

// ─── Marquer un devis comme "Envoyé" ─────────────────────────────────────────

export async function sendQuote(quoteId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const quote = await prisma.document.findFirst({
			where: { id: quoteId, userId: session.user.id, type: "QUOTE" },
			select: { id: true, status: true, acceptToken: true, refuseToken: true },
		});

		if (!quote) {
			return { success: false, error: "Devis introuvable" } as const;
		}

		if (quote.status !== "DRAFT") {
			return { success: false, error: "Seul un brouillon peut être envoyé" } as const;
		}

		const updated = await prisma.document.update({
			where: { id: quote.id },
			data: { status: "SENT" },
			select: { id: true, status: true, acceptToken: true, refuseToken: true },
		});

		revalidatePath("/dashboard/quotes");

		return { success: true, data: updated } as const;
	} catch (error) {
		console.error("[sendQuote] Erreur:", error);
		return { success: false, error: "Erreur lors de l'envoi du devis" } as const;
	}
}
