import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Devis accepté — FacturFlow",
	robots: { index: false },
};

export default function DevisAcceptePage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center space-y-6">
				{/* Icône */}
				<div className="flex justify-center">
					<div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center">
						<CheckCircle2 className="size-10 text-emerald-600" />
					</div>
				</div>

				{/* Titre */}
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-slate-900">
						Devis accepté !
					</h1>
					<p className="text-slate-500">
						Merci pour votre confirmation. Votre prestataire a été notifié et
						reviendra vers vous rapidement pour démarrer la mission.
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
