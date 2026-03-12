"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

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
							clics. FacturNow automatise votre facturation pour que vous
							puissiez vous concentrer sur votre activité.
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
									className="w-full sm:w-auto h-12 hover:scale-105 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
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
							Sans carte bancaire • Essai gratuit de 7 jours • Annulation à tout
							moment
						</p>
					</div>

					{/* Screenshot dashboard réel */}
				<div className="relative lg:block hidden">
					<div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 ring-1 ring-black/5">
						{/* Barre navigateur factice */}
						<div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
							<div className="flex gap-1.5">
								<div className="h-3 w-3 rounded-full bg-red-400" />
								<div className="h-3 w-3 rounded-full bg-amber-400" />
								<div className="h-3 w-3 rounded-full bg-green-400" />
							</div>
							<div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-[11px] text-slate-400 border border-slate-200">
								app.facturnow.fr/dashboard
							</div>
						</div>
						<Image
							src="/screenshots/dashboard.png"
							alt="Dashboard FacturNow"
							width={720}
							height={480}
							className="w-full h-auto object-cover object-top"
							priority
						/>
					</div>
					{/* Badge flottant */}
					<div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-2.5 flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
						<span className="text-xs font-semibold text-slate-700">Paiement reçu ✓</span>
					</div>
				</div>
				</div>{/* end grid */}
			</div>
		</section>
	);
}