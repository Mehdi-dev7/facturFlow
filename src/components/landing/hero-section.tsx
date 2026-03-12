"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	CheckCircle2, ArrowRight,
	LayoutDashboard, FileText, Users, CreditCard,
	TrendingUp, Bell, Settings, BarChart2,
} from "lucide-react";

// ─── Dashboard Mockup ──────────────────────────────────────────────────────────

function DashboardMockup() {
	const invoices = [
		{ num: "FAC-2025-041", client: "Studio Créatif",  amount: "890 €",   status: "payee" },
		{ num: "FAC-2025-042", client: "Agence Lumière",  amount: "2 450 €", status: "envoyee" },
		{ num: "FAC-2025-043", client: "Tech Solutions",  amount: "1 200 €", status: "retard" },
		{ num: "FAC-2025-044", client: "Graphik Studio",  amount: "3 100 €", status: "payee" },
	];

	const navItems = [
		{ icon: LayoutDashboard, label: "Tableau de bord", active: true },
		{ icon: FileText,        label: "Factures" },
		{ icon: Users,           label: "Clients" },
		{ icon: CreditCard,      label: "Paiements" },
		{ icon: BarChart2,       label: "Statistiques" },
		{ icon: Settings,        label: "Paramètres" },
	];

	return (
		<div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 ring-1 ring-black/5 bg-white">
			{/* Barre navigateur */}
			<div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 shrink-0">
				<div className="flex gap-1.5">
					<div className="h-2.5 w-2.5 rounded-full bg-red-400" />
					<div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
					<div className="h-2.5 w-2.5 rounded-full bg-green-400" />
				</div>
				<div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[10px] text-slate-400 border border-slate-200">
					app.facturnow.fr/dashboard
				</div>
			</div>

			{/* Layout dashboard */}
			<div className="flex" style={{ height: "380px" }}>

				{/* Sidebar */}
				<div className="w-[130px] shrink-0 border-r border-slate-100 bg-slate-50/60 flex flex-col py-3 px-2 gap-0.5">
					{/* Logo */}
					<div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
						<div className="h-5 w-5 rounded-md bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
							<span className="text-white text-[8px] font-black">FN</span>
						</div>
						<span className="text-[11px] font-bold text-slate-800">FacturNow</span>
					</div>

					{navItems.map((item) => (
						<div
							key={item.label}
							className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${
								item.active
									? "bg-violet-100 text-violet-700"
									: "text-slate-400 hover:bg-slate-100"
							}`}
						>
							<item.icon className="h-3 w-3 shrink-0" />
							<span className="text-[9px] font-medium truncate">{item.label}</span>
						</div>
					))}
				</div>

				{/* Contenu principal */}
				<div className="flex-1 overflow-hidden flex flex-col bg-white">

					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
						<div>
							<p className="text-[11px] font-bold text-slate-800">Tableau de bord</p>
							<p className="text-[9px] text-slate-400">Mars 2025</p>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Bell className="h-3.5 w-3.5 text-slate-400" />
								<div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
							</div>
							<div className="h-5 w-5 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
								<span className="text-[8px] font-bold text-white">JD</span>
							</div>
						</div>
					</div>

					<div className="flex-1 overflow-hidden px-4 py-3 space-y-3">
						{/* KPI Cards */}
						<div className="grid grid-cols-3 gap-2">
							<div className="bg-linear-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-2.5">
								<p className="text-[8px] text-slate-400 font-medium uppercase tracking-wide">CA du mois</p>
								<p className="text-sm font-black text-slate-900 mt-0.5">7 640 €</p>
								<div className="flex items-center gap-0.5 mt-0.5">
									<TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
									<span className="text-[8px] text-emerald-600 font-semibold">+18%</span>
								</div>
							</div>
							<div className="bg-white border border-slate-100 rounded-xl p-2.5">
								<p className="text-[8px] text-slate-400 font-medium uppercase tracking-wide">Envoyées</p>
								<p className="text-sm font-black text-slate-900 mt-0.5">12</p>
								<p className="text-[8px] text-slate-400 mt-0.5">ce mois</p>
							</div>
							<div className="bg-white border border-slate-100 rounded-xl p-2.5">
								<p className="text-[8px] text-slate-400 font-medium uppercase tracking-wide">En attente</p>
								<p className="text-sm font-black text-amber-500 mt-0.5">3 240 €</p>
								<p className="text-[8px] text-slate-400 mt-0.5">3 factures</p>
							</div>
						</div>

						{/* Tableau factures */}
						<div className="rounded-xl border border-slate-100 overflow-hidden">
							<div className="px-3 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
								<span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide">Factures récentes</span>
								<div className="flex items-center gap-1">
									<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
									<span className="text-[8px] text-slate-400">En direct</span>
								</div>
							</div>
							<div className="divide-y divide-slate-50">
								{invoices.map((row) => (
									<div key={row.num} className="flex items-center justify-between px-3 py-2">
										<div className="min-w-0">
											<p className="text-[9px] font-semibold text-violet-600 truncate">{row.num}</p>
											<p className="text-[8px] text-slate-400 truncate">{row.client}</p>
										</div>
										<p className="text-[9px] font-bold text-slate-800 mx-2 shrink-0">{row.amount}</p>
										{row.status === "payee" && (
											<span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-emerald-100 text-emerald-700">Payée</span>
										)}
										{row.status === "envoyee" && (
											<span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-amber-100 text-amber-700">Envoyée</span>
										)}
										{row.status === "retard" && (
											<span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-red-100 text-red-700">Retard</span>
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

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
				<div className="grid lg:grid-cols-2 gap-12 text-center md:text-left items-center">
					{/* Contenu gauche */}
					<div className="space-y-8">
						{/* Badge "Nouveau" */}
						<div className="inline-flex items-center px-4 py-2 rounded-full border border-primary">
							<span className="text-sm font-semibold font-ui text-primary">
								✨ Nouvelle génération de facturation
							</span>
						</div>

						{/* Titre principal */}
						<h1 className="text-3xl xs:text-4xl  md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
							<span className="text-gradient">Gérez vos factures</span>
							<br />
							<span className="text-slate-900">en toute simplicité</span>
						</h1>

						{/* Sous-titre */}
						<p className="text-sm sm:text-lg text-slate-600 leading-relaxed max-w-xl">
							Créez, envoyez et suivez vos factures professionnelles en quelques
							clics. FacturNow automatise votre facturation pour que vous
							puissiez vous concentrer sur votre activité.
						</p>

						{/* Features badges */}
						<div className="grid grid-cols-2 gap-3 max-w-xl">
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-xs sm:text-sm font-medium text-slate-700 font-ui">Templates professionnels</span>
							</div>
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-xs xs:text-sm font-medium text-slate-700 font-ui">Export PDF instantané</span>
							</div>
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-xs xs:text-sm font-medium text-slate-700 font-ui">Suivi des paiements</span>
							</div>
							<div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
								<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
								<span className="text-xs xs:text-sm font-medium text-slate-700 font-ui">Facturation en 2 min</span>
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
								className="w-full sm:w-auto h-12 px-8 border-slate-400 hover:border-primary hover:bg-primary/10 font-semibold font-ui text-base transition-all duration-300 cursor-pointer"
								onClick={() =>
									document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })
								}
							>
								Voir la démo
							</Button>
						</div>

						{/* Sous-texte */}
						<p className="text-xs sm:text-sm text-slate-500">
							Sans carte bancaire • Essai gratuit de 7 jours • Annulation à tout moment
						</p>
					</div>

					{/* Dashboard mockup codé */}
					<div className="relative lg:block hidden">
						<DashboardMockup />
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
