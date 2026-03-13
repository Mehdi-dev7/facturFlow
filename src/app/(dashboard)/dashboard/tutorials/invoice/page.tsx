import Link from "next/link";
import { ArrowLeft, Clock, FileText, Plus, Send, Eye, CheckCircle2, Lightbulb, ArrowRight, User, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer votre première facture | FacturNow",
  description: "Guide pour créer et envoyer votre première facture avec FacturNow",
};

const STEPS = [
  {
    number: 1,
    icon: Plus,
    title: "Accéder à la création de facture",
    description: 'Dans le menu de gauche, cliquez sur "Factures" puis sur le bouton "Nouvelle facture" en haut à droite.',
    tip: null,
  },
  {
    number: 2,
    icon: User,
    title: "Sélectionner votre client",
    description: "Commencez à taper le nom du client dans le champ de recherche. Sélectionnez-le dans la liste. S'il n'existe pas encore, cliquez sur \"+ Nouveau client\" pour le créer à la volée.",
    tip: "Le numéro de facture est généré automatiquement — vous n'avez pas à vous en occuper.",
  },
  {
    number: 3,
    icon: Package,
    title: "Ajouter les produits / services",
    description: 'Cliquez sur "Ajouter une ligne". Vous pouvez choisir un produit existant depuis votre catalogue, ou saisir une description manuelle. Renseignez la quantité et le prix unitaire. La TVA est appliquée automatiquement selon le taux configuré.',
    tip: null,
  },
  {
    number: 4,
    icon: FileText,
    title: "Vérifier les totaux et les paramètres",
    description: "Le sous-total, la TVA et le total TTC sont calculés automatiquement. Vous pouvez ajouter une remise (en % ou montant fixe), modifier la date d'échéance, choisir le mode de paiement (virement, Stripe, PayPal, SEPA) et ajouter des notes.",
    tip: null,
  },
  {
    number: 5,
    icon: Eye,
    title: "Prévisualiser le PDF",
    description: 'Cliquez sur "Aperçu PDF" pour voir exactement ce que recevra votre client — votre logo, vos couleurs, toutes les informations légales. Si tout est bon, passez à l\'étape suivante.',
    tip: null,
  },
  {
    number: 6,
    icon: Send,
    title: "Enregistrer et envoyer",
    description: 'Cliquez sur "Enregistrer" pour créer la facture en brouillon, ou directement sur "Envoyer par email" pour l\'envoyer à votre client. Un email professionnel avec le PDF en pièce jointe et un lien de paiement est envoyé automatiquement.',
    tip: "Votre client reçoit un email avec le PDF en pièce jointe. Si vous avez activé Stripe ou PayPal, un bouton de paiement en ligne est inclus dans l'email.",
  },
];

export default function TutorialInvoicePage() {
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
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Créer votre première facture
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              2 minutes
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Suivez ces étapes pour créer, personnaliser et envoyer votre première facture en quelques clics.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="relative">
              {/* Ligne connecteur */}
              {index < STEPS.length - 1 && (
                <div className="absolute left-5 top-14 w-0.5 h-4 bg-slate-200 dark:bg-slate-700" />
              )}

              <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                {/* Badge numéro */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600">
                    {String(step.number).padStart(2, "0")}
                  </span>
                </div>

                {/* Contenu */}
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
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        {step.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Flèche entre étapes */}
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
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Votre facture est envoyée !</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            Elle apparaît dans votre liste avec le statut "Envoyée". Dès que votre client paie, le statut passe automatiquement à "Payée".
          </p>
        </div>
      </div>

      {/* Lien suivant */}
      <div className="flex justify-end">
        <Link
          href="/dashboard/tutorials/quote-to-invoice"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Tutoriel suivant : Devis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
