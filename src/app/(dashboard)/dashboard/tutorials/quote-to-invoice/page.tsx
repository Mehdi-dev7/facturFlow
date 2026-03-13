import Link from "next/link";
import { ArrowLeft, Clock, FileText, Send, CheckCircle2, Lightbulb, ArrowRight, ThumbsUp, Zap, Receipt } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devis → Facture | FacturNow",
  description: "Guide pour envoyer un devis et le convertir en facture en 1 clic",
};

const STEPS = [
  {
    number: 1,
    icon: FileText,
    title: "Créer un devis",
    description: 'Dans le menu de gauche, cliquez sur "Devis" puis "Nouveau devis". Le formulaire est identique à celui des factures : choisissez votre client, ajoutez vos lignes, vérifiez les totaux.',
    tip: "Un devis a une date de validité — par défaut 30 jours. Passé ce délai, il passe automatiquement en statut \"Expiré\".",
  },
  {
    number: 2,
    icon: Send,
    title: "Envoyer le devis au client",
    description: "Cliquez sur \"Envoyer par email\". Votre client reçoit un email avec le devis en PDF. Il peut l'accepter ou le refuser directement depuis l'email, en un clic, sans avoir besoin de créer un compte.",
    tip: null,
  },
  {
    number: 3,
    icon: ThumbsUp,
    title: "Le client accepte le devis",
    description: "Dès que votre client clique sur \"Accepter\" dans l'email, le statut du devis passe à \"Accepté\" dans votre dashboard. Vous recevez une notification. Un acompte peut être envoyé automatiquement si vous l'avez configuré.",
    tip: null,
  },
  {
    number: 4,
    icon: Zap,
    title: "Convertir en facture en 1 clic",
    description: "Ouvrez la preview du devis accepté (cliquez dessus dans la liste). En bas de la modal, un bouton vert \"Créer la facture\" apparaît. Cliquez dessus — la facture est créée instantanément avec toutes les informations du devis (client, lignes, prix, acompte versé...).",
    tip: "La facture reprend automatiquement l'acompte déjà versé et l'affiche en déduction. Le numéro de facture est généré automatiquement.",
  },
  {
    number: 5,
    icon: Receipt,
    title: "Envoyer la facture finale",
    description: "Vous êtes automatiquement redirigé vers la facture créée. Vérifiez les informations, ajustez si besoin (date d'échéance, notes...) puis cliquez sur \"Envoyer par email\" pour envoyer la facture finale à votre client.",
    tip: null,
  },
];

export default function TutorialQuoteToInvoicePage() {
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
              Devis → Facture en 1 clic
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              3 minutes
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Envoyez un devis, attendez l'accord du client, et convertissez-le en facture instantanément sans ressaisir quoi que ce soit.
        </p>
      </div>

      {/* Flux visuel */}
      <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex-wrap gap-y-3">
        {["Devis", "Envoi", "Accord client", "Facture", "Paiement"].map((label, i, arr) => (
          <div key={label} className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
              {label}
            </span>
            {i < arr.length - 1 && (
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
          </div>
        ))}
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
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        {step.tip}
                      </p>
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
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Zéro ressaisie !</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            Tout le cycle commercial (devis → accord → acompte → facture → paiement) est géré dans FacturNow sans jamais dupliquer de données.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link
          href="/dashboard/tutorials/invoice"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Créer une facture
        </Link>
        <Link
          href="/dashboard/tutorials/recurring"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Factures récurrentes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
