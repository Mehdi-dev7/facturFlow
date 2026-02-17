"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Type exporté (utilisé par les hooks et les modals) ─────────────────────

export interface SavedQuote {
	id: string;
	number: string;
	status: string;
	date: string;
	validUntil: string | null;
	invoiceType: string | null;
	discountType: string | null;
	subtotal: number;
	taxTotal: number;
	total: number;
	discount: number | null;
	depositAmount: number | null;
	notes: string | null;
	acceptToken: string | null;
	refuseToken: string | null;
	lineItems: {
		id: string;
		description: string;
		quantity: number;
		unitPrice: number;
		vatRate: number;
		subtotal: number;
		taxAmount: number;
		total: number;
		category: string | null;
		order: number;
	}[];
	client: {
		id: string;
		companyName: string | null;
		firstName: string | null;
		lastName: string | null;
		email: string;
		city: string | null;
		address: string | null;
		postalCode: string | null;
	};
	user: {
		companyName: string | null;
		companySiret: string | null;
		companyAddress: string | null;
		companyPostalCode: string | null;
		companyCity: string | null;
		companyEmail: string | null;
		companyPhone: string | null;
	};
}

// ─── Prisma include & mapper ────────────────────────────────────────────────

const quoteInclude = {
	lineItems: { orderBy: { order: "asc" as const } },
	client: {
		select: {
			id: true,
			companyName: true,
			firstName: true,
			lastName: true,
			email: true,
			city: true,
			address: true,
			postalCode: true,
		},
	},
	user: {
		select: {
			companyName: true,
			companySiret: true,
			companyAddress: true,
			companyPostalCode: true,
			companyCity: true,
			companyEmail: true,
			companyPhone: true,
		},
	},
} as const;

type PrismaQuoteWithRelations = {
	id: string;
	number: string;
	status: string;
	date: Date;
	validUntil: Date | null;
	invoiceType: string | null;
	discountType: string | null;
	subtotal: { toNumber: () => number };
	taxTotal: { toNumber: () => number };
	total: { toNumber: () => number };
	discount: { toNumber: () => number } | null;
	depositAmount: { toNumber: () => number } | null;
	notes: string | null;
	acceptToken: string | null;
	refuseToken: string | null;
	lineItems: {
		id: string;
		description: string;
		quantity: { toNumber: () => number };
		unitPrice: { toNumber: () => number };
		vatRate: { toNumber: () => number };
		subtotal: { toNumber: () => number };
		taxAmount: { toNumber: () => number };
		total: { toNumber: () => number };
		category: string | null;
		order: number;
	}[];
	client: SavedQuote["client"];
	user: SavedQuote["user"];
};

function mapToSavedQuote(doc: PrismaQuoteWithRelations): SavedQuote {
	return {
		id: doc.id,
		number: doc.number,
		status: doc.status,
		date: doc.date.toISOString(),
		validUntil: doc.validUntil?.toISOString() ?? null,
		invoiceType: doc.invoiceType,
		discountType: doc.discountType,
		subtotal: doc.subtotal.toNumber(),
		taxTotal: doc.taxTotal.toNumber(),
		total: doc.total.toNumber(),
		discount: doc.discount ? doc.discount.toNumber() : null,
		depositAmount: doc.depositAmount ? doc.depositAmount.toNumber() : null,
		notes: doc.notes,
		acceptToken: doc.acceptToken,
		refuseToken: doc.refuseToken,
		lineItems: doc.lineItems.map((li) => ({
			id: li.id,
			description: li.description,
			quantity: li.quantity.toNumber(),
			unitPrice: li.unitPrice.toNumber(),
			vatRate: li.vatRate.toNumber(),
			subtotal: li.subtotal.toNumber(),
			taxAmount: li.taxAmount.toNumber(),
			total: li.total.toNumber(),
			category: li.category,
			order: li.order,
		})),
		client: doc.client,
		user: doc.user,
	};
}

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

