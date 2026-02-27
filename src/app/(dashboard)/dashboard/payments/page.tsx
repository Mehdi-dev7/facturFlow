// src/app/(dashboard)/dashboard/payments/page.tsx
// Page Paiements — Server Component qui charge les comptes connectés et passe au client

import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getPaymentAccounts } from "@/lib/actions/payments";
import { PaymentsPageContent } from "@/components/payments/payments-page-content";

export default async function PaymentsPage() {
  const accounts = await getPaymentAccounts();

  // Pas de session → redirection login
  if (accounts === null) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Paiements
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Connectez vos moyens de paiement pour encaisser automatiquement
          </p>
        </div>
      </div>

      {/* Contenu interactif (client) */}
      <PaymentsPageContent initialAccounts={accounts} />
    </div>
  );
}
