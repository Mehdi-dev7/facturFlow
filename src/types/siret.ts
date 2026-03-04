// Types pour le lookup SIRET/SIREN — séparés du server action pour éviter
// les conflits d'import dans les composants client.

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
