// SIRET/SIREN lookup via the French government API
// https://recherche-entreprises.api.gouv.fr

export interface SiretResult {
  nom_complet: string;
  siren: string;
  siret: string;
  adresse: string;
  code_postal: string;
  ville: string;
  activite_principale: string;
  nature_juridique: string;
}

interface ApiEtablissement {
  siret: string;
  adresse: string;
  code_postal: string;
  libelle_commune: string;
}

interface ApiResult {
  nom_complet: string;
  siren: string;
  siege: ApiEtablissement;
  activite_principale: string;
  nature_juridique: string;
  nombre_etablissements: number;
  matching_etablissements: ApiEtablissement[];
}

interface ApiResponse {
  results: ApiResult[];
  total_results: number;
}

export async function searchEntreprise(
  query: string
): Promise<SiretResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const url = new URL(
      "https://recherche-entreprises.api.gouv.fr/search"
    );
    url.searchParams.set("q", trimmed);
    url.searchParams.set("per_page", "10");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    return data.results.map((r) => ({
      nom_complet: r.nom_complet,
      siren: r.siren,
      siret: r.siege.siret,
      adresse: r.siege.adresse,
      code_postal: r.siege.code_postal,
      ville: r.siege.libelle_commune,
      activite_principale: r.activite_principale,
      nature_juridique: r.nature_juridique,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`SIRET lookup failed: ${error.message}`);
    }
    throw new Error("SIRET lookup failed: unknown error");
  }
}
