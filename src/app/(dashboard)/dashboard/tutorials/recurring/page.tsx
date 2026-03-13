import Link from "next/link";
import { ArrowLeft, Clock, RefreshCw, Plus, Settings, Send, CheckCircle2, Lightbulb, ArrowRight, AlertTriangle, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Factures récurrentes | FacturNow",
  description: "Guide pour configurer des factures récurrentes automatiques",
};

const STEPS = [
  {
    number: 1,
    icon: RefreshCw,
    title: "Accéder aux factures récurrentes",
    description: 'Dans le menu de gauche, cliquez sur "Récurrences". Cette section liste toutes vos factures programmées. Cliquez sur "Nouvelle récurrence" pour en créer une.',
    tip: null,
    warning: null,
  },
  {
    number: 2,
    icon: Settings,
    title: "Configurer la récurrence",
    description: "Choisissez le client concerné, puis définissez la fréquence : Hebdomadaire, Mensuelle, Trimestrielle ou Annuelle. Indiquez la date de début et optionnellement une date de fin (laissez vide pour une récurrence sans fin).",
    tip: "Exemple : pour facturer un client 500€/mois pour une prestation de maintenance, choisissez \"Mensuelle\" avec la date de début au 1er du mois.",
    warning: null,
  },
  {
    number: 3,
    icon: Plus,
    title: "Ajouter les lignes de facturation",
    description: "Ajoutez les produits/services comme pour une facture classique. Ces lignes seront reproduites identiquement sur chaque facture générée. Vous pouvez choisir le mode de paiement (virement, Stripe, PayPal, ou SEPA automatique).",
    tip: null,
    warning: null,
  },
  {
    number: 4,
    icon: Calendar,
    title: "Activer la récurrence",
    description: 'Cliquez sur "Enregistrer". La récurrence est maintenant active. À chaque échéance, FacturNow génère automatiquement la facture, l\'envoie à votre client par email, et déclenche le paiement SEPA si configuré.',
    tip: "Si vous avez activé GoCardless (SEPA), le prélèvement se fait automatiquement sans aucune action de votre part ni de celle de votre client.",
    warning: null,
  },
  {
    number: 5,
    icon: Send,
    title: "Suivi des factures générées",
    description: 'Les factures créées automatiquement apparaissent dans votre liste "Factures" classique. Vous pouvez les retrouver facilement — elles ont une icône récurrence. Vous recevez un email de confirmation à chaque génération.',
    tip: null,
    warning: "Si votre client n'a pas de mandat SEPA actif, la facture est générée et envoyée par email mais le paiement n'est pas prélevé automatiquement.",
  },
];

export default function TutorialRecurringPage() {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <RefreshCw className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Gérer les factures récurrentes
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              4 minutes
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Configurez une récurrence une seule fois — FacturNow gère automatiquement la création, l'envoi et le paiement de toutes les factures suivantes.
        </p>
      </div>

      {/* Résumé visuel */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Ce qui se passe automatiquement à chaque échéance</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: "Facture générée", icon: "📄" },
            { label: "Email envoyé", icon: "📧" },
            { label: "Paiement SEPA", icon: "💳" },
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                    <Icon className="h-5 w-5 text-accent" />
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
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Zéro impayé, zéro oubli</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            Avec les récurrences + SEPA, vous êtes payé automatiquement chaque mois. Idéal pour les abonnements, la maintenance, les contrats longue durée.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link
          href="/dashboard/tutorials/quote-to-invoice"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Devis
        </Link>
        <Link
          href="/dashboard/tutorials/appearance"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Personnaliser l'apparence
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
