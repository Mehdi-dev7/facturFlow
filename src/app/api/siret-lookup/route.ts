// src/app/api/siret-lookup/route.ts
// Proxy server-side vers l'API Recherche Entreprises (data.gouv.fr)
// Avantage : pas de CORS côté browser, l'appel vient du serveur Next.js

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const q = req.nextUrl.searchParams.get("q");

	if (!q || !/^\d{9,14}$/.test(q)) {
		return NextResponse.json({ error: "SIRET/SIREN invalide" }, { status: 400 });
	}

	try {
		const res = await fetch(
			`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=1`,
			{ next: { revalidate: 60 } }, // cache 60s pour éviter les appels répétés
		);

		if (!res.ok) {
			if (res.status === 429) {
				return NextResponse.json(
					{ error: "Trop de recherches — patientez quelques secondes" },
					{ status: 429 },
				);
			}
			return NextResponse.json(
				{ error: "Erreur lors de la recherche SIRET" },
				{ status: res.status },
			);
		}

		const data = await res.json();
		return NextResponse.json(data);
	} catch {
		return NextResponse.json(
			{ error: "Service indisponible — réessayez" },
			{ status: 503 },
		);
	}
}
