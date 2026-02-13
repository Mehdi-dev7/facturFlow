import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ token: string }> },
) {
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
