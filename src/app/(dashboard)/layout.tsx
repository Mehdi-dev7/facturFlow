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
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { getPendingReviewsCount } from "@/lib/actions/reviews";
import { getNewUsersCount } from "@/lib/actions/admin";

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

  let notifications: NotificationCounts = { invoices: false, quotes: false, deposits: false, admin: false };
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

  // Dot admin : avis en attente + nouveaux inscrits 48h (admin uniquement)
  const [pendingReviewsCount, newUsersCount] = isAdmin
    ? await Promise.all([getPendingReviewsCount(), getNewUsersCount()])
    : [0, 0];
  const adminDotCount = pendingReviewsCount + newUsersCount;
  if (isAdmin) notifications.admin = adminDotCount > 0;

  return (
    <>
      <PwaServiceWorker />
      <DashboardShell subscription={subscription} notifications={notifications} isAdmin={isAdmin} pendingReviewsCount={0}>
        {children}
      </DashboardShell>
      {/* Overlay d'onboarding — affiché uniquement pour les nouveaux utilisateurs */}
      <OnboardingTutorial initialCompleted={onboardingCompleted} />
    </>
  );
}
