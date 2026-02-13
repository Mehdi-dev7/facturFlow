import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;
	const { searchParams } = new URL(req.url);
	const note = searchParams.get("note") ?? undefined;

	if (!token) {
		return NextResponse.redirect(new URL("/public/devis/erreur?raison=token_manquant", req.url));
	}

	try {
		const document = await prisma.document.findUnique({
			where: { refuseToken: token },
			select: {
				id: true,
				status: true,
				respondedAt: true,
			},
		});

		if (!document) {
			return NextResponse.redirect(
				new URL("/public/devis/erreur?raison=token_invalide", req.url),
			);
		}

		if (document.status !== "SENT" && document.status !== "VIEWED") {
			const raison =
				document.status === "ACCEPTED"
					? "deja_accepte"
					: document.status === "REJECTED"
						? "deja_refuse"
						: "statut_invalide";
			return NextResponse.redirect(
				new URL(`/public/devis/erreur?raison=${raison}`, req.url),
			);
		}

		await prisma.document.update({
			where: { id: document.id },
			data: {
				status: "REJECTED",
				respondedAt: new Date(),
				...(note ? { clientNote: note } : {}),
			},
		});

		return NextResponse.redirect(
			new URL(`/public/devis/refuse?ref=${document.id}`, req.url),
		);
	} catch (error) {
		console.error("[API] Erreur refus devis:", error);
		return NextResponse.redirect(
			new URL("/public/devis/erreur?raison=erreur_serveur", req.url),
		);
	}
}
