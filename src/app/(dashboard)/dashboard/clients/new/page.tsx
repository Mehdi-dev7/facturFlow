// Page de création d'un nouveau client
// Route : /dashboard/clients/new

import { UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ClientForm } from "@/components/clients/client-form";

export const metadata = {
	title: "Nouveau client — FacturFlow",
};

export default function NewClientPage() {
	return (
		<div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
			{/* ─── En-tête ─── */}
			<div className="space-y-1">
				{/* Fil d'Ariane */}
				<nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-violet-400/70">
					<Link
						href="/dashboard/clients"
						className="hover:text-primary dark:hover:text-violet-300 transition-colors"
					>
						Clients
					</Link>
					<ChevronRight className="size-3" />
					<span className="text-slate-700 dark:text-slate-300">Nouveau client</span>
				</nav>

				{/* Titre + icône */}
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-violet-500/20">
						<UserPlus className="size-5 text-primary dark:text-violet-400" />
					</div>
					<div>
						<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
							Nouveau client
						</h1>
						<p className="text-sm text-slate-500 dark:text-violet-400/80">
							Recherchez par SIRET pour remplir automatiquement, ou saisissez manuellement.
						</p>
					</div>
				</div>
			</div>

			{/* ─── Formulaire dans une card ─── */}
			<div className="rounded-2xl border border-primary/15 dark:border-violet-400/20 bg-white dark:bg-[#1e1a42] shadow-sm backdrop-blur-sm p-6">
				<ClientForm />
			</div>
		</div>
	);
}
