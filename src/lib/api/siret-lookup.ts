// Lookup d'entreprise via l'API officielle Recherche Entreprises (data.gouv.fr)
// Aucune clé API requise, données publiques INSEE

export interface SiretData {
	name: string;
	siret: string;
	siren: string;
	address: string;   // numéro + type + libellé voie
	zipCode: string;
	city: string;
	legalForm?: string; // "SAS, société par actions simplifiée"
}

export async function lookupSiret(siret: string): Promise<SiretData> {
	const clean = siret.replace(/\s/g, "");

	const res = await fetch(
		`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(clean)}&limite=1`,
		{ cache: "force-cache" } // mise en cache côté browser pour la session
	);

	if (!res.ok) {
		throw new Error("Erreur lors de la recherche SIRET");
	}

	const data = await res.json();

	if (!data.results?.length) {
		throw new Error("Aucune entreprise trouvée pour ce SIRET");
	}

	const company = data.results[0];
	const siege = company.siege ?? {};

	// Construction de l'adresse : "12 RUE DE LA PAIX"
	const addressParts = [
		siege.numero_voie,
		siege.type_voie,
		siege.libelle_voie,
	].filter(Boolean);

	// Certaines communes ont un suffixe d'arrondissement ex: "PARIS-1" → "PARIS"
	const cityRaw: string = siege.libelle_commune ?? "";
	const city = cityRaw.replace(/-\d+$/, "");

	return {
		name: company.nom_complet ?? "",
		siret: company.siret ?? clean,
		siren: company.siren ?? "",
		address: addressParts.join(" "),
		zipCode: siege.code_postal ?? "",
		city,
		legalForm: company.libelle_nature_juridique ?? undefined,
	};
}
