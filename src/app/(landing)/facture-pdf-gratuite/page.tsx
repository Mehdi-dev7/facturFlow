import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Palette,
  FileCheck,
  Send,
  FileText,
  Eye,
  Download,
} from "lucide-react"
import { Navbar, Footer } from "@/components/landing"
import { Button } from "@/components/ui/button"
import { FaqLanding } from "@/components/landing/faq-landing"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Créer une Facture PDF Gratuite en Ligne — FacturNow",
  description:
    "Créez et téléchargez votre facture PDF gratuitement en 2 minutes. Modèles professionnels, mentions légales conformes, envoi par email intégré. Sans inscription obligatoire.",
  keywords: [
    "facture PDF gratuite",
    "créer facture PDF en ligne",
    "générateur facture PDF",
    "modèle facture PDF",
    "télécharger facture PDF gratuit",
    "facture PDF professionnelle",
  ],
  alternates: {
    canonical: "https://facturnow.fr/facture-pdf-gratuite",
  },
  openGraph: {
    title: "Créer une Facture PDF Gratuite en Ligne — FacturNow",
    description:
      "Factures PDF professionnelles avec logo, couleurs et mentions légales conformes. Téléchargez ou envoyez par email. 10 documents/mois gratuits.",
    url: "https://facturnow.fr/facture-pdf-gratuite",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const schemaLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow — Générateur de Factures PDF Gratuit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr/facture-pdf-gratuite",
  description:
    "Générateur de factures PDF gratuit en ligne. Modèles professionnels personnalisables, mentions légales conformes, envoi par email avec lien de paiement intégré.",
  offers: {
    "@type": "Offer",
    name: "Plan Gratuit",
    price: "0",
    priceCurrency: "EUR",
    description: "10 factures PDF/mois, logo, couleurs, mentions légales conformes",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment créer une facture PDF gratuitement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Créez un compte gratuit sur FacturNow, remplissez les informations de votre facture et cliquez sur Aperçu. Le PDF est généré instantanément. 10 documents/mois inclus gratuitement.",
      },
    },
    {
      "@type": "Question",
      name: "Le PDF généré est-il valable légalement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. FacturNow génère des factures conformes au Code général des impôts français : numérotation, mentions légales, TVA, coordonnées. Acceptées par l'administration et les clients professionnels.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je personnaliser le modèle de facture PDF ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Depuis Dashboard → Apparence, vous pouvez uploader votre logo, choisir vos couleurs de marque, sélectionner une police et personnaliser le footer (IBAN, mentions légales, message).",
      },
    },
    {
      "@type": "Question",
      name: "Comment envoyer la facture PDF par email ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Depuis l'aperçu de la facture, cliquez sur 'Envoyer par email'. FacturNow envoie un email professionnel avec le PDF en pièce jointe et un bouton de paiement intégré.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je générer des devis en PDF aussi ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. FacturNow génère des PDFs pour : factures, devis, acomptes, avoirs, bons de livraison, reçus et proformas. Tous dans le même style avec votre identité visuelle.",
      },
    },
  ],
}

// ─── Données ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Zap,
    title: "PDF instantané",
    description:
      "Votre facture est générée en PDF haute qualité dès que vous cliquez sur Aperçu. Téléchargement en 1 clic.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    icon: Palette,
    title: "Design 100% personnalisable",
    description:
      "Logo, couleurs de marque, police de caractères. Vos factures reflètent votre identité professionnelle.",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    icon: FileCheck,
    title: "Mentions légales automatiques",
    description:
      "SIRET, TVA, numérotation conforme, conditions de paiement. Toutes les mentions obligatoires sont générées automatiquement.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    icon: Send,
    title: "Envoi email avec lien de paiement",
    description:
      "Envoyez la facture PDF directement par email depuis FacturNow. Un bouton de paiement Stripe, PayPal ou SEPA est inclus.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
]

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Remplissez les informations",
    description:
      "Client, prestation, montant. L'auto-complétion depuis votre catalogue rend la saisie ultra-rapide.",
    color: "#4f46e5",
  },
  {
    number: "02",
    icon: Eye,
    title: "Prévisualisez le PDF",
    description:
      "Aperçu en temps réel de votre facture. Ajustez couleurs, logo et mentions jusqu'au résultat parfait.",
    color: "#06b6d4",
  },
  {
    number: "03",
    icon: Download,
    title: "Téléchargez ou envoyez",
    description:
      "PDF téléchargeable immédiatement, ou envoi direct par email avec lien de paiement intégré.",
    color: "#10b981",
  },
]

