// src/app/(dashboard)/dashboard/stats/page.tsx
// Server Component — charge le plan user et délègue au client

import { redirect } from "next/navigation";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { StatsPageContent } from "@/components/stats/stats-page-content";

export default async function StatsPage() {
  const subResult = await getCurrentSubscription();

  // Pas de session → redirection login
  if (!subResult.success) redirect("/login");

  const plan = subResult.data.plan;
  const effectivePlan = subResult.data.effectivePlan;

  return <StatsPageContent plan={plan} effectivePlan={effectivePlan} />;
}
