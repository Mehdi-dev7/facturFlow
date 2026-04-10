"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";
import type { PurchaseOrderFormData, VatRate } from "@/lib/validations/purchase-order";
import { canCreateDocument } from "@/lib/feature-gate";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

// ─── Type exporté (utilisé par les hooks et les modals) ─────────────────────

export interface SavedPurchaseOrder {
	id: string;
	number: string;
	status: string;
	updatedAt: string;
	date: string;
	// Date de livraison souhaitée (optionnelle — remplace validUntil des devis)
	deliveryDate: string | null;
	invoiceType: string | null;
	discountType: string | null;
	subtotal: number;
	taxTotal: number;
	total: number;
	discount: number | null;
	notes: string | null;
	// Référence interne BC côté client
	bcReference: string | null;
	businessMetadata: Record<string, unknown> | null;
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
		themeColor: string | null;
		companyFont: string | null;
		companyLogo: string | null;
		invoiceFooter: string | null;
		currency: string | null;
	};
}

// ─── Prisma include & mapper ────────────────────────────────────────────────

const purchaseOrderInclude = {
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
			invoiceFooter: true,
			currency: true,
		},
	},
} as const;

// Type intermédiaire pour le mapping Prisma → SavedPurchaseOrder
type PrismaPurchaseOrderWithRelations = {
	updatedAt: Date;
	id: string;
	number: string;
	status: string;
	date: Date;
	// validUntil est réutilisé en DB pour stocker deliveryDate
	validUntil: Date | null;
	invoiceType: string | null;
	discountType: string | null;
	subtotal: { toNumber: () => number };
	taxTotal: { toNumber: () => number };
	total: { toNumber: () => number };
	discount: { toNumber: () => number } | null;
	notes: string | null;
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
	client: SavedPurchaseOrder["client"];
	user: SavedPurchaseOrder["user"];
};

// Convertit un document Prisma brut en SavedPurchaseOrder typé
function mapToSavedPurchaseOrder(doc: PrismaPurchaseOrderWithRelations): SavedPurchaseOrder {
	// bcReference est stocké dans businessMetadata pour éviter une migration DB
	const meta =
		doc.businessMetadata != null ? (doc.businessMetadata as Record<string, unknown>) : null;

	return {
		id: doc.id,
		number: doc.number,
		status: doc.status,
		updatedAt: doc.updatedAt.toISOString(),
		date: doc.date.toISOString(),
		// validUntil DB = deliveryDate BC
		deliveryDate: doc.validUntil?.toISOString() ?? null,
		invoiceType: doc.invoiceType,
		discountType: doc.discountType,
		subtotal: doc.subtotal.toNumber(),
		taxTotal: doc.taxTotal.toNumber(),
		total: doc.total.toNumber(),
		discount: doc.discount ? doc.discount.toNumber() : null,
		notes: doc.notes,
		bcReference: typeof meta?.bcReference === "string" ? meta.bcReference : null,
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
	};
}

// ─── Schéma de validation local (côté serveur) ─────────────────────────────

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
		deliveryDate: z.string().optional(),
		bcReference: z.string().optional(),
		orderType: z.string().optional(),
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
		vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
		discountType: z.enum(["pourcentage", "montant"]).optional(),
		discountValue: z.number().min(0).optional(),
		notes: z.string().optional(),
	})
	.refine((d) => d.clientId || d.newClient, {
		message: "Veuillez sélectionner ou créer un client",
		path: ["clientId"],
	});

// ─── Helper : calcul des lignes ─────────────────────────────────────────────

function calcLineItems(lines: PurchaseOrderFormData["lines"], vatRate: number) {
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

// ─── Helper : résoudre le client ────────────────────────────────────────────

async function resolveClient(data: PurchaseOrderFormData, userId: string) {
	if (data.newClient) {
		// Chercher un client existant par email pour éviter les doublons
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

// ─── Action : prochain numéro de bon de commande ────────────────────────────

export async function getNextPurchaseOrderNumber() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { purchaseOrderPrefix: true, nextPurchaseOrderNumber: true },
		});

		if (!user) {
			return { success: false, error: "Utilisateur introuvable" } as const;
		}

		const year = new Date().getFullYear();
		const padded = String(user.nextPurchaseOrderNumber).padStart(4, "0");
		const number = `${user.purchaseOrderPrefix}-${year}-${padded}`;

		return { success: true, data: { number } } as const;
	} catch (error) {
		console.error("[getNextPurchaseOrderNumber] Erreur:", error);
		return { success: false, error: "Erreur lors de la récupération du numéro" } as const;
	}
}