// ─── Action : prochain numéro de devis ──────────────────────────────────────

export async function getNextQuoteNumber() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { quotePrefix: true, nextQuoteNumber: true },
		});

		if (!user) {
			return { success: false, error: "Utilisateur introuvable" } as const;
		}

		const year = new Date().getFullYear();
		const padded = String(user.nextQuoteNumber).padStart(4, "0");
		const number = `${user.quotePrefix}-${year}-${padded}`;

		return { success: true, data: { number } } as const;
	} catch (error) {
		console.error("[getNextQuoteNumber] Erreur:", error);
		return { success: false, error: "Erreur lors de la récupération du numéro" } as const;
	}
}

// ─── Action : récupérer la liste des devis ──────────────────────────────────

export async function getQuotes(filters?: { month?: string }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié", data: [] } as const;
	}

	try {
		// Filtre de date optionnel (format "YYYY-MM")
		let dateFilter: { gte?: Date; lte?: Date } | undefined;
		if (filters?.month) {
			const [year, month] = filters.month.split("-").map(Number);
			const start = new Date(year, month - 1, 1);
			const end = new Date(year, month, 0, 23, 59, 59, 999);
			dateFilter = { gte: start, lte: end };
		}

		const documents = await prisma.document.findMany({
			where: {
				userId: session.user.id,
				type: "QUOTE",
				...(dateFilter ? { date: dateFilter } : {}),
			},
			include: quoteInclude,
			orderBy: { createdAt: "desc" },
		});

		const quotes = documents.map((doc) =>
			mapToSavedQuote(doc as unknown as PrismaQuoteWithRelations),
		);

		return { success: true, data: quotes } as const;
	} catch (error) {
		console.error("[getQuotes] Erreur:", error);
		return { success: false, error: "Erreur lors de la récupération des devis", data: [] } as const;
	}
}

// ─── Action : récupérer un devis par ID ─────────────────────────────────────

export async function getQuote(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié", data: null } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "QUOTE" },
			include: quoteInclude,
		});

		if (!doc) {
			return { success: false, error: "Devis introuvable", data: null } as const;
		}

		const quote = mapToSavedQuote(doc as unknown as PrismaQuoteWithRelations);

		return { success: true, data: quote } as const;
	} catch (error) {
		console.error("[getQuote] Erreur:", error);
		return { success: false, error: "Erreur lors de la récupération du devis", data: null } as const;
	}
}

// ─── Action : changer le statut d'un devis ──────────────────────────────────

// Transitions autorisées (statut actuel → statuts possibles)
const QUOTE_TRANSITIONS: Record<string, string[]> = {
	DRAFT: ["SENT"],
	SENT: ["ACCEPTED", "REJECTED"],
	ACCEPTED: ["SENT"],
	REJECTED: ["SENT"],
	CANCELLED: ["SENT"],
};

export async function updateQuoteStatus(id: string, newStatus: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "QUOTE" },
			select: { status: true },
		});

		if (!doc) {
			return { success: false, error: "Devis introuvable" } as const;
		}

		// Vérifier que la transition est autorisée
		const allowed = QUOTE_TRANSITIONS[doc.status] ?? [];
		if (!allowed.includes(newStatus)) {
			return {
				success: false,
				error: `Transition non autorisée : ${doc.status} → ${newStatus}`,
			} as const;
		}

		await prisma.document.update({
			where: { id },
			data: { status: newStatus as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED" },
		});

		revalidatePath("/dashboard/quotes");

		return { success: true } as const;
	} catch (error) {
		console.error("[updateQuoteStatus] Erreur:", error);
		return { success: false, error: "Erreur lors du changement de statut" } as const;
	}
}


// ─── Action : mettre à jour un devis ────────────────────────────────────────

