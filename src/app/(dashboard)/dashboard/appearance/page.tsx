// Page Apparence — Server Component
// Récupère les données de l'utilisateur et passe les valeurs initiales au composant client.
// Wrappée dans FeatureGate custom_appearance pour les plans FREE.

import { AppearancePageContent } from "@/components/appearance/appearance-page-content";
import { getAppearanceSettings } from "@/lib/actions/appearance";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Apparence | FacturNow",
  description: "Personnalisez le style de vos documents",
};

export default async function AppearancePage() {
  const [settings, subResult] = await Promise.all([
    getAppearanceSettings(),
    getCurrentSubscription(),
  ]);

  // Non authentifié → redirect login
  if (settings === null) redirect("/login");

  const plan = subResult.success ? subResult.data.plan : "FREE";
  const effectivePlan = subResult.success ? subResult.data.effectivePlan : "FREE";

  return (
    <div className="px-0 sm:px-4 lg:px-8 py-6 max-w-[1100px] 2xl:max-w-[1400px] mx-auto">
      {/* FeatureGate : custom_appearance = PRO uniquement */}
      <FeatureGate
        feature="custom_appearance"
        plan={plan}
        effectivePlan={effectivePlan}
      >
        <AppearancePageContent
          initial={{
            themeColor:    settings.themeColor,
            companyFont:   settings.companyFont,
            companyName:   settings.companyName,
            companyLogo:   settings.companyLogo,
            invoiceFooter: settings.invoiceFooter,
          }}
        />
      </FeatureGate>
    </div>
  );
}