// ─── Action : sauvegarder un brouillon de BC ────────────────────────────────

export async function saveDraftPurchaseOrder(data: PurchaseOrderFormData, draftId?: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	// Validation côté serveur
	try {
		saveSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: "Données invalides", details: error.issues } as const;
		}
		return { success: false, error: "Erreur de validation" } as const;
	}

	try {
		const client = await resolveClient(data, userId);
		if (!client) {
			return { success: false, error: "Client introuvable" } as const;
		}

		// Calcul des totaux — pas d'acompte sur les BC
		const totals = calcInvoiceTotals({
			lines: data.lines,
			vatRate: data.vatRate as VatRate,
			discountType: data.discountType,
			discountValue: data.discountValue,
		});

		const computedLines = calcLineItems(data.lines, data.vatRate);

		const docData = {
			clientId: client.id,
			type: "PURCHASE_ORDER" as const,
			date: new Date(data.date),
			// validUntil réutilisé comme deliveryDate pour éviter une migration
			validUntil: data.deliveryDate ? new Date(data.deliveryDate) : null,
			status: "DRAFT" as const,
			subtotal: totals.netHT,
			taxTotal: totals.taxTotal,
			total: totals.totalTTC,
			discount: data.discountValue ?? 0,
			discountType: data.discountType ?? null,
			invoiceType: data.orderType ?? null,
			notes: data.notes ?? null,
			// bcReference stockée dans businessMetadata (pas de colonne dédiée)
			businessMetadata: {
				vatRate: data.vatRate,
				bcReference: data.bcReference ?? null,
			},
		};

		if (draftId) {
			// Mise à jour du brouillon existant
			await prisma.$transaction([
				prisma.document.update({ where: { id: draftId }, data: docData }),
				prisma.documentLineItem.deleteMany({ where: { documentId: draftId } }),
				prisma.documentLineItem.createMany({
					data: computedLines.map((line) => ({ ...line, documentId: draftId })),
				}),
			]);

			return { success: true, data: { id: draftId } } as const;
		}

		// Nouveau brouillon avec numéro temporaire
		const draft = await prisma.document.create({
			data: {
				...docData,
				userId,
				number: `BROUILLON-BC-${Date.now()}`,
				lineItems: { create: computedLines },
			},
			select: { id: true },
		});

		return { success: true, data: { id: draft.id } } as const;
	} catch (error) {
		console.error("[saveDraftPurchaseOrder] Erreur:", error);
		return { success: false, error: "Erreur lors de la sauvegarde du brouillon" } as const;
	}
}

// ─── Action : créer un BC (avec numéro officiel) ────────────────────────────

