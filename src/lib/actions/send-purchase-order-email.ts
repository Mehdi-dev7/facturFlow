"use server";

// Server action : envoie le bon de commande par email via Resend
// Pas de liens accept/refus — le BC est un document informatif envoyé au client.

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base";
import PurchaseOrderPdfDocument from "@/lib/pdf/purchase-order-pdf-document";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmitterFallback {
	companyName?: string;
	companySiret?: string;
	companyAddress?: string;
	companyPostalCode?: string;
	companyCity?: string;
	companyEmail?: string;
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function sendPurchaseOrderEmail(
	purchaseOrderId: string,
	emitterFallback?: EmitterFallback,
) {
	// 1. Vérifier la session
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" };
	}

	try {
		// 2. Récupérer le BC depuis la DB avec toutes ses relations
		const doc = await prisma.document.findFirst({
			where: { id: purchaseOrderId, userId: session.user.id, type: "PURCHASE_ORDER" },
			include: {
				lineItems: { orderBy: { order: "asc" } },
				client: true,
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
					},
				},
			},
		});

		if (!doc) {
			return { success: false, error: "Bon de commande introuvable" };
		}

		// 3. Préparer les données d'affichage
		const clientName =
			doc.client.companyName ||
			[doc.client.firstName, doc.client.lastName].filter(Boolean).join(" ") ||
			doc.client.email;

		const emitterName =
			doc.user.companyName || emitterFallback?.companyName || "FacturNow";

		const amount = doc.total.toNumber().toLocaleString("fr-FR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

		// Date de livraison souhaitée (stockée dans validUntil)
		const deliveryDate = doc.validUntil
			? new Date(doc.validUntil).toLocaleDateString("fr-FR", {
					day: "2-digit",
					month: "long",
					year: "numeric",
				})
			: null;

		// Référence BC interne (stockée dans businessMetadata)
		const meta = doc.businessMetadata as Record<string, unknown> | null;
		const bcReference = typeof meta?.bcReference === "string" ? meta.bcReference : null;

		// 4. Construire le tableau des lignes pour l'email
		const linesHtml = doc.lineItems
			.map(
				(li) => `
				<tr>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px; word-break: break-word;">
						${li.description}
					</td>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-size: 14px; white-space: nowrap;">
						${li.quantity.toNumber()}
					</td>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 14px; white-space: nowrap;">
						${li.unitPrice.toNumber().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
					</td>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155; font-size: 14px; white-space: nowrap;">
						${li.total.toNumber().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
					</td>
				</tr>`,
			)
			.join("");

		// 5. Construire l'objet compatible avec PurchaseOrderPdfDocument
		// Le type du PDF attend quelques champs supplémentaires vs SavedPurchaseOrder (actions)
		const purchaseOrderForPdf = {
			id: doc.id,
			number: doc.number,
			status: doc.status,
			date: doc.date.toISOString(),
			deliveryDate: doc.validUntil?.toISOString() ?? null,
			bcReference,
			subtotal: doc.subtotal.toNumber(),
			taxTotal: doc.taxTotal.toNumber(),
			total: doc.total.toNumber(),
			discount: doc.discount?.toNumber() ?? null,
			notes: doc.notes,
			invoiceType: doc.invoiceType,
			businessMetadata: meta,
			relatedDocumentId: doc.relatedDocumentId ?? null,
			createdAt: doc.createdAt.toISOString(),
			updatedAt: doc.updatedAt.toISOString(),
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
			client: {
				id: doc.client.id,
				companyName: doc.client.companyName,
				firstName: doc.client.firstName,
				lastName: doc.client.lastName,
				email: doc.client.email,
				address: doc.client.address,
				city: doc.client.city,
				postalCode: doc.client.postalCode,
				country: doc.client.country ?? null,
				siret: doc.client.companySiret ?? null,
			},
			user: {
				companyName: doc.user.companyName || emitterFallback?.companyName || null,
				companySiret: doc.user.companySiret || emitterFallback?.companySiret || null,
				companyAddress: doc.user.companyAddress || emitterFallback?.companyAddress || null,
				companyPostalCode:
					doc.user.companyPostalCode || emitterFallback?.companyPostalCode || null,
				companyCity: doc.user.companyCity || emitterFallback?.companyCity || null,
				companyEmail: doc.user.companyEmail || emitterFallback?.companyEmail || null,
				companyPhone: doc.user.companyPhone ?? null,
				themeColor: doc.user.themeColor ?? null,
				companyFont: doc.user.companyFont ?? null,
				companyLogo: doc.user.companyLogo ?? null,
				invoiceFooter: doc.user.invoiceFooter ?? null,
			},
		};

		// 6. Générer le PDF en buffer pour pièce jointe
		const pdfBuffer = await renderToBuffer(
			PurchaseOrderPdfDocument({ purchaseOrder: purchaseOrderForPdf }),
		);

		// 7. Construire et envoyer l'email via Resend
		const { error } = await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL ?? `${emitterName} <noreply@facturnow.fr>`,
			to: [doc.client.email],
			subject: `Bon de commande ${doc.number} — ${emitterName}`,
			html: wrapEmail(`
				${emailHeader("linear-gradient(135deg, #0d9488, #0891b2)", "", `Bon de commande ${doc.number}`)}

				<p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>
				<p style="color:#334155;font-size:15px;line-height:1.6;">
					Veuillez trouver ci-joint le bon de commande <strong>n°${doc.number}</strong>
					d'un montant total de <strong>${amount} €</strong>.
				</p>

				<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin:20px 0;">
					<table style="width:100%;font-size:14px;color:#475569;">
						<tr>
							<td style="padding:4px 0;">Montant TTC</td>
							<td style="padding:4px 0;text-align:right;font-weight:600;color:#0d9488;">${amount} €</td>
						</tr>
						${
							bcReference
								? `<tr>
							<td style="padding:4px 0;">Votre référence</td>
							<td style="padding:4px 0;text-align:right;font-weight:600;">${bcReference}</td>
						</tr>`
								: ""
						}
						${
							deliveryDate
								? `<tr>
							<td style="padding:4px 0;">Livraison souhaitée</td>
							<td style="padding:4px 0;text-align:right;font-weight:600;">${deliveryDate}</td>
						</tr>`
								: ""
						}
					</table>
				</div>

				<table style="width:100%;border-collapse:collapse;margin:20px 0;">
					<thead>
						<tr style="background:#f1f5f9;">
							<th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Description</th>
							<th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Qté</th>
							<th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">P.U.</th>
							<th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Total</th>
						</tr>
					</thead>
					<tbody>${linesHtml}</tbody>
				</table>

				<p style="color:#334155;font-size:15px;line-height:1.6;">
					Le PDF de ce bon de commande est joint à cet email.
					N'hésitez pas à nous contacter pour toute question.
				</p>
				<p style="color:#334155;font-size:15px;line-height:1.6;">
					Bien cordialement,<br/><strong>${emitterName}</strong>
				</p>

				${EMAIL_FOOTER}
			`),
			attachments: [
				{
					filename: `BC-${doc.number}.pdf`,
					content: pdfBuffer,
				},
			],
		});

		if (error) {
			console.error("[sendPurchaseOrderEmail] Resend error:", error);
			return { success: false, error: "Erreur d'envoi : " + error.message };
		}

		// 8. Passer le statut à SENT après envoi réussi (si le BC est encore en DRAFT)
		if (doc.status === "DRAFT") {
			await prisma.document.update({
				where: { id: purchaseOrderId },
				data: { status: "SENT" },
			});
			revalidatePath("/dashboard/purchase-orders");
		}

		return { success: true };
	} catch (err) {
		console.error("[sendPurchaseOrderEmail] Exception:", err);
		return { success: false, error: "Erreur lors de l'envoi de l'email" };
	}
}
