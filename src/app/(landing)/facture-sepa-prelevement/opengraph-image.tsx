import { OG_SIZE, OG_CONTENT_TYPE, generateLandingOgImage } from "@/lib/og/generate-og-image"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return generateLandingOgImage({
    badge: "Prélèvement SEPA Automatique",
    title: "Facture avec prélèvement SEPA intégré",
    subtitle: "Le client signe le mandat une fois, vous prélevez automatiquement à chaque échéance.",
    features: ["Zéro impayé", "GoCardless", "1% + 0,20€/transaction"],
  })
}
