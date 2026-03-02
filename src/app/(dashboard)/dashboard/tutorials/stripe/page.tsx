// src/app/(dashboard)/dashboard/tutorials/stripe/page.tsx
// Guide pas-à-pas pour connecter Stripe à FacturNow

import Link from "next/link";
import {
	ArrowLeft,
	Clock,
	Lightbulb,
	CheckCircle2,
	ArrowRight,
	AlertTriangle,
} from "lucide-react";
import { SiStripe } from "react-icons/si";
import { AnnotatedImage } from "@/components/tutorials/annotated-image";
import type { Annotation } from "@/components/tutorials/annotated-image";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tutoriel Stripe | FacturNow",
	description: "Guide pour connecter votre compte Stripe à FacturNow",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TutorialStep {
	number: number;
	title: string;
	description: string;
	code?: string;
	tip?: string;
	image: string;
	annotations: Annotation[];
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

const STEPS: TutorialStep[] = [
	{
		number: 1,
		title: "Créer ou se connecter à un compte Stripe",
		description:
			'Rendez-vous sur stripe.com. Si vous avez déjà un compte, entrez votre email et mot de passe puis cliquez sur "Connexion". Sinon, cliquez sur "Créez un compte" en bas du formulaire pour en créer un.',
		image: "/tutos/stripe/step-01.png",
		annotations: [
			{ type: "circle", cx: 50, cy: 92, r: 4, color: "#635BFF" },
			{ type: "badge", x: 32, y: 96, text: "Créez un compte", color: "#635BFF" },
		],
	},
	{
		number: 2,
		title: "Activer votre compte pour les vrais paiements",
		description:
			"Stripe vous guide à travers plusieurs formulaires d'activation (type d'entreprise, informations personnelles, coordonnées bancaires…). Suivez chaque étape jusqu'à la validation complète. Choisissez bien \"Entrepreneur individuel / Micro-entrepreneur\" si vous êtes auto-entrepreneur.",
		tip: "Stripe vous demandera votre numéro de TVA. Trouvez-le sur annuaire-entreprises.data.gouv.fr en cherchant votre SIREN. Saisissez-le sans espaces (ex: FR15101077105). Si vous êtes en franchise de base, le champ est facultatif. Un site web est obligatoire — votre profil LinkedIn ou GitHub est accepté.",
		image: "/tutos/stripe/step-02.png",
		annotations: [
			{ type: "circle", cx: 50, cy: 68, r: 6, color: "#635BFF" },
		],
	},
	{
		number: 3,
		title: "Passer en mode Live (production)",
		description:
			'Par défaut vous êtes en mode Test. Sur le bandeau en haut du dashboard, cliquez sur "Basculer sur le compte de production" pour accéder à votre environnement réel et générer vos vraies clés API.',
		tip: "Ne confondez pas les clés Test (sk_test_...) et Live (sk_live_...). Seules les clés Live permettent d'encaisser de vrais paiements.",
		image: "/tutos/stripe/step-03.png",
		annotations: [
			{ type: "circle", cx: 88, cy: 2, r: 3, color: "#16a34a" },
			{ type: "badge", x: 60, y: 6, text: "Basculer en production", color: "#16a34a" },
		],
	},
	{
		number: 4,
		title: "Récupérer votre clé secrète",
		description:
			'Sur la page d\'accueil de votre dashboard Live, un widget "Clés API" est affiché à droite. Sur la ligne "Clé secrète", cliquez sur l\'icône œil pour la révéler, puis copiez-la. Elle commence par sk_live_.',
		tip: "La clé secrète ne doit jamais être partagée. Traitez-la comme un mot de passe. Si vous ne voyez pas le widget, allez dans Développeurs → Clés API dans le menu gauche.",
		image: "/tutos/stripe/step-04.png",
		annotations: [
			// Masquer la clé publique visible
			{ type: "mask", x: 72, y: 30, w: 22, h: 5, bg: "#f8f9fa" },
			// Cercle sur l'icône œil de la clé secrète
			{ type: "circle", cx: 97, cy: 42, r: 2, color: "#635BFF" },
			{ type: "badge", x: 63, y: 46, text: "Cliquez ici pour révéler", color: "#635BFF" },
		],
	},
	{
		number: 5,
		title: "Accéder aux Webhooks",
		description:
			'Tout en bas du menu latéral gauche, cliquez sur "Développeurs". Un sous-menu s\'ouvre : cliquez sur "Webhooks" pour accéder à la page de gestion des webhooks.',
		image: "/tutos/stripe/step-05.png",
		annotations: [
			{ type: "circle", cx: 50, cy: 23, r: 8, color: "#635BFF" },
			{ type: "badge", x: 25, y: 34, text: "Webhooks", color: "#635BFF" },
		],
	},
	{
		number: 6,
		title: "Ajouter une nouvelle destination",
		description:
			'Sur la page Webhooks, cliquez sur le bouton "+ Ajouter une destination" pour démarrer la création de votre webhook.',
		image: "/tutos/stripe/step-06.png",
		annotations: [
			{ type: "circle", cx: 34, cy: 32, r: 7, color: "#635BFF" },
		],
	},
	{
		number: 7,
		title: "Sélectionner l'événement à écouter",
		description:
			'Dans la section "Événements", sélectionnez "Votre compte", puis dans la barre de recherche tapez checkout.session et cochez uniquement "checkout.session.completed". Cliquez sur "Continuer".',
		tip: "Cet événement se déclenche dès qu'un client finalise son paiement — c'est lui qui marque la facture PAYÉE dans FacturNow.",
		image: "/tutos/stripe/step-07.png",
		annotations: [
			{ type: "circle", cx: 9, cy: 67, r: 4, color: "#635BFF" },
			{
				type: "badge",
				x: 15,
				y: 72,
				text: "checkout.session.completed",
				color: "#635BFF",
			},
		],
	},
	{
		number: 8,
		title: "Configurer la destination",
		description:
			'Sur l\'écran suivant, choisissez "Endpoint de webhook", puis renseignez le nom (ex: FacturNow) et collez l\'URL ci-dessous dans le champ "URL d\'endpoint". Cliquez sur "Créer une destination".',
		code: "https://facturnow.fr/api/webhooks/stripe",
		image: "/tutos/stripe/step-08.png",
		annotations: [
			{ type: "circle", cx: 50, cy: 38, r: 5, color: "#635BFF" },
		],
	},
	{
		number: 9,
		title: "Copier le Webhook Secret",
		description:
			'Une fois le webhook créé, Stripe affiche la page de détails. Dans le panneau de droite, repérez "Clé secrète de signature" et cliquez sur l\'icône œil pour révéler le secret. Copiez la valeur qui commence par whsec_ et collez-la dans FacturNow → Paiements → Stripe.',
		image: "/tutos/stripe/step-09.png",
		annotations: [
			// Masquer l'ID de destination (sensible)
			{ type: "mask", x: 63, y: 21, w: 28, h: 4, bg: "#ffffff" },
			// Encadrer la section Clé secrète
			{ type: "rect", x: 62, y: 66, w: 36, h: 14, color: "#16a34a" },
			{ type: "badge", x: 63, y: 82, text: "Copiez ce Webhook Secret", color: "#16a34a" },
		],
	},
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StripeTutorialPage() {
	return (
		<div className="max-w-3xl mx-auto space-y-8 pb-12">
			{/* Retour */}
			<Link
				href="/dashboard/tutorials"
				className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				Retour aux tutoriels
			</Link>

			{/* Header */}
			<div className="bg-linear-to-r from-[#635BFF]/10 via-[#635BFF]/5 to-transparent dark:from-[#635BFF]/30 dark:via-[#635BFF]/10 border border-[#635BFF]/20 dark:border-[#635BFF]/40 rounded-2xl px-6 py-6">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#635BFF]/10 dark:bg-[#635BFF]/30 border border-[#635BFF]/20">
						<SiStripe className="h-6 w-6 text-[#635BFF]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
							Connecter Stripe
						</h1>
						<div className="flex items-center gap-3 mt-1">
							<span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
								<Clock className="h-3.5 w-3.5" />
								~10 minutes
							</span>
							<span className="text-slate-300 dark:text-slate-600">·</span>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								{STEPS.length} étapes
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Prérequis */}
			<div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-4">
				<AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
				<div className="space-y-1">
					<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
						Prérequis — Activer votre compte Stripe
					</p>
					<p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
						Sans activation complète, Stripe bloque les vrais encaissements.
						Munissez-vous de votre <span className="font-semibold">IBAN</span>,
						votre <span className="font-semibold">SIRET</span> et d&apos;un{" "}
						<span className="font-semibold">site web ou profil LinkedIn/GitHub</span>{" "}
						avant de commencer.
					</p>
				</div>
			</div>

			{/* URL webhook */}
			<div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl px-4 py-3">
				<Lightbulb className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
				<div>
					<p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-0.5">
						URL webhook à copier (étape 8)
					</p>
					<code className="text-xs text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded font-mono">
						https://facturnow.fr/api/webhooks/stripe
					</code>
				</div>
			</div>

			{/* Étapes */}
			<div className="space-y-10">
				{STEPS.map((step) => (
					<div key={step.number} className="space-y-4">
						<div className="flex items-start gap-4">
							{/* Numéro */}
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#635BFF] text-white text-sm font-bold shadow-sm">
								{step.number}
							</div>
							{/* Titre + description */}
							<div className="flex-1 pt-0.5 space-y-2">
								<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
									{step.title}
								</h2>
								<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
									{step.description}
								</p>

								{/* Code snippet */}
								{step.code && (
									<code className="block text-xs text-[#635BFF] dark:text-[#a5b4fc] bg-[#635BFF]/5 dark:bg-[#635BFF]/10 border border-[#635BFF]/20 px-3 py-2 rounded-lg font-mono">
										{step.code}
									</code>
								)}

								{/* Conseil */}
								{step.tip && (
									<div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-2">
										<Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
										<p className="text-xs text-amber-700 dark:text-amber-400">
											{step.tip}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Screenshot annoté */}
						<div className="ml-13">
							<AnnotatedImage
								src={step.image}
								alt={`Étape ${step.number} — ${step.title}`}
								annotations={step.annotations}
							/>
						</div>
					</div>
				))}
			</div>

			{/* CTA final */}
			<div className="bg-linear-to-r from-[#635BFF]/5 to-white dark:from-[#635BFF]/20 dark:to-transparent border border-[#635BFF]/20 dark:border-[#635BFF]/30 rounded-2xl p-6 space-y-4">
				<div className="flex items-center gap-3">
					<CheckCircle2 className="h-6 w-6 text-green-500" />
					<h3 className="font-semibold text-slate-900 dark:text-slate-100">
						Vous avez tout ce qu'il vous faut !
					</h3>
				</div>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Retournez dans FacturNow et collez votre clé secrète et votre webhook
					secret pour commencer à encaisser par carte bancaire, Apple Pay et
					Google Pay.
				</p>
				<Link
					href="/dashboard/payments"
					className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#635BFF] hover:opacity-90 transition-opacity px-5 py-2.5 rounded-xl"
				>
					Aller dans Paiements
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}
