import { OG_SIZE, OG_CONTENT_TYPE, generateLandingOgImage } from "@/lib/og/generate-og-image"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return generateLandingOgImage({
    badge: "Devis & Factures Freelance",
    title: "Devis et factures pour freelances",
    subtitle: "Transformez un devis accepté en facture en 1 clic. Paiement intégré.",
    features: ["Devis → Facture", "Acomptes", "Paiement en ligne"],
  })
}
