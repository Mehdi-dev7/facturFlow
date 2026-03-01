// src/app/(dashboard)/dashboard/tutorials/paypal/page.tsx
// Guide pas-à-pas pour connecter PayPal Business à FacturNow

import Link from "next/link";
import { ArrowLeft, Clock, Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { AnnotatedImage } from "@/components/tutorials/annotated-image";
import type { Annotation } from "@/components/tutorials/annotated-image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutoriel PayPal | FacturNow",
  description: "Guide pour connecter votre compte PayPal Business à FacturNow",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TutorialStep {
  number: number;
  title: string;
  description: string;
  tip?: string;
  image: string;
  annotations: Annotation[];
}

// ─── Données des étapes ───────────────────────────────────────────────────────

const STEPS: TutorialStep[] = [
  {
    number: 1,
    title: "Créer un compte PayPal Business",
    description:
      'Rendez-vous sur paypal.com. Sur la page d\'inscription, sélectionnez "Professionnel" (encadré à droite) puis cliquez sur "Commencez maintenant".',
    image: "/tutos/paypal/step-15.png",
    annotations: [
      { type: "circle", cx: 62, cy: 50, r: 13, color: "#7c3aed" },
    ],
  },
  {
    number: 2,
    title: "Remplir le formulaire d'inscription",
    description:
      'Renseignez vos informations : prénom, nom, pays (France), numéro de téléphone, email et mot de passe. Cochez les conditions d\'utilisation, puis cliquez sur "Accepter et ouvrir un compte".',
    image: "/tutos/paypal/step-16.png",
    annotations: [
      { type: "circle", cx: 50, cy: 90, r: 6, color: "#7c3aed" },
    ],
  },
  {
    number: 3,
    title: "Accéder à l'espace développeur",
    description:
      "Une fois connecté à votre dashboard PayPal Business, cliquez sur l'icône </> en haut à droite pour accéder au portail développeur.",
    tip: "Ce bouton est discret — il se trouve dans la barre de navigation supérieure, à droite des autres icônes.",
    image: "/tutos/paypal/step-17.png",
    annotations: [
      { type: "mask", x: 7.5, y: 8, w: 12.5, h: 5, bg: "#f1f5f9" },
      { type: "circle", cx: 91.5, cy: 10.5, r: 1.8, color: "#7c3aed" },
      { type: "badge", x: 81, y: 17, text: "Cliquez ici", color: "#7c3aed" },
    ],
  },
  {
    number: 4,
    title: "Se connecter au portail développeur",
    description:
      'Sur developer.paypal.com, cliquez sur "Log In" en haut à droite. Votre session PayPal Business est reconnue automatiquement — pas besoin de vous reconnecter.',
    image: "/tutos/paypal/step-19.png",
    annotations: [
      { type: "circle", cx: 89, cy: 14, r: 5, color: "#7c3aed" },
    ],
  },
  {
    number: 5,
    title: "Passer en mode Production (Live)",
    description:
      'Par défaut, vous êtes en mode "Sandbox" (tests). Cliquez sur "View live credentials" dans la bannière orange pour accéder aux vraies clés de production.',
    tip: "N'utilisez jamais les clés Sandbox en production — elles ne fonctionnent pas avec de vrais paiements.",
    image: "/tutos/paypal/step-20.png",
    annotations: [
      { type: "mask", x: 7, y: 8.5, w: 12, h: 4, bg: "#001435" },
      { type: "circle", cx: 44, cy: 30, r: 9, color: "#f59e0b" },
    ],
  },
  {
    number: 6,
    title: "Activer le mode Live",
    description:
      'Cliquez sur "Live" dans le sélecteur Sandbox / Live pour basculer définitivement en mode Production.',
    image: "/tutos/paypal/step-21.png",
    annotations: [
      { type: "circle", cx: 72, cy: 50, r: 20, color: "#16a34a" },
    ],
  },
  {
    number: 7,
    title: "Créer une application",
    description:
      'Dans "API Credentials" en mode Live, cliquez sur "Create App". Donnez-lui un nom (ex : FacturNow) et laissez les options par défaut.',
    image: "/tutos/paypal/step-12.png",
    annotations: [
      { type: "circle", cx: 91, cy: 22, r: 2, color: "#7c3aed" },
    ],
  },
  {
    number: 8,
    title: "Copier le Client ID et le Secret",
    description:
      "Votre application est créée. Cliquez sur son nom pour afficher les détails, puis copiez le Client ID et le Client Secret — vous en aurez besoin dans FacturNow.",
    tip: "Le Secret est masqué par défaut. Cliquez sur l'icône œil pour le révéler, puis copiez-le.",
    image: "/tutos/paypal/step-13.png",
    annotations: [
      { type: "mask", x: 7, y: 8.5, w: 12, h: 4, bg: "#001435" },
      { type: "circle", cx: 14, cy: 55, r: 3.5, color: "#7c3aed" },
      { type: "badge", x: 35, y: 63, text: "Client ID", color: "#7c3aed" },
      { type: "badge", x: 57, y: 63, text: "Secret", color: "#003087" },
    ],
  },
  {
    number: 9,
    title: "Configurer le webhook",
    description:
      'Dans les détails de votre app, descendez jusqu\'à "Live Webhooks" et cliquez sur "Add Webhook". Collez l\'URL ci-dessous et cochez les 3 événements : PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED et PAYMENT.CAPTURE.REFUNDED.',
    image: "/tutos/paypal/step-23.png",
    annotations: [
      { type: "mask", x: 7, y: 8.5, w: 12, h: 5, bg: "#001435" },
      { type: "circle", cx: 27, cy: 73, r: 6, color: "#7c3aed" },
    ],
  },
  {
    number: 10,
    title: "Tout est prêt !",
    description:
      "Votre webhook est configuré. Copiez le Webhook ID (cerclé en vert) et retournez dans FacturNow → Paiements → PayPal pour coller vos 3 informations : Client ID, Secret et Webhook ID.",
    image: "/tutos/paypal/step-25.png",
    annotations: [
      { type: "circle", cx: 44, cy: 72, r: 8, color: "#16a34a" },
      { type: "badge", x: 44, y: 83, text: "Copiez ce Webhook ID", color: "#16a34a" },
    ],
  },
];

// ─── Composant page ───────────────────────────────────────────────────────────

export default function PaypalTutorialPage() {
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
      <div className="bg-linear-to-r from-[#003087]/10 via-[#009CDE]/5 to-transparent dark:from-[#003087]/30 dark:via-[#009CDE]/10 border border-[#003087]/20 dark:border-[#003087]/40 rounded-2xl px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#003087]/10 dark:bg-[#003087]/30 border border-[#003087]/20">
            <SiPaypal className="h-6 w-6 text-[#003087] dark:text-[#009CDE]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Connecter PayPal Business
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                ~5 minutes
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {STEPS.length} étapes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* URL du webhook (info utile en haut) */}
      <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl px-4 py-3">
        <Lightbulb className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-0.5">
            URL webhook à copier (étape 9)
          </p>
          <code className="text-xs text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded font-mono">
            https://facturnow.fr/api/webhooks/paypal
          </code>
        </div>
      </div>

      {/* Étapes */}
      <div className="space-y-10">
        {STEPS.map((step) => (
          <div key={step.number} className="space-y-4">
            {/* En-tête de l'étape */}
            <div className="flex items-start gap-4">
              {/* Numéro */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-sm">
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

                {/* Conseil optionnel */}
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
      <div className="bg-linear-to-r from-violet-50 to-white dark:from-violet-950/30 dark:to-transparent border border-violet-200 dark:border-violet-800/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Vous avez tout ce qu'il vous faut !
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Retournez dans FacturNow et collez vos identifiants PayPal pour commencer à recevoir des paiements automatiquement.
        </p>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#003087] hover:opacity-90 transition-opacity px-5 py-2.5 rounded-xl"
        >
          Aller dans Paiements
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
