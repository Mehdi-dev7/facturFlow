"use server";

// Server Action — lookup d'entreprise via l'API Recherche Entreprises (data.gouv.fr)
// S'exécute côté serveur (Vercel) → pas de CORS, pas de cache browser.

import type { SiretData } from "@/types/siret";

export async function lookupSiret(siret: string): Promise<SiretData> {
	const clean = siret.replace(/\s/g, "");

	const res = await fetch(
		`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(clean)}&per_page=1`,
		{ next: { revalidate: 86400 } }, // cache 24h côté serveur — données entreprise stables
	);

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		console.error(`[lookupSiret] API ${res.status}: ${text}`);
		if (res.status === 429) {
			throw new Error("Trop de recherches — patientez quelques secondes puis réessayez");
		}
		throw new Error(`Erreur API (${res.status}) — réessayez`);
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
