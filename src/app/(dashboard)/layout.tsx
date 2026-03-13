// src/app/(dashboard)/layout.tsx
// Layout Server Component — récupère les données d'abonnement côté serveur
// et les passe au DashboardShell (client) via props.
// Le dashboard est une application authentifiée : noindex sur tout le groupe.

import type { Metadata } from "next";
import { getCurrentSubscription } from "@/lib/actions/subscription";

// Aucune page du dashboard ne doit être indexée par les moteurs de recherche
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

import { canCreateDocument } from "@/lib/feature-gate";
import { getNotificationCounts } from "@/lib/actions/notifications";
import type { NotificationCounts } from "@/lib/actions/notifications";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import DashboardShell from "@/components/layouts/dashboard-shell";
import { PwaServiceWorker } from "@/components/pwa/pwa-service-worker";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { getPendingReviewsCount } from "@/lib/actions/reviews";

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
  let onboardingCompleted = true; // par défaut : pas d'overlay

  if (session?.user?.id) {
    const [subResult, docCheck, notifCounts, userOnboarding] = await Promise.all([
      getCurrentSubscription(),
      canCreateDocument(session.user.id),
      getNotificationCounts(session.user.id),
      // Récupérer uniquement le champ onboardingCompletedAt pour éviter une surcharge
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompletedAt: true },
      }),
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
    // L'onboarding est considéré terminé si le champ est rempli
    onboardingCompleted = !!userOnboarding?.onboardingCompletedAt;
  }

  // Vérifie si l'utilisateur connecté est admin (server-side only)
  const isAdmin =
    !!session?.user?.email &&
    !!process.env.ADMIN_EMAIL &&
    session.user.email === process.env.ADMIN_EMAIL;

  // Compte des avis en attente (admin uniquement, pour le badge rouge)
  const pendingReviewsCount = isAdmin ? await getPendingReviewsCount() : 0;

  return (
    <>
      <PwaServiceWorker />
      <DashboardShell subscription={subscription} notifications={notifications} isAdmin={isAdmin} pendingReviewsCount={pendingReviewsCount}>
        {children}
      </DashboardShell>
      {/* Overlay d'onboarding — affiché uniquement pour les nouveaux utilisateurs */}
      <OnboardingTutorial initialCompleted={onboardingCompleted} />
      {/* Bannière d'install PWA — Pro/Business uniquement, après 3 jours d'utilisation */}
      {(subscription?.effectivePlan === "PRO" || subscription?.effectivePlan === "BUSINESS") && (
        <PwaInstallBanner />
      )}
    </>
  );
}
