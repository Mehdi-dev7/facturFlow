// src/app/api/siret/route.ts
// Proxy server-side vers l'API gouvernementale Recherche Entreprises.
// Évite tout problème CORS depuis le navigateur en prod.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Paramètre q manquant" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&limite=1`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erreur API gouvernementale: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Impossible de joindre l'API Recherche Entreprises" },
      { status: 502 },
    );
  }
}
