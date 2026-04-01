// src/app/api/siret-lookup/route.ts
// Proxy server-side vers l'API Recherche Entreprises (data.gouv.fr)
// Avantage : pas de CORS côté browser, l'appel vient du serveur Next.js
// Cache 24h via unstable_cache (persiste entre invocations serverless Vercel)

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

// Cache les résultats 24h — les données SIRET ne changent pas souvent
const fetchSiretCached = unstable_cache(
	async (q: string) => {
		const res = await fetch(
			`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=1`,
		);

		if (!res.ok) {
			// On ne cache pas les erreurs — lancer une exception pour que unstable_cache ne stocke rien
			throw new Error(`API_STATUS_${res.status}`);
		}

		return res.json();
	},
	["siret-lookup"],
	{ revalidate: 86400 }, // 24 heures
);

export async function GET(req: NextRequest) {
	const q = req.nextUrl.searchParams.get("q");

	if (!q || !/^\d{9,14}$/.test(q)) {
		return NextResponse.json({ error: "SIRET/SIREN invalide" }, { status: 400 });
	}

	try {
		const data = await fetchSiretCached(q);
		return NextResponse.json(data);
	} catch (err) {
		const msg = err instanceof Error ? err.message : "";

		if (msg === "API_STATUS_429") {
			return NextResponse.json(
				{ error: "Trop de recherches — réessayez dans quelques minutes" },
				{ status: 429 },
			);
		}

		return NextResponse.json(
			{ error: "Service indisponible — réessayez" },
			{ status: 503 },
		);
	}
}
