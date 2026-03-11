import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { type SearchParams } from "next/dist/server/request/search-params";

export const metadata = {
	title: "Lien invalide — FacturNow",
	robots: { index: false },
};

const MESSAGES: Record<string, string> = {
	token_manquant: "Le lien de validation est incomplet.",
	token_invalide: "Ce lien de validation est invalide ou a expiré.",
	deja_validee: "Cette proforma a déjà été validée et convertie en facture.",
	statut_invalide: "Cette proforma n'est plus en attente de validation.",
	erreur_conversion:
		"Une erreur s'est produite lors de la création de la facture. Veuillez contacter votre prestataire.",
	erreur_serveur:
		"Une erreur inattendue s'est produite. Veuillez réessayer.",
};

export default async function ProformaErreurPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await searchParams;
	const raison =
		typeof params.raison === "string" ? params.raison : "token_invalide";
	const message = MESSAGES[raison] ?? MESSAGES.token_invalide;

	return (
		<main className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-white to-slate-50 p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-100 p-8 text-center space-y-6">
				{/* Icône */}
				<div className="flex justify-center">
					<div className="size-20 rounded-full bg-amber-50 flex items-center justify-center">
						<AlertTriangle className="size-10 text-amber-500" />
					</div>
				</div>

				{/* Titre */}
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-slate-900">
						Lien invalide
					</h1>
					<p className="text-slate-500">{message}</p>
				</div>

				{/* Séparateur */}
				<div className="h-px bg-slate-100" />

				<p className="text-sm text-slate-400">
					Si le problème persiste, contactez directement votre prestataire.
				</p>

				<Link
					href="https://facturnow.com"
					className="inline-block text-xs text-slate-300 hover:text-slate-400 transition-colors"
				>
					Propulsé par FacturNow
				</Link>
			</div>
		</main>
	);
}
