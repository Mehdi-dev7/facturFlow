import Link from "next/link";
import { ArrowLeft, Clock, ImageIcon, CheckCircle2, Lightbulb, ArrowRight, Building2, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ajouter votre logo | FacturNow",
  description: "Guide pour ajouter votre logo et vos informations entreprise",
};

const STEPS = [
  {
    number: 1,
    icon: Building2,
    title: "Accéder aux paramètres entreprise",
    description: 'Dans le menu de gauche, cliquez sur "Apparence". La première section concerne les informations de votre entreprise (nom, adresse, SIRET, TVA...). Ces informations apparaissent automatiquement sur tous vos documents.',
    tip: null,
    warning: null,
  },
  {
    number: 2,
    icon: ImageIcon,
    title: "Uploader votre logo",
    description: "Dans la section logo, cliquez sur la zone d'upload ou glissez-déposez votre fichier image. Les formats acceptés sont PNG, JPG et SVG. Votre logo s'affiche dans l'en-tête de tous vos documents.",
    tip: "Utilisez de préférence un logo PNG avec fond transparent pour un rendu professionnel. Taille recommandée : 400×200px minimum.",
    warning: null,
  },
  {
    number: 3,
    icon: Building2,
    title: "Renseigner vos informations légales",
    description: "Vérifiez que votre nom d'entreprise, adresse, SIRET et numéro de TVA (si applicable) sont bien renseignés. Ces informations sont obligatoires sur les factures légales françaises et apparaissent en bas de chaque document.",
    tip: null,
    warning: "Le SIRET et l'adresse sont obligatoires sur les factures en France. Assurez-vous qu'ils sont corrects avant d'envoyer vos premiers documents.",
  },
  {
    number: 4,
    icon: CheckCircle2,
    title: "Enregistrer",
    description: 'Cliquez sur "Enregistrer". Votre logo et vos informations sont immédiatement actifs sur tous les nouveaux documents générés.',
    tip: "Vous pouvez changer de logo à tout moment — par exemple si vous faites évoluer votre identité visuelle.",
    warning: null,
  },
];

export default function TutorialLogoPage() {
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
            <ImageIcon className="h-5 w-5 text-tertiary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Ajouter votre logo et vos infos
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              2 minutes
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Ajoutez votre logo et vos informations légales pour des documents 100% professionnels et conformes.
        </p>
      </div>

      {/* Exemple visuel text */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exemple d'en-tête de facture</p>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-1">
          <div className="flex justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800 dark:text-slate-200">[ VOTRE LOGO ]</p>
              <p className="text-slate-600 dark:text-slate-400">Votre Entreprise SAS</p>
              <p className="text-slate-500">123 rue de la Paix, 75001 Paris</p>
              <p className="text-slate-500">SIRET : 123 456 789 00010</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold text-slate-800 dark:text-slate-200">FACTURE</p>
              <p className="text-slate-600 dark:text-slate-400">N° INV-2026-0001</p>
              <p className="text-slate-500">Date : 12/03/2026</p>
            </div>
          </div>
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

                  {step.warning && (
                    <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{step.warning}</p>
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
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Prêt à facturer !</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            Votre logo et vos informations sont en place. Vos clients reçoivent des documents professionnels et conformes à la législation française.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-start">
        <Link
          href="/dashboard/tutorials/appearance"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Personnaliser l'apparence
        </Link>
      </div>
    </div>
  );
}
