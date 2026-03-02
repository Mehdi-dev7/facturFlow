// src/app/(dashboard)/layout.tsx
// Layout Server Component — récupère les données d'abonnement côté serveur
// et les passe au DashboardShell (client) via props.

import { getCurrentSubscription } from "@/lib/actions/subscription";
import { canCreateDocument } from "@/lib/feature-gate";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import DashboardShell from "@/components/layouts/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Récupérer la session (Server Side)
  const session = await auth.api.getSession({ headers: await headers() });

  // Données d'abonnement (succès ou null si non connecté)
  let subscription: {
    plan: string;
    effectivePlan: string;
    trialDaysLeft: number | null;
    documentsThisMonth: number;
  } | undefined = undefined;

  if (session?.user?.id) {
    const [subResult, docCheck] = await Promise.all([
      getCurrentSubscription(),
      canCreateDocument(session.user.id),
    ]);

    if (subResult.success) {
      subscription = {
        plan: subResult.data.plan,
        effectivePlan: subResult.data.effectivePlan,
        trialDaysLeft: subResult.data.trialDaysLeft,
        // count = nb de documents créés ce mois (0 pour plans illimités)
        documentsThisMonth: docCheck.count,
      };
    }
  }

  return (
    <DashboardShell subscription={subscription}>
      {children}
    </DashboardShell>
  );
}
