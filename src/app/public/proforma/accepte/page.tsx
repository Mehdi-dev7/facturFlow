import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Proforma validée — FacturNow",
	robots: { index: false },
};

export default function ProformaAcceptePage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 via-white to-amber-50 p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-orange-100 p-8 text-center space-y-6">
				{/* Icône */}
				<div className="flex justify-center">
					<div className="size-20 rounded-full bg-orange-100 flex items-center justify-center">
						<CheckCircle2 className="size-10 text-orange-600" />
					</div>
				</div>

				{/* Titre */}
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-slate-900">
						Proforma validée !
					</h1>
					<p className="text-slate-500">
						Votre proforma a été validée avec succès. Une facture officielle
						vous a été envoyée par email.
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
					href="https://facturnow.com"
					className="inline-block text-xs text-slate-300 hover:text-slate-400 transition-colors"
				>
					Propulsé par FacturNow
				</Link>
			</div>
		</main>
	);
}
