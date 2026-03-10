// src/app/(dashboard)/layout.tsx
// Layout Server Component — récupère les données d'abonnement côté serveur
// et les passe au DashboardShell (client) via props.

import { getCurrentSubscription } from "@/lib/actions/subscription";
import { canCreateDocument } from "@/lib/feature-gate";
import { getNotificationCounts } from "@/lib/actions/notifications";
import type { NotificationCounts } from "@/lib/actions/notifications";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import DashboardShell from "@/components/layouts/dashboard-shell";
import { PwaServiceWorker } from "@/components/pwa/pwa-service-worker";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";

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

  let notifications: NotificationCounts = { invoices: false, quotes: false, deposits: false };

  if (session?.user?.id) {
    const [subResult, docCheck, notifCounts] = await Promise.all([
      getCurrentSubscription(),
      canCreateDocument(session.user.id),
      getNotificationCounts(session.user.id),
    ]);

    if (subResult.success) {
      subscription = {
        plan: subResult.data.plan,
        effectivePlan: subResult.data.effectivePlan,
        trialDaysLeft: subResult.data.trialDaysLeft,
        documentsThisMonth: docCheck.count,
      };
    }

    notifications = notifCounts;
  }

  // Vérifie si l'utilisateur connecté est admin (server-side only)
  const isAdmin =
    !!session?.user?.email &&
    !!process.env.ADMIN_EMAIL &&
    session.user.email === process.env.ADMIN_EMAIL;

  return (
    <>
      <PwaServiceWorker />
      <DashboardShell subscription={subscription} notifications={notifications} isAdmin={isAdmin}>
        {children}
      </DashboardShell>
      {/* Bannière d'install PWA — Pro/Business uniquement, après 3 jours d'utilisation */}
      {(subscription?.effectivePlan === "PRO" || subscription?.effectivePlan === "BUSINESS") && (
        <PwaInstallBanner />
      )}
    </>
  );
}
