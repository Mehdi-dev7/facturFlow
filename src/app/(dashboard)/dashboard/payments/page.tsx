"use client";

import { CreditCard, Banknote, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-quinary/20 text-quinary">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Paiements
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configurez vos moyens de paiement
          </p>
        </div>
      </div>

      {/* Providers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stripe */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Stripe
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            CB, Apple Pay, Google Pay
          </p>
          <Button variant="outline" className="w-full" disabled>
            Connecter Stripe
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            Bientôt disponible
          </p>
        </div>

        {/* PayPal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              PayPal
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Paiements PayPal
          </p>
          <Button variant="outline" className="w-full" disabled>
            Connecter PayPal
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            Bientôt disponible
          </p>
        </div>

        {/* GoCardless */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Banknote className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              GoCardless
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Prélèvement SEPA automatique
          </p>
          <Button variant="outline" className="w-full" disabled>
            Connecter GoCardless
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            Bientôt disponible
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          🚧 En développement
        </h3>
        <p className="text-sm text-blue-700">
          L'intégration des moyens de paiement est en cours de développement. 
          Vous pourrez bientôt connecter Stripe, PayPal et GoCardless pour automatiser vos encaissements.
        </p>
      </div>
    </div>
  );
}