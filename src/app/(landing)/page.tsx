import type { Metadata } from "next"
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  ForWhoSection,
  SecurePaymentsSection,
  HowItWorksSection,
  ProblemSolutionSection,
  EInvoicingSection,
  PricingSection,
  FaqSection,
  Footer,
  ReviewsCarousel,
} from "@/components/landing"
import { getApprovedReviews } from "@/lib/actions/reviews"

export const metadata: Metadata = {
  title: "FacturNow — Facturation intelligente avec prélèvement SEPA",
  description: "Créez, gérez et encaissez vos factures automatiquement. Devis, factures récurrentes, prélèvement SEPA GoCardless. Essai gratuit 7 jours, sans carte bancaire.",
  keywords: [
    "facturation en ligne",
    "logiciel de facturation",
    "devis freelance",
    "prélèvement SEPA automatique",
    "facture automatique",
    "GoCardless France",
    "auto-entrepreneur facturation",
    "logiciel devis facture PME",
    "facturation récurrente",
  ],
  alternates: {
    canonical: "https://facturnow.fr",
  },
  openGraph: {
    title: "FacturNow — Facturation intelligente avec prélèvement SEPA",
    description: "Automatisez votre facturation et encaissez sans impayés grâce au prélèvement SEPA. Pour freelances, auto-entrepreneurs et PME françaises.",
    url: "https://facturnow.fr",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
    // L'image OG est auto-détectée depuis /app/opengraph-image.tsx par Next.js
  },
  twitter: {
    card: "summary_large_image",
    title: "FacturNow — Facturation intelligente avec prélèvement SEPA",
    description: "Factures, devis et SEPA automatiques pour les indépendants et PME françaises. Essai gratuit 7 jours.",
  },
}

// ─── Schema.org JSON-LD ────────────────────────────────────────────────────────

// SoftwareApplication : indique à Google que c'est un logiciel SaaS
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr",
  description:
    "Logiciel de facturation en ligne avec prélèvement SEPA automatique pour freelances, auto-entrepreneurs et PME françaises.",
  offers: [
    {
      "@type": "Offer",
      name: "Plan Gratuit",
      price: "0",
      priceCurrency: "EUR",
      description: "10 documents/mois, 5 clients, virement bancaire",
    },
    {
      "@type": "Offer",
      name: "Plan Pro",
      price: "9.99",
      priceCurrency: "EUR",
      billingIncrement: "P1M",
      description: "Documents illimités, SEPA, relances auto, factures récurrentes",
    },
    {
      "@type": "Offer",
      name: "Plan Business",
      price: "25",
      priceCurrency: "EUR",
      billingIncrement: "P1M",
      description: "Tout Pro + multi-utilisateurs, API, facturation électronique illimitée",
    },
  ],
  featureList: [
    "Prélèvement SEPA automatique via GoCardless",
    "Factures et devis illimités",
    "Relances automatiques",
    "Paiements Stripe, PayPal et SEPA",
    "Export comptable FEC et URSSAF",
    "Facturation récurrente",
    "E-invoicing obligatoire (Factur-X / SuperPDP)",
  ],
  // L'og:image est générée dynamiquement par Next.js — son URL publique est /opengraph-image
  screenshot: "https://facturnow.fr/opengraph-image",
  author: {
    "@type": "Organization",
    name: "FacturNow",
    url: "https://facturnow.fr",
  },
}

// Organization : signal d'autorité pour Google Knowledge Graph
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FacturNow",
  url: "https://facturnow.fr",
  logo: "https://facturnow.fr/logo/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@facturnow.fr",
    contactType: "customer support",
    availableLanguage: "French",
  },
  // sameAs : profils officiels sur les annuaires et réseaux — renforce l'autorité de domaine
  // Ajouter les liens LinkedIn, Twitter/X, Product Hunt etc. quand ils existent
  sameAs: [
    "https://www.linkedin.com/company/facturnow",
  ],
}

// FAQPage : booste les featured snippets dans les SERP (extrait enrichi)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment fonctionne le prélèvement SEPA automatique ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Connectez GoCardless dans Paramètres → Paiements. Lors de la création d'une facture, sélectionnez 'Prélèvement SEPA'. Votre client signe un mandat en ligne (2 min), et les prélèvements sont ensuite automatiques à chaque échéance.",
      },
    },
    {
      "@type": "Question",
      name: "FacturNow est-il gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, FacturNow propose un plan gratuit avec 10 documents par mois et 5 clients. L'essai gratuit 7 jours du plan Pro est disponible sans carte bancaire.",
      },
    },
    {
      "@type": "Question",
      name: "FacturNow est-il conforme à la facturation électronique obligatoire ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, FacturNow est en cours d'agrégation Plateforme Agréée (PA) via SuperPDP. La conformité Factur-X / Chorus Pro est incluse dans les plans Pro et Business, avant l'obligation légale de septembre 2026 pour les entreprises B2B.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je annuler mon abonnement à tout moment ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, sans engagement. Vous pouvez résilier depuis Dashboard → Abonnement. Vous conservez l'accès jusqu'à la fin de la période payée et vos données pendant 90 jours.",
      },
    },
    {
      "@type": "Question",
      name: "Y a-t-il des frais cachés sur les paiements ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. FacturNow ne prend aucune commission sur vos paiements. Seuls les frais des processeurs s'appliquent : Stripe (~1,5% + 0,25€), PayPal (~2,5-3,5%), GoCardless SEPA (1% + 0,20€).",
      },
    },
  ],
}

export default async function Home() {
  // Récupérer les avis approuvés (Server Component — zéro JS client)
  const reviews = await getApprovedReviews()

  return (
    <>
      {/* JSON-LD Schema.org — données structurées pour Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      {/* Section "Pour qui ?" — SEO personas : freelance, auto-entrepreneur, PME */}
      <ForWhoSection />
      <SecurePaymentsSection />
      <HowItWorksSection />
      <ProblemSolutionSection />
      {/* Section facturation électronique 2026 — mot-clé chaud, conformité Factur-X */}
      <EInvoicingSection />
      {/* Carousel d'avis — affiché uniquement si au moins un avis est approuvé */}
      {reviews.length > 0 && <ReviewsCarousel reviews={reviews} />}
      <PricingSection />
      <FaqSection />
      <Footer />
    </>
  )
}
