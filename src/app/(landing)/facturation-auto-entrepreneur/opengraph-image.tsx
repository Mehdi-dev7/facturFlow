import { OG_SIZE, OG_CONTENT_TYPE, generateLandingOgImage } from "@/lib/og/generate-og-image"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return generateLandingOgImage({
    badge: "Pour les Auto-Entrepreneurs",
    title: "Facturation auto-entrepreneur conforme",
    subtitle: "Mentions légales obligatoires, franchise TVA, numérotation automatique.",
    features: ["Conforme 2026", "PDF professionnel", "Gratuit jusqu'à 10 docs"],
  })
}