const faqs = [
  {
    question: "Comment créer une facture PDF gratuitement ?",
    answer:
      "Créez un compte gratuit sur FacturNow, remplissez les informations de votre facture et cliquez sur Aperçu. Le PDF est généré instantanément. 10 documents/mois inclus gratuitement.",
  },
  {
    question: "Le PDF généré est-il valable légalement ?",
    answer:
      "Oui. FacturNow génère des factures conformes au Code général des impôts français : numérotation, mentions légales, TVA, coordonnées. Acceptées par l'administration et les clients professionnels.",
  },
  {
    question: "Puis-je personnaliser le modèle de facture PDF ?",
    answer:
      "Oui. Depuis Dashboard → Apparence, vous pouvez uploader votre logo, choisir vos couleurs de marque, sélectionner une police et personnaliser le footer (IBAN, mentions légales, message).",
  },
  {
    question: "Comment envoyer la facture PDF par email ?",
    answer:
      "Depuis l'aperçu de la facture, cliquez sur 'Envoyer par email'. FacturNow envoie un email professionnel avec le PDF en pièce jointe et un bouton de paiement intégré.",
  },
  {
    question: "Puis-je générer des devis en PDF aussi ?",
    answer:
      "Oui. FacturNow génère des PDFs pour : factures, devis, acomptes, avoirs, bons de livraison, reçus et proformas. Tous dans le même style avec votre identité visuelle.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacturePdfGratuitePage() {
  return (
    <>
      {/* JSON-LD Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Fond radial identique au hero principal */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-50">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-300 h-300 rounded-full blur-3xl opacity-60 animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(79,70,229,0.3), rgba(99,102,241,0.4), rgba(99,102,241,0.3), rgba(6,182,212,0.15))",
            }}
          />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">

            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary">
              <span className="text-sm font-semibold font-ui text-primary">
                📄 Génération PDF instantanée
              </span>
            </div>

            {/* H1 — mot-clé principal */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
              <span className="text-gradient">Créez votre facture PDF</span>
              <br />
              <span className="text-slate-900">gratuitement en 2 minutes</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Générez des factures PDF professionnelles avec logo, couleurs et mentions légales conformes.
              Téléchargez ou envoyez directement par email.
              10 documents/mois gratuits.
            </p>

            {/* Checks rapides */}
            <div className="flex flex-wrap justify-center gap-3 xs:gap-4">
              {[
                "PDF généré en 1 clic",
                "Logo et couleurs personnalisés",
                "Mentions légales incluses",
                "Envoi par email intégré",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 xs:px-4 py-2 xs:py-3 rounded-lg border border-slate-200 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-xs xs:text-sm font-medium text-slate-700 font-ui">{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto h-12 hover:scale-105 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
                >
                  Créer mon compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 border-slate-400 hover:border-primary hover:bg-primary/10 font-semibold font-ui text-base transition-all duration-300 cursor-pointer"
                >
                  Voir les tarifs
                </Button>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-slate-500">
              Sans carte bancaire • 10 documents/mois gratuits • Annulation à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
              Tout ce qu&apos;il faut pour un{" "}
              <span className="text-gradient">PDF professionnel</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              FacturNow génère des PDFs haute qualité à votre image,
              conformes à la réglementation française.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300"
                  style={{ backgroundColor: f.bg, borderColor: f.border }}
                >
                  <div
                    className="inline-flex p-2.5 rounded-xl self-start"
                    style={{ backgroundColor: f.color }}
                  >
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-white">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
              Votre PDF en{" "}
              <span className="text-gradient">3 étapes</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              De la saisie au téléchargement, le processus est fluide et rapide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="relative text-center">
                  {/* Connecteur entre les étapes */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-linear-to-r from-slate-300 to-transparent transform translate-x-6 -translate-y-1/2" />
                  )}
                  {/* Numéro */}
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg mb-6"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                  {/* Icône */}
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}20 0%, ${step.color}10 100%)`,
                      border: `1px solid ${step.color}30`,
                    }}
                  >
                    <Icon className="w-8 h-8" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-slate-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 font-ui leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>

          {/* CTA sous les étapes */}
          <div className="text-center mt-16">
            <Link href="/signup">
              <Button
                size="lg"
                variant="gradient"
                className="h-12 px-8 font-ui text-base hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bandeau gratuit ──────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl border border-violet-200 p-6 xs:p-8 flex flex-col md:flex-row items-center gap-6"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)",
            }}
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shrink-0">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                10 factures PDF gratuites par mois, pour toujours
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Le plan Free de FacturNow inclut 10 documents/mois sans limitation de durée.
                Passez au plan Pro (9,99€/mois) pour des documents illimités.
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button
                variant="gradient"
                className="h-11 px-6 font-ui text-sm cursor-pointer whitespace-nowrap"
              >
                Créer mon compte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-white">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
              Questions{" "}
              <span className="text-gradient">fréquentes</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Tout ce qu&apos;il faut savoir sur la génération de factures PDF avec FacturNow.
            </p>
          </div>

          <FaqLanding faqs={faqs} />

          {/* CTA final */}
          <div className="text-center mt-16 p-6 xs:p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Votre première facture PDF en moins de 2 minutes
            </h3>
            <p className="text-slate-600 mb-6">
              Créez un compte gratuit et générez votre premier PDF professionnel maintenant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 border-slate-400 hover:border-primary hover:bg-primary/10 font-semibold font-ui text-base transition-all duration-300 cursor-pointer"
                >
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
