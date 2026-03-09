// src/app/(dashboard)/dashboard/tutorials/gocardless/page.tsx
// Guide pas-à-pas pour connecter GoCardless (SEPA) à FacturNow

import Link from "next/link";
import {
	ArrowLeft,
	Clock,
	Lightbulb,
	CheckCircle2,
	ArrowRight,
	AlertTriangle,
} from "lucide-react";
import { AnnotatedImage } from "@/components/tutorials/annotated-image";
import type { Annotation } from "@/components/tutorials/annotated-image";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tutoriel GoCardless | FacturNow",
	description: "Guide pour connecter votre compte GoCardless et activer le prélèvement SEPA automatique",
};

// ─── Logo GoCardless ──────────────────────────────────────────────────────────

function GoCardlessLogo({ size = 24 }: { size?: number }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64">
			<rect width="64" height="64" rx="8.8" fill="#00A27B" />
			<path d="M34 32.4c0-6 4.5-10.9 10.9-10.9 4 0 6.3 1.3 8.3 3.2l-2.9 3.4c-1.6-1.5-3.3-2.4-5.4-2.4-3.5 0-6.1 2.9-6.1 6.5v.1c0 3.6 2.5 6.6 6.1 6.6 2.4 0 3.9-1 5.5-2.5l2.9 3c-2.2 2.3-4.6 3.7-8.6 3.7-6.2.1-10.7-4.7-10.7-10.7z" fill="#fff" />
			<path d="M22 43.2c-6.7 0-11.3-4.7-11.3-11.1 0-6.1 4.8-11.2 11.3-11.2 3.9 0 6.2 1 8.4 3l-3 3.6c-1.7-1.4-3.1-2.2-5.6-2.2-3.4 0-6.2 3.1-6.2 6.7 0 3.9 2.8 6.8 6.5 6.8 1.7 0 3.3-.4 4.5-1.3v-3.1h-4.8v-4.1h9.3v9.4c-2.1 1.9-5.2 3.5-9.1 3.5" fill="#fff" fillRule="evenodd" clipRule="evenodd" />
		</svg>
	);
}

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

const GC_COLOR = "#00A27B";

