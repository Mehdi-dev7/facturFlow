"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";
import type { InvoiceFormData, VatRate } from "@/lib/validations/invoice";
import { canCreateDocument } from "@/lib/feature-gate";
import type { SavedInvoice } from "./invoices";

// ─── Type exporté ────────────────────────────────────────────────────────────

export interface SavedProforma extends SavedInvoice {
	// Champs supplémentaires spécifiques aux proformas
	validUntil: string | null;
	dueDate: string | null;
	acceptToken: string | null;
	refuseToken: string | null;
	convertedInvoiceId: string | null;
	convertedInvoiceNumber: string | null;
}

// ─── Include Prisma & mapper ─────────────────────────────────────────────────

const proformaInclude = {
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
			themeColor: true,
			companyFont: true,
			companyLogo: true,
		},
	},
} as const;

type PrismaProformaWithRelations = {
	updatedAt: Date;
	id: string;
	number: string;
	status: string;
	date: Date;
	dueDate: Date | null;
	validUntil: Date | null;
	invoiceType: string | null;
	discountType: string | null;
	subtotal: { toNumber: () => number };
	taxTotal: { toNumber: () => number };
	total: { toNumber: () => number };
	discount: { toNumber: () => number } | null;
	depositAmount: { toNumber: () => number } | null;
	notes: string | null;
	einvoiceRef: string | null;
	einvoiceStatus: string | null;
	einvoiceSentAt: Date | null;
	acceptToken: string | null;
	refuseToken: string | null;
	businessMetadata: unknown;
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
	client: SavedInvoice["client"];
	user: SavedInvoice["user"];
};

function mapToSavedProforma(doc: PrismaProformaWithRelations): SavedProforma {
	const meta =
		doc.businessMetadata != null
			? (doc.businessMetadata as Record<string, unknown>)
			: null;

	return {
		// Champs de SavedInvoice
		id: doc.id,
		number: doc.number,
		status: doc.status,
		updatedAt: doc.updatedAt.toISOString(),
		date: doc.date.toISOString(),
		dueDate: doc.dueDate?.toISOString() ?? null,
		invoiceType: doc.invoiceType,
		discountType: doc.discountType,
		subtotal: doc.subtotal.toNumber(),
		taxTotal: doc.taxTotal.toNumber(),
		total: doc.total.toNumber(),
		discount: doc.discount ? doc.discount.toNumber() : null,
		depositAmount: doc.depositAmount ? doc.depositAmount.toNumber() : null,
		notes: doc.notes,
		einvoiceRef: doc.einvoiceRef,
		einvoiceStatus: doc.einvoiceStatus,
		einvoiceSentAt: doc.einvoiceSentAt?.toISOString() ?? null,
		businessMetadata: meta,
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
		// Champs spécifiques proforma
		validUntil: doc.validUntil?.toISOString() ?? null,
		acceptToken: doc.acceptToken,
		refuseToken: doc.refuseToken ?? null,
		convertedInvoiceId:
			meta?.convertedInvoiceId != null
				? String(meta.convertedInvoiceId)
				: null,
		convertedInvoiceNumber:
			meta?.convertedInvoiceNumber != null
				? String(meta.convertedInvoiceNumber)
				: null,
	};
}

// ─── Schéma de validation côté serveur ───────────────────────────────────────

const saveSchema = z
	.object({
		clientId: z.string().optional(),
		newClient: z
			.object({
				name: z.string().min(2),
				email: z.string().email(),
				address: z.string().min(5),
				city: z.string().min(2),
				siret: z.string().optional(),
			})
			.optional(),
		date: z.string().min(1),
		dueDate: z.string().optional(),
		validUntil: z.string().optional(),
		invoiceType: z.string().optional(),
		lines: z
			.array(
				z.object({
					description: z.string().min(1),
					quantity: z.number().min(0.01),
					unitPrice: z.number().min(0),
					category: z.enum(["main_oeuvre", "materiel"]).optional(),
				}),
			)
			.min(1),
		vatRate: z.union([
			z.literal(0),
			z.literal(5.5),
			z.literal(10),
			z.literal(20),
		]),
		discountType: z.enum(["pourcentage", "montant"]).optional(),
		discountValue: z.number().min(0).optional(),
		depositAmount: z.number().min(0).optional(),
		notes: z.string().optional(),
	})
	.refine((d) => d.clientId || d.newClient, {
		message: "Veuillez sélectionner ou créer un client",
		path: ["clientId"],
	});

