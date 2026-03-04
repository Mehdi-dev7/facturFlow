"use client";

// Composant réutilisable : saisir un SIRET (14) ou SIREN (9) → auto-remplit le formulaire parent
// Utilisé dans : company/page.tsx, client-form

import { useState, useCallback } from "react";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupSiret, type SiretData } from "@/lib/api/siret-lookup";

interface SiretLookupInputProps {
	onFound: (data: SiretData) => void;
}

export function SiretLookupInput({ onFound }: SiretLookupInputProps) {
	const [value, setValue] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [found, setFound] = useState(false);

	const handleSearch = useCallback(async () => {
		const clean = value.replace(/\s/g, "");

		// Accepte 9 chiffres (SIREN) ou 14 chiffres (SIRET)
		if (clean.length !== 9 && clean.length !== 14) {
			setError("Entrez un SIRET (14 chiffres) ou un SIREN (9 chiffres)");
			return;
		}
		if (!/^\d+$/.test(clean)) {
			setError("Uniquement des chiffres");
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
			setError(err instanceof Error ? err.message : "Entreprise introuvable");
		} finally {
			setLoading(false);
		}
	}, [value, onFound]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSearch();
			}
		},
		[handleSearch],
	);

	const len = value.replace(/\s/g, "").length;
	const isReady = len === 9 || len === 14;

	return (
		<div className="rounded-xl border border-dashed border-violet-300 dark:border-violet-500/30 p-3 space-y-2 bg-violet-100/50 dark:bg-violet-900/20">
			<p className="text-xs font-medium text-violet-700 dark:text-violet-400">
				Remplir automatiquement via SIRET ou SIREN
			</p>

			<div className="flex flex-col xs:flex-row gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-violet-400 pointer-events-none" />
					<Input
						placeholder="SIRET (14 chiffres) ou SIREN (9 chiffres)"
						value={value}
						onChange={(e) => {
							setValue(e.target.value.replace(/\D/g, "").slice(0, 14));
							setError(null);
							setFound(false);
						}}
						onKeyDown={handleKeyDown}
						maxLength={14}
						inputMode="numeric"
						className="pl-9 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-xs xs:text-sm tracking-widest h-9"
						aria-label="SIRET ou SIREN"
					/>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleSearch}
					disabled={loading || !isReady}
					className="w-full xs:w-auto shrink-0 h-9 border-violet-300 dark:border-violet-400/30 hover:bg-violet-100 dark:hover:bg-violet-500/10 dark:text-slate-200 cursor-pointer rounded-xl transition-all duration-300"
					aria-busy={loading}
				>
					{loading ? <Loader2 className="size-4 animate-spin" /> : "Chercher"}
				</Button>
			</div>

			{error && (
				<p className="text-xs text-red-500 dark:text-red-400">{error}</p>
			)}

			{found && !error && (
				<div className="rounded-lg border border-emerald-300 dark:border-emerald-400/30 bg-emerald-50/80 dark:bg-emerald-900/15 p-3 space-y-1">
					<p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
						<CheckCircle2 className="size-3.5 shrink-0" />
						Entreprise trouvée — champs pré-remplis automatiquement
					</p>
					<p className="text-xs text-emerald-600 dark:text-emerald-400">
						✓ Nom, SIREN, SIRET, adresse et numéro de TVA récupérés
					</p>
				</div>
			)}
		</div>
	);
}