export async function updateQuote(id: string, input: CreateQuoteInput) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const data = createQuoteSchema.parse(input);

		const existing = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "QUOTE" },
			select: { id: true },
		});
		if (!existing) {
			return { success: false, error: "Devis introuvable" } as const;
		}

		const linesWithTotals = data.lines.map((line) => {
			const { subtotal, taxAmount, total } = calcLine(line.quantity, line.unitPrice, line.vatRate);
			return { ...line, subtotal, taxAmount, total };
		});

		const subtotal = linesWithTotals.reduce((s, l) => s + l.subtotal, 0);
		const taxTotal = linesWithTotals.reduce((s, l) => s + l.taxAmount, 0);
		const total = subtotal + taxTotal;

		await prisma.$transaction([
			prisma.document.update({
				where: { id },
				data: {
					clientId: data.clientId,
					date: new Date(data.date),
					validUntil: new Date(data.validUntil),
					subtotal,
					taxTotal,
					total,
					notes: data.notes ?? null,
				},
			}),
			prisma.documentLineItem.deleteMany({ where: { documentId: id } }),
			prisma.documentLineItem.createMany({
				data: linesWithTotals.map((line, index) => ({
					documentId: id,
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
			}),
		]);

		revalidatePath("/dashboard/quotes");
		return { success: true, data: { id } } as const;
	} catch (error) {
		console.error("[updateQuote] Erreur:", error);
		return { success: false, error: "Erreur lors de la mise à jour du devis" } as const;
	}
}

// ─── Action : supprimer un devis ────────────────────────────────────────────

export async function deleteQuote(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		await prisma.document.deleteMany({
			where: { id, userId: session.user.id, type: "QUOTE" },
		});

		revalidatePath("/dashboard/quotes");

		return { success: true } as const;
	} catch (error) {
		console.error("[deleteQuote] Erreur:", error);
		return { success: false, error: "Erreur lors de la suppression du devis" } as const;
	}
}

// ─── Action : dupliquer un devis ────────────────────────────────────────────

export async function duplicateQuote(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		// Récupérer le devis original avec ses lignes
		const original = await prisma.document.findFirst({
			where: { id, userId, type: "QUOTE" },
			include: { lineItems: { orderBy: { order: "asc" } } },
		});

		if (!original) {
			return { success: false, error: "Devis introuvable" } as const;
		}

		// Incrémenter le compteur et générer un nouveau numéro
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { nextQuoteNumber: { increment: 1 } },
			select: { nextQuoteNumber: true, quotePrefix: true },
		});

		const year = new Date().getFullYear();
		const usedNumber = updatedUser.nextQuoteNumber - 1;
		const newNumber = `${updatedUser.quotePrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

		// Générer de nouveaux tokens pour le duplicata
		const acceptToken = crypto.randomUUID();
		const refuseToken = crypto.randomUUID();

		// Créer le duplicata en DRAFT
		const newDoc = await prisma.document.create({
			data: {
				userId,
				clientId: original.clientId,
				type: "QUOTE",
				number: newNumber,
				date: new Date(),
				validUntil: original.validUntil,
				status: "DRAFT",
				subtotal: original.subtotal,
				taxTotal: original.taxTotal,
				total: original.total,
				discount: original.discount,
				depositAmount: original.depositAmount,
				discountType: original.discountType,
				invoiceType: original.invoiceType,
				notes: original.notes,
				acceptToken,
				refuseToken,
				lineItems: {
					create: original.lineItems.map((li) => ({
						description: li.description,
						quantity: li.quantity,
						unit: li.unit,
						unitPrice: li.unitPrice,
						vatRate: li.vatRate,
						subtotal: li.subtotal,
						taxAmount: li.taxAmount,
						total: li.total,
						category: li.category,
						order: li.order,
					})),
				},
			},
			select: { id: true, number: true },
		});

		revalidatePath("/dashboard/quotes");

		return { success: true, data: { id: newDoc.id, number: newDoc.number } } as const;
	} catch (error) {
		console.error("[duplicateQuote] Erreur:", error);
		return { success: false, error: "Erreur lors de la duplication du devis" } as const;
	}
}
