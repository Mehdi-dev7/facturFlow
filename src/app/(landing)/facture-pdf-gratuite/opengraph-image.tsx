import { OG_SIZE, OG_CONTENT_TYPE, generateLandingOgImage } from "@/lib/og/generate-og-image"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return generateLandingOgImage({
    badge: "Facture PDF Gratuite",
    title: "Créez votre facture PDF gratuitement",
    subtitle: "PDF professionnel en 30 secondes, mentions légales incluses, envoi par email.",
    features: ["Gratuit", "Logo & couleurs", "Envoi instantané"],
  })
}
