// TEMPORAIRE — redirige vers la page Coming Soon
// Pour restaurer la landing page, supprimer ce fichier et décommenter landing-page.tsx.bak
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/coming-soon");
}