// ─── Helper : calculer les lignes ────────────────────────────────────────────

function calcLineItems(lines: InvoiceFormData["lines"], vatRate: number) {
	return (lines ?? []).map((line, idx) => {
		const qty = line.quantity ?? 1;
		const up = line.unitPrice ?? 0;
		const subtotal = qty * up;
		const taxAmount = subtotal * (vatRate / 100);
		const total = subtotal + taxAmount;
		return {
			description: line.description,
			quantity: qty,
			unit: "unité",
			unitPrice: up,
			vatRate,
			subtotal,
			taxAmount,
			total,
			category: line.category ?? null,
			order: idx,
		};
	});
}

// ─── Helper : résoudre le client ─────────────────────────────────────────────

async function resolveClient(data: InvoiceFormData, userId: string) {
	if (data.newClient) {
		const existing = await prisma.client.findFirst({
			where: { email: data.newClient.email, userId },
		});
		if (existing) return existing;

		return prisma.client.create({
			data: {
				userId,
				type: "INDIVIDUAL",
				firstName: data.newClient.name.split(" ")[0] ?? data.newClient.name,
				lastName: data.newClient.name.split(" ").slice(1).join(" ") || null,
				email: data.newClient.email,
				address: data.newClient.address,
				city: data.newClient.city,
			},
		});
	}

	if (data.clientId) {
		return prisma.client.findFirst({
			where: { id: data.clientId, userId },
		});
	}

	return null;
}

// ─── Action : prochain numéro de proforma ────────────────────────────────────

export async function getNextProformaNumber() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { proformaPrefix: true, nextProformaNumber: true },
		});

		if (!user) {
			return { success: false, error: "Utilisateur introuvable" } as const;
		}

		const year = new Date().getFullYear();
		const padded = String(user.nextProformaNumber).padStart(4, "0");
		const number = `${user.proformaPrefix}-${year}-${padded}`;

		return { success: true, data: { number } } as const;
	} catch (error) {
		console.error("[getNextProformaNumber] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la récupération du numéro",
		} as const;
	}
}

// ─── Action : sauvegarder un brouillon de proforma ───────────────────────────

export async function saveDraftProforma(
	data: InvoiceFormData,
	draftId?: string,
) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		saveSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Données invalides",
				details: error.issues,
			} as const;
		}
		return { success: false, error: "Erreur de validation" } as const;
	}

	try {
		const client = await resolveClient(data, userId);
		if (!client) {
			return { success: false, error: "Client introuvable" } as const;
		}

		const totals = calcInvoiceTotals({
			lines: data.lines,
			vatRate: data.vatRate as VatRate,
			discountType: data.discountType,
			discountValue: data.discountValue,
		});

		const computedLines = calcLineItems(data.lines, data.vatRate);
		const acceptToken = crypto.randomUUID();

		const docData = {
			clientId: client.id,
			type: "PROFORMA" as const,
			date: new Date(data.date),
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: "DRAFT" as const,
			subtotal: totals.netHT,
			taxTotal: totals.taxTotal,
			total: totals.totalTTC,
			discount: data.discountValue ?? 0,
			depositAmount: data.depositAmount ?? 0,
			discountType: data.discountType ?? null,
			invoiceType: data.invoiceType ?? null,
			notes: data.notes ?? null,
			acceptToken,
			businessMetadata: {
				vatRate: data.vatRate,
			},
		};

		if (draftId) {
			await prisma.$transaction([
				prisma.document.update({ where: { id: draftId }, data: docData }),
				prisma.documentLineItem.deleteMany({ where: { documentId: draftId } }),
				prisma.documentLineItem.createMany({
					data: computedLines.map((line) => ({
						...line,
						documentId: draftId,
					})),
				}),
			]);
			return { success: true, data: { id: draftId } } as const;
		} else {
			const draft = await prisma.document.create({
				data: {
					...docData,
					userId,
					number: `BROUILLON-${Date.now()}`,
					lineItems: { create: computedLines },
				},
				select: { id: true },
			});
			return { success: true, data: { id: draft.id } } as const;
		}
	} catch (error) {
		console.error("[saveDraftProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la sauvegarde du brouillon",
		} as const;
	}
}

