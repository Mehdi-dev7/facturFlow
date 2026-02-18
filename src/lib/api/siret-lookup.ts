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
	nafCode?: string;  // Code NAF (activité principale)
	nafLabel?: string; // Libellé de l'activité principale
	employeeRange?: string; // Tranche d'effectifs
	creationDate?: string; // Date de création
	vatNumber?: string; // Numéro TVA calculé
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

	// Calcul du numéro de TVA français (FR + clé + SIREN)
	const calculateTvaKey = (siren: string): string => {
		const sirenNum = parseInt(siren, 10);
		const key = (12 + 3 * (sirenNum % 97)) % 97;
		return key.toString().padStart(2, '0');
	};

	const siren = company.siren ?? "";
	const vatNumber = siren ? `FR${calculateTvaKey(siren)}${siren}` : undefined;

	// Mapping des tranches d'effectifs
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
			"53": "10000 salariés et plus"
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
		nafLabel: undefined, // Pas disponible dans cette API
		employeeRange: siege.tranche_effectif_salarie ? getEmployeeRangeLabel(siege.tranche_effectif_salarie) : undefined,
		creationDate: company.date_creation ?? undefined,
		vatNumber,
	};
}
