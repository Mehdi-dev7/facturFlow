// TEMPORAIRE — redirige vers la page Coming Soon en production uniquement
// Pour restaurer la landing page, supprimer ce fichier et décommenter landing-page.tsx.bak
import { redirect } from "next/navigation";

export default function Page() {
  if (process.env.NODE_ENV === "production") {
    redirect("/coming-soon");
  }
  // En dev : redirige directement vers le dashboard
  redirect("/dashboard");
}
