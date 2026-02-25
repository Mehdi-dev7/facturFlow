// Page Apparence — Server Component
// Récupère les données de l'utilisateur et passe les valeurs initiales au composant client

import { AppearancePageContent } from "@/components/appearance/appearance-page-content";
import { getAppearanceSettings } from "@/lib/actions/appearance";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Apparence | FacturFlow",
  description: "Personnalisez le style de vos documents",
};

export default async function AppearancePage() {
  const settings = await getAppearanceSettings();

  // Non authentifié → redirect login
  if (settings === null) redirect("/login");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px] mx-auto">
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