export async function createPurchaseOrder(data: PurchaseOrderFormData, draftId?: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	// Vérifier la limite de documents selon le plan (FREE = 10/mois)
	const { allowed, count: docCount, max: docMax } = await canCreateDocument(userId);
	if (!allowed) {
		return {
			success: false,
			error: `Limite de ${docMax} documents/mois atteinte (${docCount}/${docMax}). Passez au plan Pro pour continuer.`,
		} as const;
	}

	// Validation côté serveur
	try {
		saveSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: "Données invalides", details: error.issues } as const;
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

		// ── Numérotation : custom ou auto-généré ────────────────────────────────
		let bcNumber: string;
		const customNum = data.customNumber?.trim();

		if (customNum) {
			const duplicate = await prisma.document.findFirst({
				where: { userId, number: customNum },
			});
			if (duplicate) {
				return { success: false, error: `Le numéro "${customNum}" est déjà utilisé par un autre document.` } as const;
			}
			bcNumber = customNum;
		} else {
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { nextPurchaseOrderNumber: { increment: 1 } },
				select: { nextPurchaseOrderNumber: true, purchaseOrderPrefix: true },
			});
			const year = new Date().getFullYear();
			const usedNumber = updatedUser.nextPurchaseOrderNumber - 1;
			bcNumber = `${updatedUser.purchaseOrderPrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;
		}

		const docData = {
			userId,
			clientId: client.id,
			type: "PURCHASE_ORDER" as const,
			number: bcNumber,
			date: new Date(data.date),
			validUntil: data.deliveryDate ? new Date(data.deliveryDate) : null,
			status: "DRAFT" as const,
			subtotal: totals.netHT,
			taxTotal: totals.taxTotal,
			total: totals.totalTTC,
			discount: data.discountValue ?? 0,
			discountType: data.discountType ?? null,
			invoiceType: data.orderType ?? null,
			notes: data.notes ?? null,
			businessMetadata: {
				vatRate: data.vatRate,
				bcReference: data.bcReference ?? null,
			},
		};

		let documentId: string;

		if (draftId) {
			// Promouvoir le brouillon existant en BC officiel
			await prisma.document.update({ where: { id: draftId }, data: docData });
			await prisma.documentLineItem.deleteMany({ where: { documentId: draftId } });
			await prisma.documentLineItem.createMany({
				data: computedLines.map((line) => ({ ...line, documentId: draftId })),
			});
			documentId = draftId;
		} else {
			const doc = await prisma.document.create({
				data: { ...docData, lineItems: { create: computedLines } },
				select: { id: true },
			});
			documentId = doc.id;
		}

		revalidatePath("/dashboard/purchase-orders");

		return { success: true, data: { id: documentId, number: bcNumber } } as const;
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: "Données invalides", details: error.issues } as const;
		}
		console.error("[createPurchaseOrder] Erreur:", error);
		return { success: false, error: "Erreur lors de la création du bon de commande" } as const;
	}
}

// ─── Action : récupérer la liste des BC ─────────────────────────────────────

export async function getPurchaseOrders(filters?: { month?: string }) {
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
				type: "PURCHASE_ORDER",
				...(dateFilter ? { date: dateFilter } : {}),
			},
			include: purchaseOrderInclude,
			orderBy: { createdAt: "desc" },
		});

		const orders = documents.map((doc) =>
			mapToSavedPurchaseOrder(doc as unknown as PrismaPurchaseOrderWithRelations),
		);

		return { success: true, data: orders } as const;
	} catch (error) {
		console.error("[getPurchaseOrders] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la récupération des bons de commande",
			data: [],
		} as const;
	}
}

// ─── Action : récupérer un BC par ID ────────────────────────────────────────

export async function getPurchaseOrder(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié", data: null } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "PURCHASE_ORDER" },
			include: purchaseOrderInclude,
		});

		if (!doc) {
			return { success: false, error: "Bon de commande introuvable", data: null } as const;
		}

		return {
			success: true,
			data: mapToSavedPurchaseOrder(doc as unknown as PrismaPurchaseOrderWithRelations),
		} as const;
	} catch (error) {
		console.error("[getPurchaseOrder] Erreur:", error);
		return {
			success: false,
			error: "Erreur lors de la récupération du bon de commande",
			data: null,
		} as const;
	}
}

// ─── Transitions de statut autorisées ───────────────────────────────────────
//
// DRAFT  → SENT
// SENT   → ACCEPTED | CANCELLED
// ACCEPTED → INVOICED (géré par createInvoiceFromPurchaseOrder)
// CANCELLED → SENT (réouverture manuelle)

const PURCHASE_ORDER_TRANSITIONS: Record<string, string[]> = {
	DRAFT: ["SENT"],
	SENT: ["ACCEPTED", "CANCELLED"],
	ACCEPTED: ["SENT"],
	CANCELLED: ["SENT"],
};

// ─── Action : changer le statut d'un BC ─────────────────────────────────────

export async function updatePurchaseOrderStatus(id: string, newStatus: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		const doc = await prisma.document.findFirst({
			where: { id, userId: session.user.id, type: "PURCHASE_ORDER" },
			select: { status: true },
		});

		if (!doc) {
			return { success: false, error: "Bon de commande introuvable" } as const;
		}

		// Vérifier que la transition est autorisée
		const allowed = PURCHASE_ORDER_TRANSITIONS[doc.status] ?? [];
		if (!allowed.includes(newStatus)) {
			return {
				success: false,
				error: `Transition non autorisée : ${doc.status} → ${newStatus}`,
			} as const;
		}

		await prisma.document.update({
			where: { id },
			data: {
				status: newStatus as
					| "DRAFT"
					| "SENT"
					| "ACCEPTED"
					| "REJECTED"
					| "CANCELLED"
					| "PAID",
			},
		});

		revalidatePath("/dashboard/purchase-orders");

		return { success: true } as const;
	} catch (error) {
		console.error("[updatePurchaseOrderStatus] Erreur:", error);
		return { success: false, error: "Erreur lors du changement de statut" } as const;
	}
}

// ─── Action : mettre à jour un BC ───────────────────────────────────────────

export async function updatePurchaseOrder(id: string, data: PurchaseOrderFormData) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		// Vérifier ownership
		const existing = await prisma.document.findFirst({
			where: { id, userId, type: "PURCHASE_ORDER" },
			select: { id: true, number: true },
		});

		if (!existing) {
			return { success: false, error: "Bon de commande introuvable" } as const;
		}

		// Vérifier si le numéro personnalisé est unique (si changé)
		const newNumber = data.customNumber?.trim();
		if (newNumber && newNumber !== existing.number) {
			const duplicate = await prisma.document.findFirst({
				where: { userId, number: newNumber, id: { not: id } },
			});
			if (duplicate) {
				return { success: false, error: `Le numéro "${newNumber}" est déjà utilisé par un autre document.` } as const;
			}
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

		// Mise à jour dans une transaction : update doc + delete+recreate lignes
		await prisma.$transaction([
			prisma.document.update({
				where: { id },
				data: {
					// Mettre à jour le numéro si l'user l'a modifié
					...(newNumber && newNumber !== existing.number ? { number: newNumber } : {}),
					clientId: client.id,
					date: new Date(data.date),
					validUntil: data.deliveryDate ? new Date(data.deliveryDate) : null,
					subtotal: totals.netHT,
					taxTotal: totals.taxTotal,
					total: totals.totalTTC,
					discount: data.discountValue ?? 0,
					discountType: data.discountType ?? null,
					invoiceType: data.orderType ?? null,
					notes: data.notes ?? null,
					businessMetadata: {
						vatRate: data.vatRate,
						bcReference: data.bcReference ?? null,
					},
				},
			}),
			prisma.documentLineItem.deleteMany({ where: { documentId: id } }),
			prisma.documentLineItem.createMany({
				data: computedLines.map((line) => ({ ...line, documentId: id })),
			}),
		]);

		revalidatePath("/dashboard/purchase-orders");
		return { success: true, data: { id } } as const;
	} catch (error) {
		console.error("[updatePurchaseOrder] Erreur:", error);
		return { success: false, error: "Erreur lors de la mise à jour du bon de commande" } as const;
	}
}

// ─── Action : supprimer un BC ────────────────────────────────────────────────

export async function deletePurchaseOrder(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	try {
		await prisma.document.deleteMany({
			where: { id, userId: session.user.id, type: "PURCHASE_ORDER" },
		});

		revalidatePath("/dashboard/purchase-orders");

		return { success: true } as const;
	} catch (error) {
		console.error("[deletePurchaseOrder] Erreur:", error);
		return { success: false, error: "Erreur lors de la suppression du bon de commande" } as const;
	}
}

// ─── Action : dupliquer un BC ───────────────────────────────────────────────

export async function duplicatePurchaseOrder(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	try {
		const original = await prisma.document.findFirst({
			where: { id, userId, type: "PURCHASE_ORDER" },
			include: { lineItems: { orderBy: { order: "asc" } } },
		});

		if (!original) {
			return { success: false, error: "Bon de commande introuvable" } as const;
		}

		// Incrémenter le compteur et générer un nouveau numéro
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { nextPurchaseOrderNumber: { increment: 1 } },
			select: { nextPurchaseOrderNumber: true, purchaseOrderPrefix: true },
		});

		const year = new Date().getFullYear();
		const usedNumber = updatedUser.nextPurchaseOrderNumber - 1;
		const newNumber = `${updatedUser.purchaseOrderPrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

		// Créer le duplicata en DRAFT (pas de tokens — les BC n'en ont pas)
		const newDoc = await prisma.document.create({
			data: {
				userId,
				clientId: original.clientId,
				type: "PURCHASE_ORDER",
				number: newNumber,
				date: new Date(),
				validUntil: original.validUntil,
				status: "DRAFT",
				subtotal: original.subtotal,
				taxTotal: original.taxTotal,
				total: original.total,
				discount: original.discount,
				discountType: original.discountType,
				invoiceType: original.invoiceType,
				notes: original.notes,
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

		revalidatePath("/dashboard/purchase-orders");

		return { success: true, data: { id: newDoc.id, number: newDoc.number } } as const;
	} catch (error) {
		console.error("[duplicatePurchaseOrder] Erreur:", error);
		return { success: false, error: "Erreur lors de la duplication du bon de commande" } as const;
	}
}

// ─── Action : créer une facture depuis un BC (ACCEPTED requis) ───────────────

export async function createInvoiceFromPurchaseOrder(purchaseOrderId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" } as const;
	}

	const userId = session.user.id;

	// Vérifier la limite de documents
	const { allowed, count: docCount, max: docMax } = await canCreateDocument(userId);
	if (!allowed) {
		return {
			success: false,
			error: `Limite de ${docMax} documents/mois atteinte (${docCount}/${docMax}). Passez au plan Pro pour continuer.`,
		} as const;
	}

	try {
		const bc = await prisma.document.findFirst({
			where: { id: purchaseOrderId, userId, type: "PURCHASE_ORDER" },
			include: { lineItems: { orderBy: { order: "asc" } } },
		});

		if (!bc) {
			return { success: false, error: "Bon de commande introuvable" } as const;
		}

		// Générer le numéro de facture
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { nextInvoiceNumber: { increment: 1 } },
			select: { nextInvoiceNumber: true, invoicePrefix: true },
		});

		const year = new Date().getFullYear();
		const usedNumber = updatedUser.nextInvoiceNumber - 1;
		const invoiceNumber = `${updatedUser.invoicePrefix}-${year}-${String(usedNumber).padStart(4, "0")}`;

		// Date = aujourd'hui, échéance = +30 jours
		const today = new Date();
		const dueDate = new Date(today);
		dueDate.setDate(dueDate.getDate() + 30);

		// Récupérer les providers actifs pour les boutons de paiement
		const paymentAccounts = await prisma.paymentAccount.findMany({
			where: { userId, isActive: true },
			select: { provider: true },
		});
		const activeProviders = new Set(paymentAccounts.map((a) => a.provider));
		const paymentLinks = {
			stripe: activeProviders.has("STRIPE"),
			paypal: activeProviders.has("PAYPAL"),
			gocardless: activeProviders.has("GOCARDLESS"),
		};

		// Metadata du BC source + référence BC dans la facture
		const bcMetadata = (bc.businessMetadata ?? {}) as Record<string, unknown>;

		const newDoc = await prisma.document.create({
			data: {
				userId,
				clientId: bc.clientId,
				type: "INVOICE",
				number: invoiceNumber,
				date: today,
				dueDate,
				status: "DRAFT",
				subtotal: bc.subtotal,
				taxTotal: bc.taxTotal,
				total: bc.total,
				discount: bc.discount,
				discountType: bc.discountType,
				invoiceType: bc.invoiceType,
				notes: bc.notes,
				businessMetadata: {
					...bcMetadata,
					// Référence au BC source (traçabilité)
					fromPurchaseOrderId: bc.id,
					fromPurchaseOrderNumber: bc.number,
					// Providers connectés au moment de la conversion
					paymentLinks,
				},
				lineItems: {
					create: bc.lineItems.map((li) => ({
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

		// Marquer le BC comme INVOICED (statut personnalisé dans le champ status)
		await prisma.document.update({
			where: { id: purchaseOrderId },
			data: { status: "PAID" }, // On réutilise PAID pour signifier "transformé en facture"
		});

		revalidatePath("/dashboard/invoices");
		revalidatePath("/dashboard/purchase-orders");

		// Webhook déclenché pour les intégrations tierces
		dispatchWebhook(userId, "invoice.created", {
			id: newDoc.id,
			number: invoiceNumber,
			total: bc.total.toNumber(),
			clientId: bc.clientId,
			fromPurchaseOrderId: purchaseOrderId,
		}).catch(() => {});

		return { success: true, data: { id: newDoc.id, number: newDoc.number } } as const;
	} catch (error) {
		console.error("[createInvoiceFromPurchaseOrder] Erreur:", error);
		return { success: false, error: "Erreur lors de la création de la facture" } as const;
	}
}
