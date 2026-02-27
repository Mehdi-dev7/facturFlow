// Page Apparence — Server Component
// Récupère les données de l'utilisateur et passe les valeurs initiales au composant client

import { AppearancePageContent } from "@/components/appearance/appearance-page-content";
import { getAppearanceSettings } from "@/lib/actions/appearance";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Apparence | FacturNow",
  description: "Personnalisez le style de vos documents",
};

export default async function AppearancePage() {
  const settings = await getAppearanceSettings();

  // Non authentifié → redirect login
  if (settings === null) redirect("/login");

  return (
    <div className="px-0 sm:px-4 lg:px-8 py-6 max-w-[1100px] 2xl:max-w-[1400px] mx-auto">
      <AppearancePageContent
        initial={{
          themeColor:  settings.themeColor,
          companyFont: settings.companyFont,
          companyName: settings.companyName,
          companyLogo: settings.companyLogo,
        }}
      />
    </div>
  );
}