// ─── Action : créer une proforma (avec numéro officiel) ──────────────────────

export async function createProforma(
	data: InvoiceFormData,
	draftId?: string,
) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	// Vérifier la limite de documents selon le plan
	const {
		allowed,
		count: docCount,
		max: docMax,
	} = await canCreateDocument(userId);
	if (!allowed) {
		return {
			success: false,
			error: `Limite de ${docMax} documents/mois atteinte (${docCount}/${docMax}). Passez au plan Pro pour continuer.`,
		} as const;
	}

	try {
		saveSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Données invalides",
				details: error.issues,
			} as const;
		}
		return { success: false, error: "Erreur de validation" } as const;
	}

	try {
		const client = await resolveClient(data, userId);
		if (!client) {
			return { success: false, error: "Client introuvable" } as const;
		}

		const totals = calcInvoiceTotals({
			lines: data.lines,
			vatRate: data.vatRate as VatRate,
			discountType: data.discountType,
			discountValue: data.discountValue,
		});

		const computedLines = calcLineItems(data.lines, data.vatRate);

		// Incrémenter le compteur et générer le numéro officiel
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { nextProformaNumber: { increment: 1 } },
			select: { nextProformaNumber: true, proformaPrefix: true },
		});

		const year = new Date().getFullYear();
		const usedNumber = updatedUser.nextProformaNumber - 1;
		const proformaNumber = `${updatedUser.proformaPrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

		const acceptToken = crypto.randomUUID();

		const docData = {
			userId,
			clientId: client.id,
			type: "PROFORMA" as const,
			number: proformaNumber,
			date: new Date(data.date),
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: "DRAFT" as const,
			subtotal: totals.netHT,
			taxTotal: totals.taxTotal,
			total: totals.totalTTC,
			discount: data.discountValue ?? 0,
			depositAmount: data.depositAmount ?? 0,
			discountType: data.discountType ?? null,
			invoiceType: data.invoiceType ?? null,
			notes: data.notes ?? null,
			acceptToken,
			businessMetadata: {
				vatRate: data.vatRate,
			},
		};

		let documentId: string;

		if (draftId) {
			await prisma.document.update({
				where: { id: draftId },
				data: docData,
			});
			await prisma.documentLineItem.deleteMany({
				where: { documentId: draftId },
			});
			await prisma.documentLineItem.createMany({
				data: computedLines.map((line) => ({
					...line,
					documentId: draftId,
				})),
			});
			documentId = draftId;
		} else {
			const doc = await prisma.document.create({
				data: {
					...docData,
					lineItems: { create: computedLines },
				},
				select: { id: true },
			});
			documentId = doc.id;
		}

		revalidatePath("/dashboard/proformas");

		return {
			success: true,
			data: { id: documentId, number: proformaNumber },
		} as const;
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Données invalides",
				details: error.issues,
			} as const;
		}
		console.error("[createProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la création de la proforma",
		} as const;
	}
}

// ─── Action : récupérer la liste des proformas ───────────────────────────────

export async function getProformas() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return {
			success: false,
			error: "Non authentifié",
			data: [],
		} as const;
	}

	try {
		const documents = await prisma.document.findMany({
			where: { userId: session.user.id, type: "PROFORMA" },
			include: proformaInclude,
			orderBy: { createdAt: "desc" },
		});

		const proformas = documents.map((doc) =>
			mapToSavedProforma(doc as unknown as PrismaProformaWithRelations),
		);

		return { success: true, data: proformas } as const;
	} catch (error) {
		console.error("[getProformas] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la récupération des proformas",
			data: [],
		} as const;
	}
}

// ─── Action : récupérer une proforma par ID ──────────────────────────────────

export async function getProforma(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié", data: null } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "PROFORMA" },
			include: proformaInclude,
		});

		if (!doc) {
			return {
				success: false,
				error: "Proforma introuvable",
				data: null,
			} as const;
		}

		return {
			success: true,
			data: mapToSavedProforma(doc as unknown as PrismaProformaWithRelations),
		} as const;
	} catch (error) {
		console.error("[getProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la récupération de la proforma",
			data: null,
		} as const;
	}
}

// ─── Action : mettre à jour une proforma ─────────────────────────────────────

export async function updateProforma(id: string, data: InvoiceFormData) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		const existing = await prisma.document.findFirst({
			where: { id, userId, type: "PROFORMA" },
			select: { id: true },
		});

		if (!existing) {
			return { success: false, error: "Proforma introuvable" } as const;
		}

		const client = await resolveClient(data, userId);
		if (!client) {
			return { success: false, error: "Client introuvable" } as const;
		}

		const totals = calcInvoiceTotals({
			lines: data.lines,
			vatRate: data.vatRate as VatRate,
			discountType: data.discountType,
			discountValue: data.discountValue,
		});

		const computedLines = calcLineItems(data.lines, data.vatRate);

		await prisma.$transaction([
			prisma.document.update({
				where: { id },
				data: {
					clientId: client.id,
					date: new Date(data.date),
					dueDate: data.dueDate ? new Date(data.dueDate) : null,
					subtotal: totals.netHT,
					taxTotal: totals.taxTotal,
					total: totals.totalTTC,
					discount: data.discountValue ?? 0,
					depositAmount: data.depositAmount ?? 0,
					discountType: data.discountType ?? null,
					invoiceType: data.invoiceType ?? null,
					notes: data.notes ?? null,
					businessMetadata: { vatRate: data.vatRate },
				},
			}),
			prisma.documentLineItem.deleteMany({ where: { documentId: id } }),
			prisma.documentLineItem.createMany({
				data: computedLines.map((line) => ({ ...line, documentId: id })),
			}),
		]);

		revalidatePath("/dashboard/proformas");
		return { success: true, data: { id } } as const;
	} catch (error) {
		console.error("[updateProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la mise à jour de la proforma",
		} as const;
	}
}

// ─── Action : supprimer une proforma ─────────────────────────────────────────

export async function deleteProforma(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		await prisma.document.deleteMany({
			where: { id, userId: session.user.id, type: "PROFORMA" },
		});

		revalidatePath("/dashboard/proformas");
		return { success: true } as const;
	} catch (error) {
		console.error("[deleteProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la suppression de la proforma",
		} as const;
	}
}

// ─── Action : marquer une proforma comme "Envoyée" ───────────────────────────

export async function sendProforma(proformaId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const proforma = await prisma.document.findFirst({
			where: { id: proformaId, userId: session.user.id, type: "PROFORMA" },
			select: { id: true, status: true },
		});

		if (!proforma) {
			return { success: false, error: "Proforma introuvable" } as const;
		}

		if (proforma.status !== "DRAFT") {
			return {
				success: false,
				error: "Seul un brouillon peut être envoyé",
			} as const;
		}

		await prisma.document.update({
			where: { id: proforma.id },
			data: { status: "SENT" },
		});

		revalidatePath("/dashboard/proformas");
		return { success: true } as const;
	} catch (error) {
		console.error("[sendProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de l'envoi de la proforma",
		} as const;
	}
}

// ─── Action : changer le statut d'une proforma ───────────────────────────────

const PROFORMA_TRANSITIONS: Record<string, string[]> = {
	DRAFT: ["SENT"],
	SENT: ["ACCEPTED", "DRAFT"],
	ACCEPTED: [],
};

export async function updateProformaStatus(id: string, newStatus: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "PROFORMA" },
			select: { status: true },
		});

		if (!doc) {
			return { success: false, error: "Proforma introuvable" } as const;
		}

		const allowed = PROFORMA_TRANSITIONS[doc.status] ?? [];
		if (!allowed.includes(newStatus)) {
			return {
				success: false,
				error: `Transition non autorisée : ${doc.status} → ${newStatus}`,
			} as const;
		}

		await prisma.document.update({
			where: { id },
			data: {
				status: newStatus as "DRAFT" | "SENT" | "ACCEPTED",
				respondedAt: newStatus === "ACCEPTED" ? new Date() : undefined,
			},
		});

		revalidatePath("/dashboard/proformas");
		return { success: true } as const;
	} catch (error) {
		console.error("[updateProformaStatus] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors du changement de statut",
		} as const;
	}
}

// ─── Action : dupliquer une proforma ─────────────────────────────────────────

export async function duplicateProforma(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		const original = await prisma.document.findFirst({
			where: { id, userId, type: "PROFORMA" },
			include: { lineItems: { orderBy: { order: "asc" } } },
		});

		if (!original) {
			return { success: false, error: "Proforma introuvable" } as const;
		}

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { nextProformaNumber: { increment: 1 } },
			select: { nextProformaNumber: true, proformaPrefix: true },
		});

		const year = new Date().getFullYear();
		const usedNumber = updatedUser.nextProformaNumber - 1;
		const newNumber = `${updatedUser.proformaPrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

		// Nouveaux tokens pour le duplicata
		const acceptToken = crypto.randomUUID();

		const newDoc = await prisma.document.create({
			data: {
				userId,
				clientId: original.clientId,
				type: "PROFORMA",
				number: newNumber,
				date: new Date(),
				dueDate: original.dueDate,
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
				businessMetadata: original.businessMetadata ?? undefined,
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

		revalidatePath("/dashboard/proformas");
		return {
			success: true,
			data: { id: newDoc.id, number: newDoc.number },
		} as const;
	} catch (error) {
		console.error("[duplicateProforma] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la duplication de la proforma",
		} as const;
	}
}

// ─── Action : convertir une proforma en facture ──────────────────────────────

export async function convertProformaToInvoice(proformaId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		// 1. Récupérer la proforma complète
		const proforma = await prisma.document.findFirst({
			where: { id: proformaId, userId, type: "PROFORMA" },
			include: {
				lineItems: { orderBy: { order: "asc" } },
				client: { select: { id: true } },
			},
		});

		if (!proforma) {
			return { success: false, error: "Proforma introuvable" } as const;
		}

		// Vérifier qu'elle n'est pas déjà convertie
		const existingMeta =
			proforma.businessMetadata != null
				? (proforma.businessMetadata as Record<string, unknown>)
				: {};
		if (existingMeta.convertedInvoiceId) {
			return {
				success: false,
				error: "Cette proforma a déjà été convertie en facture",
			} as const;
		}

		// 2. Incrémenter le compteur de factures et générer le numéro
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { nextInvoiceNumber: { increment: 1 } },
			select: { nextInvoiceNumber: true, invoicePrefix: true },
		});

		const year = new Date().getFullYear();
		const usedNumber = updatedUser.nextInvoiceNumber - 1;
		const invoiceNumber = `${updatedUser.invoicePrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

		// 3. Créer la vraie facture avec toutes les lignes copiées
		const newInvoice = await prisma.document.create({
			data: {
				userId,
				clientId: proforma.clientId,
				type: "INVOICE",
				number: invoiceNumber,
				date: new Date(),
				dueDate: proforma.dueDate,
				status: "DRAFT",
				subtotal: proforma.subtotal,
				taxTotal: proforma.taxTotal,
				total: proforma.total,
				discount: proforma.discount,
				depositAmount: proforma.depositAmount,
				discountType: proforma.discountType,
				invoiceType: proforma.invoiceType,
				notes: proforma.notes,
				businessMetadata: proforma.businessMetadata ?? undefined,
				lineItems: {
					create: proforma.lineItems.map((li) => ({
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

		// 4. Marquer la proforma comme ACCEPTED et stocker la référence facture
		await prisma.document.update({
			where: { id: proformaId },
			data: {
				status: "ACCEPTED",
				respondedAt: new Date(),
				businessMetadata: {
					...(existingMeta as Record<string, unknown>),
					convertedInvoiceId: newInvoice.id,
					convertedInvoiceNumber: newInvoice.number,
				},
			},
		});

		revalidatePath("/dashboard/proformas");
		revalidatePath("/dashboard/invoices");

		return {
			success: true,
			data: { invoiceId: newInvoice.id, invoiceNumber: newInvoice.number },
		} as const;
	} catch (error) {
		console.error("[convertProformaToInvoice] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la conversion en facture",
		} as const;
	}
}
