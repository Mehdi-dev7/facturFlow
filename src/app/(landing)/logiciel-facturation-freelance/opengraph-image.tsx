import { OG_SIZE, OG_CONTENT_TYPE, generateLandingOgImage } from "@/lib/og/generate-og-image"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return generateLandingOgImage({
    badge: "Pour les Freelances",
    title: "Logiciel de facturation pour freelances",
    subtitle: "Devis, factures, relances automatiques et paiement en 1 clic.",
    features: ["Essai gratuit 7j", "SEPA automatique", "Zéro impayé"],
  })
}
