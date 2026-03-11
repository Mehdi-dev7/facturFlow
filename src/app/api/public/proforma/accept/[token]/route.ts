import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { convertProformaToInvoice } from "@/lib/actions/proformas";
import { sendInvoiceEmail } from "@/lib/actions/send-invoice-email";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;

	if (!token) {
		return NextResponse.redirect(
			new URL("/public/proforma/erreur?raison=token_manquant", _req.url),
		);
	}

	try {
		// Chercher la proforma par acceptToken (type PROFORMA uniquement)
		const document = await prisma.document.findFirst({
			where: { acceptToken: token, type: "PROFORMA" },
			select: {
				id: true,
				status: true,
				userId: true,
				businessMetadata: true,
			},
		});

		if (!document) {
			return NextResponse.redirect(
				new URL("/public/proforma/erreur?raison=token_invalide", _req.url),
			);
		}

		// Une proforma peut être validée si elle est SENT ou VIEWED
		if (document.status !== "SENT" && document.status !== "VIEWED") {
			const raison =
				document.status === "ACCEPTED" ? "deja_validee" : "statut_invalide";
			return NextResponse.redirect(
				new URL(`/public/proforma/erreur?raison=${raison}`, _req.url),
			);
		}

		// Convertir la proforma en vraie facture
		const convertResult = await convertProformaToInvoice(document.id);

		if (!convertResult.success || !convertResult.data) {
			console.error(
				"[API] Erreur conversion proforma:",
				convertResult.error,
			);
			return NextResponse.redirect(
				new URL(
					"/public/proforma/erreur?raison=erreur_conversion",
					_req.url,
				),
			);
		}

		// Envoyer l'email de la facture créée au client (best effort)
		sendInvoiceEmail(convertResult.data.invoiceId).catch((err) => {
			console.error("[API] Erreur envoi email facture post-proforma:", err);
		});

		return NextResponse.redirect(
			new URL(`/public/proforma/accepte?ref=${document.id}`, _req.url),
		);
	} catch (error) {
		console.error("[API] Erreur validation proforma:", error);
		return NextResponse.redirect(
			new URL("/public/proforma/erreur?raison=erreur_serveur", _req.url),
		);
	}
}
