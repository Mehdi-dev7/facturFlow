"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	CheckCircle2,
	ArrowRight,
	FileText,
	CreditCard,
	TrendingUp,
	Zap,
} from "lucide-react";

export function HeroSection() {
	return (
		<section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
			{/* Gradient radial au centre - effet "boule qui éclate" */}
			<div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-50">
				<div
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-300 h-300 rounded-full blur-3xl opacity-60 animate-pulse"
					style={{
						background:
							"radial-gradient(circle, rgba(79, 70, 229, 0.3), rgba(99, 102, 241, 0.4), rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.15))",
					}}
				/>
			</div>

			<div className="relative z-10 w-full px-4 sm:px-[8%] xl:px-[12%] py-18 xl:py-10">
				<div className="grid lg:grid-cols-2 gap-12 items-center">
					{/* Contenu gauche */}
					<div className="space-y-8">
						{/* Badge "Nouveau" */}
						<div className="inline-flex items-center px-4 py-2 rounded-full border border-primary">
							<span className="text-sm font-semibold font-ui text-primary">
								✨ Nouvelle génération de facturation
							</span>
						</div>

						{/* Titre principal */}
						<h1 className="text-4xl  md:text-5xl lg:text-6xl 2xl:text-7xl leading-tight">
							<span className="text-gradient">Gérez vos factures</span>
							<br />
							<span className="text-slate-900">en toute simplicité</span>
						</h1>

						{/* Sous-titre */}
						<p className="text-lg xs:text-xl text-slate-600 leading-relaxed max-w-xl">
							Créez, envoyez et suivez vos factures professionnelles en quelques
							clics. FacturFlow automatise votre facturation pour que vous
							puissiez vous concentrer sur votre business.
						</p>

						{/* Features badges avec icônes de validation */}
						<div className="grid grid-cols-2 gap-3 max-w-xl">
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-sm font-medium text-slate-700 font-ui">
									Templates professionnels
								</span>
							</div>
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-sm font-medium text-slate-700 font-ui">
									Export PDF instantané
								</span>
							</div>
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-sm font-medium text-slate-700 font-ui">
									Suivi des paiements
								</span>
							</div>
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-sm font-medium text-slate-700 font-ui">
									Facturation en 2 min
								</span>
							</div>
						</div>

						{/* CTAs */}
						<div className="flex flex-col sm:flex-row gap-4">
							<Link href="/signup">
								<Button
									variant="gradient"
									size="lg"
									className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
								>
									Commencer gratuitement
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Button
								size="lg"
								variant="outline"
								className="w-full sm:w-auto h-12 px-8 border-slate-300 hover:border-primary hover:bg-primary/10 font-semibold font-ui text-base transition-all duration-300 cursor-pointer"
								onClick={() =>
									document
										.getElementById("demo")
										?.scrollIntoView({ behavior: "smooth" })
								}
							>
								Voir la démo
							</Button>
						</div>

						{/* Sous-texte */}
						<p className="text-sm text-slate-500">
							Sans carte bancaire • Essai gratuit 14 jours • Annulation à tout
							moment
						</p>
					</div>

					{/* Mockup/Illustration droite */}
					<div className="relative lg:block hidden">
						<div className="relative">
							{/* Carte principale - Dashboard */}
							<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-bold font-heading text-slate-900">
										Tableau de bord
									</h3>
									<div className="flex items-center space-x-2">
										<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
										<span className="text-xs text-slate-500 font-ui">
											En direct
										</span>
									</div>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-3 gap-4">
									<div
										className="p-4 rounded-xl"
										style={{
											background:
												"linear-gradient(to bottom right, rgba(79, 70, 229, 0.1), rgba(99, 102, 241, 0.1))",
										}}
									>
										<FileText
											className="h-6 w-6 mb-2"
											style={{ color: "rgb(79, 70, 229)" }}
										/>
										<p className="text-2xl font-bold font-heading text-slate-900">
											24
										</p>
										<p className="text-xs text-slate-600 font-ui">Factures</p>
									</div>
									<div
										className="p-4 rounded-xl"
										style={{
											background:
												"linear-gradient(to bottom right, rgb(240, 253, 244), rgb(209, 250, 229))",
										}}
									>
										<TrendingUp className="h-6 w-6 text-green-600 mb-2" />
										<p className="text-2xl font-bold font-heading text-slate-900">
											18
										</p>
										<p className="text-xs text-slate-600 font-ui">Payées</p>
									</div>
									<div
										className="p-4 rounded-xl"
										style={{
											background:
												"linear-gradient(to bottom right, rgb(255, 247, 237), rgb(254, 243, 199))",
										}}
									>
										<CreditCard className="h-6 w-6 text-orange-600 mb-2" />
										<p className="text-2xl font-bold font-heading text-slate-900">
											6
										</p>
										<p className="text-xs text-slate-600 font-ui">En attente</p>
									</div>
								</div>

								{/* Facture récente */}
								<div className="border border-slate-200 rounded-lg p-4 space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-slate-900 font-ui">
											Facture #INV-2025-042
										</span>
										<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full font-ui">
											Payée
										</span>
									</div>
									<p className="text-xs text-slate-500">
										Client: Entreprise ABC
									</p>
									<p className="text-lg font-bold text-slate-900 font-heading">
										2 450,00 €
									</p>
								</div>
							</div>

							{/* Flèche + Badge "Paiement sécurisé" */}
							<div className="absolute -right-8 top-1/2 -translate-y-1/2">
								<div className="relative">
									<div
										className="text-white px-4 py-2 rounded-lg shadow-lg font-ui font-semibold text-sm whitespace-nowrap animate-bounce"
										style={{ backgroundColor: "rgb(6, 182, 212)" }}
									>
										💳 Paiement sécurisé
									</div>
								</div>
							</div>

							{/* Icône Zap en haut à gauche */}
							<div
								className="absolute -left-6 -top-6 p-3 rounded-full shadow-lg animate-pulse"
								style={{
									background:
										"linear-gradient(to bottom right, rgb(250, 204, 21), rgb(249, 115, 22))",
								}}
							>
								<Zap className="h-6 w-6 text-white" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
