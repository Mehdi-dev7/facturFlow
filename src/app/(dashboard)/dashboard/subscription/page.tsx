"use client";

import { Crown, Check, X, Star, Zap, Building, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeatureValue = string | boolean;

interface Feature {
	name: string;
	free: FeatureValue;
	pro: FeatureValue;
	business: FeatureValue;
}

const allFeatures: Feature[] = [
	// LIMITES
	{ name: "Documents par mois", free: "10", pro: "Illimités", business: "Illimités" },
	{ name: "Clients", free: "5", pro: "Illimités", business: "Illimités" },
	{ name: "Utilisateurs", free: "1 compte", pro: "1 compte", business: "3 comptes" },
	
	// KILLER FEATURES
	{ name: "🔥 Prélèvement SEPA automatique", free: false, pro: true, business: true },
	{ name: "Factures récurrentes", free: false, pro: true, business: true },
	{ name: "Relances automatiques", free: false, pro: true, business: true },
	{ name: "Templates métiers", free: false, pro: "9 templates", business: "9 templates" },
	{ name: "Suivi des paiements", free: false, pro: true, business: true },
	
	// BONUS FEATURES
	{ name: "Paiement CB & PayPal", free: false, pro: true, business: true },
	{ name: "Bilan annuel & URSSAF", free: false, pro: true, business: true },
	{ name: "API & Webhooks", free: false, pro: false, business: true },
	{ name: "Facturation électronique", free: false, pro: "100/mois", business: "Illimitée" },
];

const plans = [
	{
		name: "Gratuit",
		subtitle: "Essai 14 jours puis limité",
		price: "0",
		period: "Gratuit",
		description: "14 j d'essai Pro, puis 10 factures/mois",
		cta: "Plan actuel",
		current: true,
		icon: Star,
		bgColor: "bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
		borderColor: "border-slate-300 dark:border-slate-700",
		iconBg: "bg-slate-200 dark:bg-slate-700",
		iconColor: "text-slate-600 dark:text-slate-400"
	},
	{
		name: "Pro",
		subtitle: "Freelances • Auto-entrepreneurs • PME",
		price: "14",
		period: "par mois",
		description: "Tout illimité + SEPA + récurrentes",
		cta: "Passer au Pro",
		current: false,
		popular: true,
		icon: Zap,
		bgColor: "bg-linear-to-br from-primary/10 via-accent/5 to-primary/5 dark:from-primary/20 dark:via-accent/10 dark:to-primary/10",
		borderColor: "border-primary/40 dark:border-primary/60",
		iconBg: "bg-primary/20 dark:bg-primary/30",
		iconColor: "text-primary dark:text-primary",
		badge: "⭐ Le plus populaire"
	},
	{
		name: "Business",
		subtitle: "Entreprises B2B",
		price: "29",
		period: "par mois",
		description: "Tout Pro + multi-users + API",
		cta: "Passer au Business",
		current: false,
		icon: Building,
		bgColor: "bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950",
		borderColor: "border-blue-300 dark:border-blue-700",
		iconBg: "bg-blue-200 dark:bg-blue-800",
		iconColor: "text-blue-600 dark:text-blue-400"
	}
];

export default function SubscriptionPage() {
	const getFeatureValue = (feature: Feature, planIndex: number): FeatureValue => {
		const planKeys: (keyof Feature)[] = ['free', 'pro', 'business'];
		return feature[planKeys[planIndex]];
	};

	const renderFeatureIcon = (value: FeatureValue) => {
		if (value === false) {
			return (
				<div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
					<X className="w-3 h-3 text-red-600 dark:text-red-400" />
				</div>
			);
		}
		return (
			<div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
				<Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
			</div>
		);
	};

	const renderFeatureText = (value: FeatureValue): string => {
		if (value === false) return "Non inclus";
		if (value === true) return "Inclus";
		return value as string;
	};

	return (
		<div className="space-y-8 pb-8">
			{/* Header */}
			<div className="text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 mb-4">
					<Crown className="h-8 w-8 text-primary" />
				</div>
				<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient mb-3">
					Gestion de l&apos;abonnement
				</h1>
				<p className="text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
					Choisissez le plan qui correspond à vos besoins. 
					Changez ou annulez à tout moment.
				</p>
			</div>

			{/* Plan actuel - Badge */}
			<div className="flex justify-center">
				<div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
					<CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					<span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
						Plan actuel : Gratuit
					</span>
				</div>
			</div>

			{/* Pricing cards */}
			<div className="grid lg:grid-cols-3 gap-10 lg:gap-6 max-w-7xl mx-auto">
				{plans.map((plan, planIndex) => {
					const IconComponent = plan.icon;
					return (
						<div 
							key={planIndex} 
							className={`relative rounded-2xl p-6 ${plan.bgColor} border-2 ${plan.borderColor} transition-all duration-300 ${plan.popular ? 'lg:scale-105 shadow-xl ring-2 ring-primary/20 dark:ring-primary/40' : 'shadow-lg hover:shadow-xl'}`}
						>
							{/* Popular badge */}
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<div className="bg-primary text-white px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1">
										<Sparkles className="h-3 w-3" />
										{plan.badge}
									</div>
								</div>
							)}

							{/* Current badge */}
							{plan.current && (
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1">
										<CheckCircle className="h-3 w-3" />
										Plan actuel
									</div>
								</div>
							)}

							{/* Plan header */}
							<div className="text-center mb-6">
								<div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${plan.iconBg}`}>
									<IconComponent className={`w-6 h-6 ${plan.iconColor}`} />
								</div>
								
								<h3 className="text-xl xs:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
									{plan.name}
								</h3>
								<p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 mb-4">
									{plan.subtitle}
								</p>
								
								<div className="mb-3">
									<span className="text-4xl font-bold text-gradient">
										{plan.price}€
									</span>
									<span className="text-slate-600 dark:text-slate-400 ml-1">
										{plan.period}
									</span>
								</div>
								
								<p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
									{plan.description}
								</p>
							</div>

							{/* Features */}
							<div className="space-y-2.5 mb-6">
								{allFeatures.map((feature, featureIndex) => {
									const value = getFeatureValue(feature, planIndex);
									return (
										<div key={featureIndex} className="flex items-start gap-2.5">
											{renderFeatureIcon(value)}
											<div className="flex-1 min-w-0">
												<span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300 font-medium">
													{feature.name}
												</span>
												<div className="text-xs text-slate-500 dark:text-slate-500">
													{renderFeatureText(value)}
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* CTA */}
							{plan.current ? (
								<Button
									variant="outline"
									className="w-full cursor-not-allowed"
									disabled
								>
									{plan.cta}
								</Button>
							) : plan.popular ? (
								<Button
									variant="gradient"
									size="lg"
									className="w-full transition-all hover:scale-105 duration-300 cursor-not-allowed"
									disabled
								>
									{plan.cta}
								</Button>
							) : (
								<Button
									variant="outline"
									className="w-full hover:scale-105 transition-all duration-300 cursor-not-allowed"
									disabled
								>
									{plan.cta}
								</Button>
							)}
						</div>
					);
				})}
			</div>

			{/* Bottom notice */}
			<div className="max-w-4xl mx-auto">
				<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
					<div className="flex items-start gap-3">
						<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
							<Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
								🚧 Abonnements bientôt disponibles
							</h3>
							<p className="text-sm text-amber-800 dark:text-amber-200">
								Les abonnements payants seront disponibles prochainement. 
								En attendant, profitez gratuitement de toutes les fonctionnalités de base !
							</p>
						</div>
					</div>
				</div>

				{/* Info bas de page */}
				<div className="text-center mt-8 space-y-2">
					<p className="text-slate-600 dark:text-slate-400 text-sm">
						🔒 Paiement sécurisé • Support français • 💯 Satisfait ou remboursé 30 jours
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-500">
						Tous les prix sont HT. TVA applicable selon votre localisation.
					</p>
				</div>
			</div>
		</div>
	);
}
