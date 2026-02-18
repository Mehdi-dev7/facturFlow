"use client";

import { Crown, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-quinary/20 text-quinary">
          <Crown className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Abonnement
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gérez votre abonnement FacturFlow
          </p>
        </div>
      </div>

      {/* Plan actuel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Plan actuel
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vous êtes actuellement sur le plan Gratuit
            </p>
          </div>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300">
            Gratuit
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="h-4 w-4 text-green-500" />
            10 documents par mois
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="h-4 w-4 text-green-500" />
            5 clients maximum
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="h-4 w-4 text-green-500" />
            PDF basique
          </div>
        </div>
      </div>

      {/* Plans disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Pro */}
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-2xl border-2 border-primary/40 p-6 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Recommandé
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Plan Pro
            </h3>
            <div className="text-3xl font-bold text-primary mb-1">
              14€
              <span className="text-base font-normal text-slate-600 dark:text-slate-400">
                /mois
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pour freelances et PME
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Documents illimités
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Clients illimités
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Prélèvement SEPA automatique
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Factures récurrentes
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              9 templates métiers
            </div>
          </div>

          <Button className="w-full" disabled>
            Passer au Pro
          </Button>
        </div>

        {/* Plan Business */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Plan Business
            </h3>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              29€
              <span className="text-base font-normal text-slate-600 dark:text-slate-400">
                /mois
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pour entreprises B2B
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Tout du plan Pro
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Multi-utilisateurs (3 comptes)
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              API & Webhooks
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Facturation électronique illimitée
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Support prioritaire
            </div>
          </div>

          <Button variant="outline" className="w-full" disabled>
            Passer au Business
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          🚧 Bientôt disponible
        </h3>
        <p className="text-sm text-blue-700">
          Les abonnements payants seront disponibles prochainement. 
          En attendant, profitez gratuitement de toutes les fonctionnalités de base !
        </p>
      </div>
    </div>
  );
}