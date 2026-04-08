import type { VatRate } from "@/lib/validations/invoice";

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
	/**
	 * Ventilation TVA par taux (mode per_line uniquement).
	 * Ex: [{ rate: 20, amount: 80 }, { rate: 10, amount: 15 }]
	 */
	vatBreakdown?: { rate: number; amount: number }[];
}

export interface CalcOptions {
	lines: { quantity: number; unitPrice: number; vatRate?: VatRate }[];
	vatRate: VatRate; // taux global (utilisé quand vatMode === "global" ou ligne sans taux)
	vatMode?: "global" | "per_line";
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
 * - En mode per_line, la TVA est calculée par ligne (avec répartition proportionnelle de la réduction)
 * - Une réduction en % est plafonnée à 100
 * - Une réduction en montant est plafonnée au subtotal (pas de montant négatif)
 * - L'acompte est plafonné au totalTTC (pas de remboursement)
 * - Tous les résultats sont arrondis à 2 décimales
 */
export function calcInvoiceTotals(opts: CalcOptions): InvoiceTotals {
	const { lines, vatRate, vatMode, discountType, discountValue = 0, depositAmount = 0 } = opts;

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
	let taxTotal: number;
	let vatBreakdown: { rate: number; amount: number }[] | undefined;

	if (vatMode === "per_line") {
		// Rapport de réduction à appliquer proportionnellement à chaque ligne
		const discountRatio = subtotal > 0 ? netHT / subtotal : 1;

		// Grouper les lignes par taux de TVA
		const vatGroups = new Map<number, number>(); // rate → base HT cumulée
		for (const l of lines) {
			const lineRate = l.vatRate ?? vatRate; // fallback sur le taux global
			const lineHT = (l.quantity || 0) * (l.unitPrice || 0);
			vatGroups.set(lineRate, (vatGroups.get(lineRate) ?? 0) + lineHT);
		}

		// Calculer la TVA par taux (après réduction proportionnelle)
		vatBreakdown = [];
		let rawTaxTotal = 0;
		for (const [rate, baseHT] of vatGroups) {
			const adjustedBase = baseHT * discountRatio;
			const taxAmount = round(adjustedBase * (rate / 100));
			rawTaxTotal += taxAmount;
			vatBreakdown.push({ rate, amount: taxAmount });
		}
		// Trier par taux croissant pour l'affichage
		vatBreakdown.sort((a, b) => a.rate - b.rate);
		taxTotal = round(rawTaxTotal);
	} else {
		// Mode global : TVA appliquée sur le netHT total
		taxTotal = round(netHT * (vatRate / 100));
	}

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
		...(vatBreakdown ? { vatBreakdown } : {}),
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
