// src/app/(dashboard)/dashboard/api/page.tsx
// Page API & Webhooks — réservée au plan BUSINESS.
// Server Component : vérifie le plan, charge les données, délègue au Client Component.

import { redirect } from "next/navigation";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { listApiKeys } from "@/lib/actions/api-keys";
import { listWebhookEndpoints, getRecentDeliveries } from "@/lib/actions/webhook-endpoints";
import { ApiPageContent } from "@/components/api/api-page-content";

export default async function ApiPage() {
  // Vérifier session + plan
  const subResult = await getCurrentSubscription();
  if (!subResult.success) redirect("/login");
  if (subResult.data.effectivePlan !== "BUSINESS") redirect("/dashboard/subscription");

  // Charger les données en parallèle
  const [keysResult, endpointsResult, deliveriesResult] = await Promise.all([
    listApiKeys(),
    listWebhookEndpoints(),
    getRecentDeliveries(),
  ]);

  return (
    <ApiPageContent
      initialApiKeys={keysResult.data}
      initialEndpoints={endpointsResult.data}
      initialDeliveries={deliveriesResult.data}
    />
  );
}
