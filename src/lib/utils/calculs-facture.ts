import type { InvoiceLine, VatRate } from "@/lib/validations/invoice";

export interface InvoiceTotals {
	/** Somme brute des lignes (qty × prix) */
	subtotal: number;
	/** Montant de la réduction appliquée sur le HT */
	discountAmount: number;
	/** Sous-total après réduction */
	netHT: number;
	/** Montant de TVA */
	taxTotal: number;
	/** Total TTC (netHT + TVA) */
	totalTTC: number;
	/** Acompte déjà versé */
	depositAmount: number;
	/** Montant réellement dû = totalTTC − acompte */
	netAPayer: number;
}

export interface CalcOptions {
	lines: Pick<InvoiceLine, "quantity" | "unitPrice">[];
	vatRate: VatRate;
	discountType?: "pourcentage" | "montant";
	discountValue?: number;
	depositAmount?: number;
}

/**
 * Calcule l'ensemble des montants d'une facture.
 *
 * Chaîne de calcul :
 *   subtotal → − réduction → netHT → + TVA → totalTTC → − acompte → netAPayer
 *
 * Règles :
 * - La réduction est appliquée sur le HT (avant TVA)
 * - Une réduction en % est plafonnée à 100
 * - Une réduction en montant est plafonnée au subtotal (pas de montant négatif)
 * - L'acompte est plafonné au totalTTC (pas de remboursement)
 * - Tous les résultats sont arrondis à 2 décimales
 */
export function calcInvoiceTotals(opts: CalcOptions): InvoiceTotals {
	const { lines, vatRate, discountType, discountValue = 0, depositAmount = 0 } = opts;

	// 1. Sous-total brut
	const subtotal = round(
		lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0), 0),
	);

	// 2. Réduction
	let discountAmount = 0;
	if (discountType === "pourcentage" && discountValue > 0) {
		const pct = Math.min(discountValue, 100);
		discountAmount = round(subtotal * (pct / 100));
	} else if (discountType === "montant" && discountValue > 0) {
		discountAmount = round(Math.min(discountValue, subtotal));
	}

	// 3. Net HT
	const netHT = round(subtotal - discountAmount);

	// 4. TVA
	const taxTotal = round(netHT * (vatRate / 100));

	// 5. Total TTC
	const totalTTC = round(netHT + taxTotal);

	// 6. Acompte + Net à payer
	const safeDeposit = round(Math.min(depositAmount, totalTTC));
	const netAPayer = round(totalTTC - safeDeposit);

	return {
		subtotal,
		discountAmount,
		netHT,
		taxTotal,
		totalTTC,
		depositAmount: safeDeposit,
		netAPayer,
	};
}

/** Formate un nombre en devise française */
export function formatCurrency(n: number): string {
	return n.toLocaleString("fr-FR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}) + " €";
}

// ─── Interne ──────────────────────────────────────────────────────────────────

function round(n: number): number {
	return Math.round(n * 100) / 100;
}
