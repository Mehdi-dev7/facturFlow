/**
 * Construit les liens publics d'acceptation/refus d'un devis.
 * Utilise NEXT_PUBLIC_APP_URL si défini, sinon http://localhost:3000.
 */
export function buildQuoteValidationLinks(acceptToken: string, refuseToken: string) {
	const base =
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

	return {
		acceptUrl: `${base}/api/public/devis/accept/${acceptToken}`,
		refuseUrl: `${base}/api/public/devis/refuse/${refuseToken}`,
	};
}
