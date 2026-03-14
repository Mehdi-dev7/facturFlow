import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createDepositFromQuote } from "@/lib/actions/deposits";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ token: string }> },
) {
	// Rate limiting : 10 tentatives/minute par IP (anti-bruteforce de tokens)
	const ip = getClientIp(_req);
	const { limited } = rateLimit(ip, { max: 10, windowMs: 60_000, prefix: "quote_accept" });
	if (limited) {
		return NextResponse.redirect(new URL("/public/devis/erreur?raison=trop_de_requetes", _req.url));
	}

	const { token } = await params;

	if (!token) {
		return NextResponse.redirect(new URL("/public/devis/erreur?raison=token_manquant", _req.url));
	}

	try {
		const document = await prisma.document.findUnique({
			where: { acceptToken: token },
			select: {
				id: true,
				status: true,
				respondedAt: true,
				userId: true,
				depositAmount: true,
			},
		});

		if (!document) {
			return NextResponse.redirect(
				new URL("/public/devis/erreur?raison=token_invalide", _req.url),
			);
		}

		// Un devis ne peut être accepté qu'une seule fois
		if (document.status !== "SENT" && document.status !== "VIEWED") {
			const raison =
				document.status === "ACCEPTED"
					? "deja_accepte"
					: document.status === "REJECTED"
						? "deja_refuse"
						: "statut_invalide";
			return NextResponse.redirect(
				new URL(`/public/devis/erreur?raison=${raison}`, _req.url),
			);
		}

		await prisma.document.update({
			where: { id: document.id },
			data: {
				status: "ACCEPTED",
				respondedAt: new Date(),
			},
		});

		dispatchWebhook(document.userId, "quote.accepted", { id: document.id }).catch(() => {});

		// Si le devis a un acompte défini → créer + envoyer email (awaité avant le redirect)
		// Ne pas mettre en fire-and-forget : Vercel coupe l'exécution dès que la réponse est envoyée
		if (document.depositAmount && Number(document.depositAmount) > 0) {
			try {
				await createDepositFromQuote(document.id, document.userId);
			} catch (err) {
				console.error("[accept-token] Erreur création acompte auto:", err);
			}
		}

		return NextResponse.redirect(
			new URL(`/public/devis/accepte?ref=${document.id}`, _req.url),
		);
	} catch (error) {
		console.error("[API] Erreur acceptation devis:", error);
		return NextResponse.redirect(
			new URL("/public/devis/erreur?raison=erreur_serveur", _req.url),
		);
	}
}