const STEPS: TutorialStep[] = [
	{
		number: 1,
		title: "Créer un compte GoCardless",
		description:
			'Rendez-vous sur <strong>gocardless.com</strong> et cliquez sur "S\'inscrire". Remplissez le formulaire (nom de société, pays France, type d\'entreprise, email, mot de passe). Choisissez l\'offre <strong>Standard</strong> (1% + 0,20€ par prélèvement), puis suivez les instructions pour renseigner vos informations bancaires et compléter la vérification d\'identité (KYC).',
		tip: "L'offre Standard est largement suffisante pour des freelances et PME. Munissez-vous de votre IBAN, SIRET et pièce d'identité pour le KYC.",
		image: "/tutos/gocardless/step-05.webp",
		annotations: [
			{ type: "rect", x: 10, y: 2, w: 31, h: 96, color: GC_COLOR },
			{ type: "badge", x: 25, y: 93, text: "Sélectionnez Standard", color: GC_COLOR },
		],
	},
	{
		number: 2,
		title: "Votre dashboard GoCardless est prêt",
		description:
			"Vous arrivez sur votre dashboard GoCardless. Ne vous inquiétez pas du message \"La vérification de votre compte est en cours\" — vous pouvez dès maintenant récupérer votre clé API et configurer FacturNow pendant que GoCardless valide vos informations.",
		image: "/tutos/gocardless/step-06.webp",
		annotations: [
			{ type: "rect", x: 0, y: 25, w: 12, h: 6, color: GC_COLOR },
			{ type: "badge", x: 40, y: 15, text: "Bienvenue !", color: GC_COLOR },
		],
	},
	{
		number: 3,
		title: "Accéder à Développeurs → Paramètres de l'API",
		description:
			'Dans le menu latéral gauche, cliquez sur "Développeurs" pour dérouler le sous-menu. Cliquez ensuite sur "Paramètres de l\'API" pour accéder à la gestion des jetons et webhooks.',
		image: "/tutos/gocardless/step-07.webp",
		annotations: [
			{ type: "rect", x: 3, y: 50, w: 60, h: 9, color: GC_COLOR },
			
		],
	},
	{
		number: 4,
		title: "Créer un jeton d'accès",
		description:
			'Sur la page "Paramètres de l\'API", vous voyez deux sections : "Jetons d\'accès" et "Points de terminaison de webhook". Dans la section Jetons d\'accès, cliquez sur le lien "Créer un jeton d\'accès".',
		image: "/tutos/gocardless/step-08.webp",
		annotations: [
			{ type: "rect", x:15, y: 46, w: 15, h: 5, color: GC_COLOR },
			{ type: "badge", x: 45, y: 45, text: "Créer un jeton d'accès", color: GC_COLOR },
		],
	},
	{
		number: 5,
		title: "Configurer le jeton — Nom et permissions",
		description:
			'Une fenêtre s\'ouvre. Dans le champ "Nom", saisissez <strong>FacturNow</strong>. Pour le "Champ d\'application", sélectionnez <strong>"Accès en mode lecture et écriture"</strong> (indispensable pour créer des mandats et des paiements). Cliquez sur "Créer".',
		image: "/tutos/gocardless/step-10.webp",
		annotations: [
			
			{ type: "badge", x: 42, y: 55, text: "Nom : FacturNow", color: GC_COLOR },
			{ type: "circle", cx: 15, cy: 73, r: 3, color: GC_COLOR },
			{ type: "badge", x: 35, y: 75, text: "Sélectionnez lecture et écriture", color: GC_COLOR },
			{ type: "arrow", x1: 55, y1: 88, x2: 62, y2: 84, color: "#16a34a" },
			{ type: "badge", x: 48, y: 91, text: "Puis cliquez Créer", color: "#16a34a" },
		],
	},
	{
		number: 6,
		title: "Copier votre jeton d'accès immédiatement",
		description:
			'GoCardless affiche votre jeton une seule fois. Copiez-le maintenant en cliquant sur l\'icône de copie à droite du champ. Collez-le dans un endroit sûr (gestionnaire de mots de passe). Cliquez ensuite sur "J\'ai copié ce jeton d\'accès".',
		tip: "Ce jeton commence par live_ en production. Si vous le perdez, vous devrez en créer un nouveau — GoCardless ne le stocke pas.",
		image: "/tutos/gocardless/step-11.webp",
		annotations: [
			// Masquer le vrai token
			{ type: "mask", x: 15, y: 28, w: 57, h: 6, bg: "#0f172a" },
			{ type: "badge", x: 45, y: 21, text: "Votre jeton (affiché une seule fois)", color: GC_COLOR },
			{ type: "badge", x: 35, y: 77, text: "Copiez-le avant de continuer !", color: "#f59e0b" },
		],
	},
	{
		number: 7,
		title: "Créer le point de terminaison webhook",
		description:
			'Revenez sur la page "Paramètres de l\'API". Dans la section "Points de terminaison de webhook", cliquez sur "Créer un point de terminaison de webhook". Saisissez le nom <strong>FacturNow</strong> et collez l\'URL ci-dessous dans le champ URL. Laissez le champ Secret vide (GoCardless le génère) puis cliquez "Créer".',
		code: "https://facturnow.fr/api/webhooks/gocardless",
		image: "/tutos/gocardless/step-12.webp",
		annotations: [

			{ type: "badge", x: 42, y: 29, text: "Nom : FacturNow", color: GC_COLOR },
			{ type: "badge", x: 45, y: 37, text: "Collez l'URL ci-dessus", color: "#16a34a" },
			{ type: "arrow", x1: 55, y1: 90, x2: 67, y2: 85, color: "#16a34a" },
			{ type: "badge", x: 47, y: 87, text: "Puis cliquez Créer", color: "#16a34a" },
		],
	},
	{
		number: 8,
		title: "Webhook activé — votre endpoint est prêt",
		description:
			'Votre webhook apparaît dans la liste avec le statut <strong>Activé</strong> (badge vert). GoCardless enverra désormais les notifications de paiement à FacturNow automatiquement. Cliquez sur le nom "FacturNow" pour afficher les détails et récupérer le Secret.',
		image: "/tutos/gocardless/step-13.webp",
		annotations: [
			{ type: "rect", x: 0, y: 35, w: 100, h: 32, color: GC_COLOR },
			// Masquer l'identifiant webhook
			{ type: "mask", x: 62, y: 42, w: 16, h: 16, bg: "#0f172a" },
			{ type: "badge", x: 8, y: 31, text: "Activé ✓", color: GC_COLOR },
		],
	},
	{
		number: 9,
		title: "Copier le Secret du webhook",
		description:
			'Sur la page de détails du webhook, repérez la ligne "Secret". Copiez la valeur affichée et collez-la dans FacturNow → Paiements → GoCardless dans le champ "Webhook Secret". Ce secret permet à FacturNow de vérifier que les notifications viennent bien de GoCardless.',
		image: "/tutos/gocardless/step-14.webp",
		annotations: [
			// Masquer l'identifiant webhook
			{ type: "mask", x: 14, y: 45, w: 12, h: 5, bg: "#0f172a" },
			// Masquer le secret
			{ type: "mask", x: 14, y: 53, w: 25, h: 5, bg: "#0f172a" },
			{ type: "rect", x: 2, y: 51, w: 96, h: 9, color: GC_COLOR },
			{ type: "badge", x: 45, y: 63, text: "Copiez ce Secret", color: GC_COLOR },
		],
	},
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoCardlessTutorialPage() {
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
			<div className="bg-linear-to-r from-[#00A27B]/10 via-[#00A27B]/5 to-transparent dark:from-[#00A27B]/25 dark:via-[#00A27B]/10 border border-[#00A27B]/20 dark:border-[#00A27B]/40 rounded-2xl px-6 py-6">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A27B]/10 dark:bg-[#00A27B]/20 border border-[#00A27B]/20">
						<GoCardlessLogo size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
							Connecter GoCardless
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
						Prérequis — Ce dont vous avez besoin
					</p>
					<p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
						Munissez-vous de votre <span className="font-semibold">IBAN</span>,{" "}
						<span className="font-semibold">SIRET</span> et{" "}
						<span className="font-semibold">pièce d&apos;identité</span> pour l&apos;activation KYC GoCardless.
						Sans ces éléments, GoCardless ne pourra pas valider votre compte.
					</p>
				</div>
			</div>

			{/* URL webhook */}
			<div className="flex items-start gap-3 bg-[#00A27B]/5 dark:bg-[#00A27B]/10 border border-[#00A27B]/20 dark:border-[#00A27B]/30 rounded-xl px-4 py-3">
				<Lightbulb className="h-4 w-4 text-[#00A27B] mt-0.5 shrink-0" />
				<div>
					<p className="text-xs font-semibold text-[#00A27B] mb-0.5">
						URL webhook à copier (étape 7)
					</p>
					<code className="text-xs text-[#00A27B] dark:text-emerald-400 bg-[#00A27B]/10 dark:bg-[#00A27B]/20 px-2 py-0.5 rounded font-mono">
						https://facturnow.fr/api/webhooks/gocardless
					</code>
				</div>
			</div>

			{/* Étapes */}
			<div className="space-y-10">
				{STEPS.map((step) => (
					<div key={step.number} className="space-y-4">
						<div className="flex items-start gap-4">
							{/* Numéro */}
							<div
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm"
								style={{ backgroundColor: GC_COLOR }}
							>
								{step.number}
							</div>

							{/* Titre + description */}
							<div className="flex-1 pt-0.5 space-y-2">
								<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
									{step.title}
								</h2>
								<p
									className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
									dangerouslySetInnerHTML={{ __html: step.description }}
								/>

								{/* Code snippet */}
								{step.code && (
									<code
										className="block text-xs font-mono px-3 py-2 rounded-lg border"
										style={{
											color: GC_COLOR,
											backgroundColor: "rgba(0,162,123,0.06)",
											borderColor: "rgba(0,162,123,0.2)",
										}}
									>
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
			<div
				className="rounded-2xl p-6 space-y-4 border"
				style={{
					background: "linear-gradient(to right, rgba(0,162,123,0.06), transparent)",
					borderColor: "rgba(0,162,123,0.2)",
				}}
			>
				<div className="flex items-center gap-3">
					<CheckCircle2 className="h-6 w-6 text-green-500" />
					<h3 className="font-semibold text-slate-900 dark:text-slate-100">
						Vous avez tout ce qu&apos;il vous faut !
					</h3>
				</div>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Retournez dans FacturNow, collez votre <strong>Access Token</strong> et votre{" "}
					<strong>Webhook Secret</strong> pour activer le prélèvement SEPA automatique sur vos factures.
				</p>
				<Link
					href="/dashboard/payments"
					className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity px-5 py-2.5 rounded-xl"
					style={{ backgroundColor: GC_COLOR }}
				>
					Aller dans Paiements
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}
