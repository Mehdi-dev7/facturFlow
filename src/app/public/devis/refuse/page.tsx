import { XCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Devis refusé — FacturFlow",
	robots: { index: false },
};

export default function DevisRefusePage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50 p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
				{/* Icône */}
				<div className="flex justify-center">
					<div className="size-20 rounded-full bg-red-50 flex items-center justify-center">
						<XCircle className="size-10 text-red-500" />
					</div>
				</div>

				{/* Titre */}
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-slate-900">
						Devis refusé
					</h1>
					<p className="text-slate-500">
						Votre réponse a bien été enregistrée. Votre prestataire a été
						informé du refus et pourra vous recontacter si nécessaire.
					</p>
				</div>

				{/* Séparateur */}
				<div className="h-px bg-slate-100" />

				{/* Info */}
				<p className="text-sm text-slate-400">
					Vous pouvez fermer cette fenêtre.
				</p>

				{/* Lien discret */}
				<Link
					href="https://facturflow.com"
					className="inline-block text-xs text-slate-300 hover:text-slate-400 transition-colors"
				>
					Propulsé par FacturFlow
				</Link>
			</div>
		</main>
	);
}
