import type { Metadata } from "next"
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  SecurePaymentsSection,
  HowItWorksSection,
  ProblemSolutionSection,
  PricingSection,
  FaqSection,
  Footer,
  ReviewsCarousel,
} from "@/components/landing"
import { getApprovedReviews } from "@/lib/actions/reviews"

export const metadata: Metadata = {
  title: "FacturNow — Facturation intelligente avec prélèvement SEPA",
  description: "Créez, gérez et encaissez vos factures automatiquement. Devis, factures récurrentes, prélèvement SEPA GoCardless. Essai gratuit 14 jours, sans carte bancaire.",
  keywords: ["facturation en ligne", "logiciel de facturation", "devis freelance", "prélèvement SEPA", "facture automatique", "GoCardless", "auto-entrepreneur"],
  openGraph: {
    title: "FacturNow — Facturation intelligente",
    description: "Automatisez votre facturation avec le prélèvement SEPA. Pour freelances, auto-entrepreneurs et PME.",
    url: "https://facturnow.com",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FacturNow — Facturation intelligente",
    description: "Factures, devis et SEPA automatiques pour les indépendants.",
  },
  alternates: {
    canonical: "https://facturnow.com",
  },
}

export default async function Home() {
  // Récupérer les avis approuvés (Server Component — zéro JS client)
  const reviews = await getApprovedReviews()

  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SecurePaymentsSection />
      <HowItWorksSection />
      <ProblemSolutionSection />
      {/* Carousel d'avis — affiché uniquement si au moins un avis est approuvé */}
      {reviews.length > 0 && <ReviewsCarousel reviews={reviews} />}
      <PricingSection />
      <FaqSection />
      <Footer />
    </>
  )
}
