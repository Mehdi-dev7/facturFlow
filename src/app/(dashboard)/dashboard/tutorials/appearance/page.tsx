import Link from "next/link";
import { ArrowLeft, Clock, Palette, CheckCircle2, Lightbulb, ArrowRight, Type, Eye } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personnaliser l'apparence | FacturNow",
  description: "Guide pour personnaliser l'apparence de vos documents",
};

const STEPS = [
  {
    number: 1,
    icon: Palette,
    title: "Accéder aux paramètres d'apparence",
    description: 'Dans le menu de gauche, cliquez sur "Apparence". Cette page centralise tous les réglages visuels de vos documents.',
    tip: null,
  },
  {
    number: 2,
    icon: Palette,
    title: "Choisir votre couleur principale",
    description: "Cliquez sur le sélecteur de couleur. Vous pouvez choisir parmi les couleurs proposées ou entrer directement un code couleur hexadécimal (ex: #4f46e5). Cette couleur est utilisée pour l'en-tête de vos documents, les titres de sections et les accents.",
    tip: "Choisissez une couleur qui correspond à votre identité visuelle. Un bleu professionnel, un violet créatif, un vert pour les métiers du bien-être — c'est vous qui décidez.",
  },
  {
    number: 3,
    icon: Type,
    title: "Choisir la police de caractères",
    description: "Sélectionnez la police utilisée pour votre nom d'entreprise dans l'en-tête des documents. Plusieurs styles sont disponibles : classique, moderne, élégant. La police s'applique uniquement au nom de votre société pour garder une lisibilité optimale.",
    tip: null,
  },
  {
    number: 4,
    icon: Eye,
    title: "Visualiser en temps réel",
    description: "Un aperçu du document se met à jour en direct à droite de l'écran à chaque modification. Vous voyez exactement ce que verra votre client avant même d'enregistrer.",
    tip: null,
  },
  {
    number: 5,
    icon: CheckCircle2,
    title: "Enregistrer les paramètres",
    description: 'Cliquez sur "Enregistrer". Tous vos futurs documents (factures, devis, acomptes, avoirs...) utiliseront automatiquement ces paramètres. Les documents déjà envoyés ne sont pas modifiés.',
    tip: "Vous pouvez modifier ces paramètres à tout moment. Idéal si vous changez de logo ou rafraîchissez votre identité visuelle.",
  },
];

export default function TutorialAppearancePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Retour */}
      <Link
        href="/dashboard/tutorials"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux tutoriels
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 border border-tertiary/20">
            <Palette className="h-5 w-5 text-tertiary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Personnaliser l'apparence
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              2 minutes
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Donnez une identité visuelle professionnelle à tous vos documents en quelques clics.
        </p>
      </div>

      {/* Ce que vous pouvez personnaliser */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Ce que vous pouvez personnaliser</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          {[
            { label: "Couleur", icon: "🎨" },
            { label: "Police", icon: "🔤" },
            { label: "Logo", icon: "🖼️" },
            { label: "Infos entreprise", icon: "🏢" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number}>
              <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 border border-tertiary/20">
                    <Icon className="h-5 w-5 text-tertiary" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600">
                    {String(step.number).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex-1 min-w-0 pt-1 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {step.tip && (
                    <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{step.tip}</p>
                    </div>
                  )}
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fin */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Votre marque sur chaque document !</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            Couleur et police s'appliquent à tous vos types de documents : factures, devis, acomptes, avoirs, bons de livraison...
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link
          href="/dashboard/tutorials/recurring"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Factures récurrentes
        </Link>
        <Link
          href="/dashboard/tutorials/logo"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Ajouter votre logo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
