import { OG_SIZE, OG_CONTENT_TYPE, generateLandingOgImage } from "@/lib/og/generate-og-image"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return generateLandingOgImage({
    badge: "Encaissement en Ligne",
    title: "Encaissez vos factures en ligne",
    subtitle: "Stripe, PayPal ou SEPA — votre client paye en 1 clic depuis la facture.",
    features: ["Stripe & PayPal", "SEPA Direct", "Paiement instantané"],
  })
}
