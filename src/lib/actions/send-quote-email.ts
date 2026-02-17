"use server";

// Server action : envoie le devis par email avec liens d'acceptation/refus via Resend

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

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

export async function sendQuoteEmail(
	quoteId: string,
	emitterFallback?: EmitterFallback,
) {
	// 1. Vérifier la session
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" };
	}

	try {
		// 2. Récupérer le devis depuis la DB
		const doc = await prisma.document.findFirst({
			where: { id: quoteId, userId: session.user.id, type: "QUOTE" },
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
					},
				},
			},
		});

		if (!doc) {
			return { success: false, error: "Devis introuvable" };
		}

		// 3. Construire les URLs d'acceptation/refus
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
		const acceptUrl = `${baseUrl}/api/public/devis/accept/${doc.acceptToken}`;
		const refuseUrl = `${baseUrl}/api/public/devis/refuse/${doc.refuseToken}`;

		// 4. Préparer les données pour l'email
		const clientName =
			(doc.client.companyName ??
			[doc.client.firstName, doc.client.lastName].filter(Boolean).join(" ")) ||
			doc.client.email;

		const amount = doc.total.toNumber().toLocaleString("fr-FR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

		const validUntil = doc.validUntil
			? new Date(doc.validUntil).toLocaleDateString("fr-FR", {
					day: "2-digit",
					month: "long",
					year: "numeric",
				})
			: "—";

		const emitterName =
			doc.user.companyName || emitterFallback?.companyName || "FacturFlow";

		// 5. Construire les lignes du devis pour l'email
		const linesHtml = doc.lineItems
			.map(
				(li) => `
				<tr>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">
						${li.description}
					</td>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-size: 14px;">
						${li.quantity.toNumber()}
					</td>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 14px;">
						${li.unitPrice.toNumber().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
					</td>
					<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155; font-size: 14px;">
						${li.total.toNumber().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
					</td>
				</tr>`,
			)
			.join("");

		// 6. Envoyer l'email via Resend
		const { error } = await resend.emails.send({
			from: `${emitterName} <noreply@resend.dev>`,
			to: [doc.client.email],
			subject: `Devis ${doc.number} – En attente de votre accord`,
			html: `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
					<div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
						<h1 style="color: white; margin: 0; font-size: 20px;">Devis ${doc.number}</h1>
					</div>

					<p style="color: #334155; font-size: 15px; line-height: 1.6;">
						Bonjour ${clientName},
					</p>

					<p style="color: #334155; font-size: 15px; line-height: 1.6;">
						Veuillez trouver ci-dessous le devis <strong>n°${doc.number}</strong> d'un montant total de <strong>${amount} €</strong>.
					</p>

					<!-- Récapitulatif -->
					<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
						<table style="width: 100%; font-size: 14px; color: #475569;">
							<tr>
								<td style="padding: 4px 0;">Montant TTC</td>
								<td style="padding: 4px 0; text-align: right; font-weight: 600; color: #7c3aed;">${amount} €</td>
							</tr>
							<tr>
								<td style="padding: 4px 0;">Valide jusqu'au</td>
								<td style="padding: 4px 0; text-align: right; font-weight: 600;">${validUntil}</td>
							</tr>
						</table>
					</div>

					<!-- Détail des lignes -->
					<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
						<thead>
							<tr style="background: #f1f5f9;">
								<th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">Description</th>
								<th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #64748b; text-transform: uppercase;">Qté</th>
								<th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase;">P.U.</th>
								<th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase;">Total</th>
							</tr>
						</thead>
						<tbody>
							${linesHtml}
						</tbody>
					</table>

					<!-- Boutons d'action -->
					<div style="text-align: center; margin: 32px 0;">
						<a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-right: 12px;">
							Accepter le devis
						</a>
						<a href="${refuseUrl}" style="display: inline-block; padding: 14px 32px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
							Refuser le devis
						</a>
					</div>

					<p style="color: #334155; font-size: 15px; line-height: 1.6;">
						N'hésitez pas à revenir vers nous si vous avez la moindre question concernant ce devis.
					</p>

					<p style="color: #334155; font-size: 15px; line-height: 1.6;">
						Bien cordialement,<br/>
						<strong>${emitterName}</strong>
					</p>

					<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

					<p style="color: #94a3b8; font-size: 12px; text-align: center;">
						Email envoyé via FacturFlow
					</p>
				</div>
			`,
		});

		if (error) {
			console.error("[sendQuoteEmail] Resend error:", error);
			return { success: false, error: "Erreur d'envoi : " + error.message };
		}

		// 7. Passer le statut à SENT après envoi réussi (si pas déjà ACCEPTED/REJECTED)
		if (doc.status !== "ACCEPTED" && doc.status !== "REJECTED") {
			await prisma.document.update({
				where: { id: quoteId },
				data: { status: "SENT" },
			});
			revalidatePath("/dashboard/quotes");
		}

		return { success: true };
	} catch (err) {
		console.error("[sendQuoteEmail] Exception:", err);
		return { success: false, error: "Erreur lors de l'envoi de l'email" };
	}
}
