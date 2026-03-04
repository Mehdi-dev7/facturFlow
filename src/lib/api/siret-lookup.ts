"use server";

// Server Action — lookup d'entreprise via l'API Recherche Entreprises (data.gouv.fr)
// S'exécute côté serveur (Vercel) → pas de CORS, pas de cache browser.
// Aucune clé API requise, données publiques INSEE.

export interface SiretData {
	name: string;
	siret: string;
	siren: string;
	address: string;
	zipCode: string;
	city: string;
	legalForm?: string;
	nafCode?: string;
	nafLabel?: string;
	employeeRange?: string;
	creationDate?: string;
	vatNumber?: string;
}

export async function lookupSiret(siret: string): Promise<SiretData> {
	const clean = siret.replace(/\s/g, "");

	const res = await fetch(
		`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(clean)}&limite=1`,
		{ cache: "no-store" },
	);

	if (!res.ok) {
		throw new Error("Erreur lors de la recherche SIRET");
	}

	const data = await res.json();

	if (!data.results?.length) {
		throw new Error("Aucune entreprise trouvée pour ce SIRET/SIREN");
	}

	const company = data.results[0];
	const siege = company.siege ?? {};

	const addressParts = [
		siege.numero_voie,
		siege.type_voie,
		siege.libelle_voie,
	].filter(Boolean);

	const cityRaw: string = siege.libelle_commune ?? "";
	const city = cityRaw.replace(/-\d+$/, "");

	const calculateTvaKey = (siren: string): string => {
		const sirenNum = parseInt(siren, 10);
		const key = (12 + 3 * (sirenNum % 97)) % 97;
		return key.toString().padStart(2, "0");
	};

	const siren = company.siren ?? "";
	const vatNumber = siren ? `FR${calculateTvaKey(siren)}${siren}` : undefined;

	const getEmployeeRangeLabel = (code: string): string => {
		const ranges: Record<string, string> = {
			"00": "0 salarié",
			"01": "1 ou 2 salariés",
			"02": "3 à 5 salariés",
			"03": "6 à 9 salariés",
			"11": "10 à 19 salariés",
			"12": "20 à 49 salariés",
			"21": "50 à 99 salariés",
			"22": "100 à 199 salariés",
			"31": "200 à 249 salariés",
			"32": "250 à 499 salariés",
			"41": "500 à 999 salariés",
			"42": "1000 à 1999 salariés",
			"51": "2000 à 4999 salariés",
			"52": "5000 à 9999 salariés",
			"53": "10000 salariés et plus",
		};
		return ranges[code] || `${code} salariés`;
	};

	return {
		name: company.nom_complet ?? "",
		siret: company.siret ?? clean,
		siren,
		address: addressParts.join(" "),
		zipCode: siege.code_postal ?? "",
		city,
		legalForm: company.libelle_nature_juridique ?? undefined,
		nafCode: company.activite_principale ?? undefined,
		nafLabel: undefined,
		employeeRange: siege.tranche_effectif_salarie
			? getEmployeeRangeLabel(siege.tranche_effectif_salarie)
			: undefined,
		creationDate: company.date_creation ?? undefined,
		vatNumber,
	};
}
