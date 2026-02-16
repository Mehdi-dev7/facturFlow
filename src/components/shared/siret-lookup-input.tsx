"use client";

// Composant réutilisable : saisir un SIRET → auto-remplit les champs du formulaire parent
// Utilisé dans : company-info-modal, client-search (quick form), client-form (page /clients/new)

import { useState, useCallback } from "react";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupSiret, type SiretData } from "@/lib/api/siret-lookup";

interface SiretLookupInputProps {
	/** Appelé quand une entreprise est trouvée, pour pré-remplir le formulaire parent */
	onFound: (data: SiretData) => void;
}

export function SiretLookupInput({ onFound }: SiretLookupInputProps) {
	const [siret, setSiret] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [found, setFound] = useState(false);

	const handleSearch = useCallback(async () => {
		const clean = siret.replace(/\s/g, "");

		// Validation format
		if (clean.length !== 14) {
			setError("Le SIRET doit contenir exactement 14 chiffres");
			return;
		}
		if (!/^\d{14}$/.test(clean)) {
			setError("Le SIRET ne doit contenir que des chiffres");
			return;
		}

		setLoading(true);
		setError(null);
		setFound(false);

		try {
			const data = await lookupSiret(clean);
			onFound(data);
			setFound(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Entreprise introuvable"
			);
		} finally {
			setLoading(false);
		}
	}, [siret, onFound]);

	// Permet de lancer la recherche en appuyant sur Entrée
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSearch();
			}
		},
		[handleSearch]
	);

	const isReady = siret.replace(/\s/g, "").length === 14;

	return (
		<div className="rounded-xl border border-dashed border-violet-300 dark:border-violet-500/30 p-3 space-y-2 bg-violet-100/50 dark:bg-violet-900/20">
			<p className="text-xs font-medium text-violet-700 dark:text-violet-400">
				Remplir automatiquement via SIRET
			</p>

			<div className="flex gap-2">
				{/* Input SIRET — on filtre les non-chiffres et on limite à 14 */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-violet-400 pointer-events-none" />
					<Input
						placeholder="14 chiffres (ex: 41816609600069)"
						value={siret}
						onChange={(e) => {
							setSiret(e.target.value.replace(/\D/g, "").slice(0, 14));
							setError(null);
							setFound(false);
						}}
						onKeyDown={handleKeyDown}
						maxLength={14}
						inputMode="numeric"
						className="pl-9 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-sm tracking-widest h-9"
						aria-label="Numéro SIRET"
					/>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleSearch}
					disabled={loading || !isReady}
					className="shrink-0 h-9 border-violet-300 dark:border-violet-400/30 hover:bg-violet-100 dark:hover:bg-violet-500/10 dark:text-slate-200 cursor-pointer rounded-xl transition-all duration-300"
					aria-busy={loading}
				>
					{loading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						"Chercher"
					)}
				</Button>
			</div>

			{/* Feedback erreur */}
			{error && (
				<p className="text-xs text-red-500 dark:text-red-400">{error}</p>
			)}

			{/* Feedback succès */}
			{found && !error && (
				<p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
					<CheckCircle2 className="size-3.5 shrink-0" />
					Entreprise trouvée — champs pré-remplis automatiquement
				</p>
			)}
		</div>
	);
}
