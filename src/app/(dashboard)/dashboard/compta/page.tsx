// src/app/(dashboard)/dashboard/compta/page.tsx
// Server Component — charge le plan user + email comptable, délègue au client

import { redirect } from "next/navigation";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { getAccountantEmail } from "@/lib/actions/accounting";
import { ComptaPageContent } from "@/components/compta/compta-page-content";

export default async function ComptaPage() {
  const subResult = await getCurrentSubscription();
  if (!subResult.success) redirect("/login");

  const accountantEmail = await getAccountantEmail();

  return (
    <ComptaPageContent
      plan={subResult.data.plan}
      effectivePlan={subResult.data.effectivePlan}
      initialAccountantEmail={accountantEmail}
    />
  );
}
