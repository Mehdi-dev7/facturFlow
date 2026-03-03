import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Video, FileText, ExternalLink, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
	title: "Tutoriels | FacturNow",
	description: "Guides et tutoriels pour maîtriser FacturNow",
};

// href = null → "À venir", href = string → lien actif
const tutorialCategories = [
	{
		title: "Paiements",
		icon: Video,
		color: "text-violet-500",
		bgColor: "bg-violet-500/10",
		tutorials: [
			{ title: "Comment créer un compte Stripe en 2 minutes", duration: "5 min", href: "/dashboard/tutorials/stripe" },
			{ title: "Configurer PayPal pour recevoir des paiements", duration: "5 min", href: "/dashboard/tutorials/paypal" },
			{ title: "Activer le prélèvement SEPA avec GoCardless", duration: "5 min", href: null },
		],
	},
	{
		title: "Facturation",
		icon: FileText,
		color: "text-accent",
		bgColor: "bg-accent/10",
		tutorials: [
			{ title: "Créer votre première facture", duration: "2 min", href: null },
			{ title: "Envoyer un devis et le convertir en facture", duration: "3 min", href: null },
			{ title: "Gérer les factures récurrentes", duration: "4 min", href: null },
		],
	},
	{
		title: "Personnalisation",
		icon: BookOpen,
		color: "text-tertiary",
		bgColor: "bg-tertiary/10",
		tutorials: [
			{ title: "Personnaliser l'apparence de vos documents", duration: "2 min", href: null },
			{ title: "Ajouter votre logo et vos couleurs", duration: "2 min", href: null },
		],
	},
];

export default function TutorialsPage() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Tutoriels</h1>
				<p className="text-slate-600 dark:text-slate-400 text-xs xs:text-sm">
					Guides et tutoriels pour tirer le meilleur parti de FacturNow
				</p>
			</div>

			{/* Categories */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{tutorialCategories.map((category) => (
					<Card key={category.title} className="shadow-lg border-primary/20">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.bgColor}`}>
									<category.icon className={`h-5 w-5 ${category.color}`} />
								</div>
								<CardTitle className="text-lg">{category.title}</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							{category.tutorials.map((tutorial, idx) => {
								const isActive = !!tutorial.href;
								const inner = (
									<>
										<Video className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "text-primary" : "text-slate-400"}`} />
										<div className="flex-1 min-w-0">
											<p className={`text-xs xs:text-sm font-medium line-clamp-2 ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-500"}`}>
												{tutorial.title}
											</p>
											<div className="flex items-center gap-2 mt-1">
												<span className="text-xs text-slate-500 dark:text-slate-400">
													{tutorial.duration}
												</span>
												{isActive ? (
													<span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
														Disponible
													</span>
												) : (
													<span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
														À venir
													</span>
												)}
											</div>
										</div>
										{isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
									</>
								);

								return isActive ? (
									<Link
										key={idx}
										href={tutorial.href!}
										className="group flex items-start gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all"
									>
										{inner}
									</Link>
								) : (
									<div
										key={idx}
										className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed"
									>
										{inner}
									</div>
								);
							})}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Info */}
			<Card className="border-primary/20">
				<CardContent className="flex items-center gap-3 p-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
						<ExternalLink className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
							Centre d'aide complet
						</p>
						<p className="text-xs text-slate-600 dark:text-slate-400">
							Tous nos tutoriels vidéo seront bientôt disponibles. En attendant, n'hésitez pas à nous contacter pour toute question.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
