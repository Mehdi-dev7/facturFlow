"use server";

// Server action : envoie la proforma par email avec un lien de validation (CTA orange)

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { wrapEmail, emailHeader, EMAIL_FOOTER } from "@/lib/email/email-base";

// ─── Action ──────────────────────────────────────────────────────────────────

export async function sendProformaEmail(proformaId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { success: false, error: "Non authentifié" };
	}

	try {
		// 1. Récupérer la proforma depuis la DB
		const doc = await prisma.document.findFirst({
			where: { id: proformaId, userId: session.user.id, type: "PROFORMA" },
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
					},
				},
			},
		});

		if (!doc) {
			return { success: false, error: "Proforma introuvable" };
		}

		// 2. Construire l'URL de validation (accept uniquement — pas de refus pour une proforma)
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
		const acceptUrl = `${baseUrl}/api/public/proforma/accept/${doc.acceptToken}`;

		// 3. Préparer les données de l'email
		const clientName =
			(doc.client.companyName ??
				[doc.client.firstName, doc.client.lastName]
					.filter(Boolean)
					.join(" ")) || doc.client.email;

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

		const emitterName = doc.user.companyName ?? "FacturNow";

		// 4. Générer le HTML des lignes
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

		// 5. Envoyer l'email via Resend
		const { error } = await resend.emails.send({
			from:
				process.env.RESEND_FROM_EMAIL ??
				`${emitterName} <noreply@facturnow.fr>`,
			to: [doc.client.email],
			subject: `Proforma ${doc.number} – En attente de validation`,
			html: wrapEmail(`
				${emailHeader("linear-gradient(135deg, #ea580c, #f97316)", "", `Proforma ${doc.number}`)}

				<p style="color:#334155;font-size:15px;line-height:1.6;">Bonjour ${clientName},</p>
				<p style="color:#334155;font-size:15px;line-height:1.6;">
					Veuillez trouver ci-dessous la proforma <strong>n°${doc.number}</strong> d'un montant total de <strong>${amount} €</strong>.
					Une fois validée, une facture officielle vous sera émise automatiquement.
				</p>

				<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
					<table style="width:100%;font-size:14px;color:#475569;">
						<tr>
							<td style="padding:4px 0;">Montant TTC</td>
							<td style="padding:4px 0;text-align:right;font-weight:600;color:#ea580c;">${amount} €</td>
						</tr>
						<tr>
							<td style="padding:4px 0;">Valide jusqu'au</td>
							<td style="padding:4px 0;text-align:right;font-weight:600;">${validUntil}</td>
						</tr>
					</table>
				</div>

				<table style="width:100%;border-collapse:collapse;margin:20px 0;">
					<thead>
						<tr style="background:#fff7ed;">
							<th style="padding:8px 12px;text-align:left;font-size:12px;color:#92400e;text-transform:uppercase;">Description</th>
							<th style="padding:8px 12px;text-align:center;font-size:12px;color:#92400e;text-transform:uppercase;">Qté</th>
							<th style="padding:8px 12px;text-align:right;font-size:12px;color:#92400e;text-transform:uppercase;">P.U.</th>
							<th style="padding:8px 12px;text-align:right;font-size:12px;color:#92400e;text-transform:uppercase;">Total</th>
						</tr>
					</thead>
					<tbody>${linesHtml}</tbody>
				</table>

				<div style="text-align:center;margin:32px 0;">
					<a href="${acceptUrl}" class="ebtn"
					   style="display:inline-block;padding:14px 40px;background:#ea580c;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;margin:6px;">
						Confirmer et valider
					</a>
				</div>

				<p style="color:#334155;font-size:15px;line-height:1.6;">
					En validant cette proforma, vous confirmez votre accord sur les prestations et montants indiqués.
					Une facture officielle vous sera ensuite envoyée automatiquement.
				</p>
				<p style="color:#334155;font-size:15px;line-height:1.6;">
					N'hésitez pas à nous contacter pour toute question.<br/>
					Bien cordialement,<br/><strong>${emitterName}</strong>
				</p>

				${EMAIL_FOOTER}
			`),
		});

		if (error) {
			console.error("[sendProformaEmail] Resend error:", error);
			return { success: false, error: "Erreur d'envoi : " + error.message };
		}

		// 6. Passer le statut à SENT après envoi réussi (si pas déjà ACCEPTED)
		if (doc.status !== "ACCEPTED") {
			await prisma.document.update({
				where: { id: proformaId },
				data: { status: "SENT" },
			});
			revalidatePath("/dashboard/proformas");
		}

		return { success: true };
	} catch (err) {
		console.error("[sendProformaEmail] Exception:", err);
		return { success: false, error: "Erreur lors de l'envoi de l'email" };
	}
}
