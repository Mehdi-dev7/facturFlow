import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  FileText,
  Send,
  CreditCard,
  ShieldCheck,
  Receipt,
  Hash,
  Percent,
  Plus,
  Minus,
} from "lucide-react"
import { Navbar, Footer } from "@/components/landing"
import { Button } from "@/components/ui/button"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Facturation Auto-Entrepreneur Gratuit et Conforme — FacturNow",
  description:
    "Créez vos factures auto-entrepreneur conformes en 2 minutes. Mentions légales obligatoires, numérotation automatique, PDF professionnel. Gratuit jusqu'à 10 documents/mois.",
  keywords: [
    "facturation auto-entrepreneur",
    "facture auto-entrepreneur gratuit",
    "logiciel facturation micro-entreprise",
    "mentions légales auto-entrepreneur",
    "facture conforme auto-entrepreneur",
    "TVA non applicable art 293 B",
    "numéro de facture auto-entrepreneur",
  ],
  alternates: {
    canonical: "https://facturnow.fr/facturation-auto-entrepreneur",
  },
  openGraph: {
    title: "Facturation Auto-Entrepreneur Gratuit et Conforme — FacturNow",
    description:
      "Factures conformes, mentions légales automatiques, PDF professionnel. Gratuit jusqu'à 10 documents/mois.",
    url: "https://facturnow.fr/facturation-auto-entrepreneur",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const schemaLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow — Facturation Auto-Entrepreneur",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr/facturation-auto-entrepreneur",
  description:
    "Logiciel de facturation gratuit pour auto-entrepreneurs. Factures conformes avec mentions légales obligatoires, numérotation automatique, export PDF.",
  offers: {
    "@type": "Offer",
    name: "Plan Gratuit",
    price: "0",
    priceCurrency: "EUR",
    description: "10 factures/mois, PDF professionnel, mentions légales conformes",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quelles sont les mentions légales obligatoires sur une facture auto-entrepreneur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Une facture auto-entrepreneur doit obligatoirement mentionner : votre nom/prénom, numéro SIRET, adresse, date et numéro de facture, description de la prestation, montant HT, et la mention 'TVA non applicable, art. 293 B du CGI' si vous êtes en franchise de TVA. FacturNow génère toutes ces mentions automatiquement.",
      },
    },
    {
      "@type": "Question",
      name: "Un auto-entrepreneur est-il obligé de facturer ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, tout auto-entrepreneur doit émettre une facture pour chaque prestation ou vente. La facture est obligatoire entre professionnels (B2B) et recommandée pour les particuliers au-dessus de 25€. L'absence de facturation est passible d'une amende.",
      },
    },
    {
      "@type": "Question",
      name: "Comment numéroter ses factures en auto-entrepreneur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La numérotation doit être chronologique, continue et sans interruption. Exemple : FAC-2026-0001, FAC-2026-0002... FacturNow gère la numérotation automatiquement — impossible de créer des doublons ou des trous dans la séquence.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il mentionner la TVA sur une facture auto-entrepreneur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Si vous êtes en franchise en base de TVA (seuils : 36 800€ pour services, 91 900€ pour ventes), vous devez obligatoirement écrire 'TVA non applicable, art. 293 B du CGI'. FacturNow insère cette mention en 1 clic depuis les paramètres.",
      },
    },
  ],
}

// ─── Données ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: ShieldCheck,
    title: "Mentions légales conformes",
    description:
      "SIRET, adresse, numéro de facture, mention franchise TVA — toutes les obligations légales générées automatiquement.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    icon: Hash,
    title: "Numérotation automatique",
    description:
      "Séquence chronologique et continue, sans doublons. Format personnalisable : FAC-2026-0001.",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    icon: Percent,
    title: "Franchise TVA en 1 clic",
    description:
      "Insère automatiquement 'TVA non applicable, art. 293 B du CGI' dans le footer de vos documents.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    icon: Receipt,
    title: "PDF professionnel instantané",
    description:
      "Logo, couleurs, police de votre choix. Vos factures ressemblent à celles d'une grande entreprise.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
]

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Créez votre facture",
    description:
      "Sélectionnez votre client, ajoutez vos prestations. Les calculs et mentions légales s'ajoutent automatiquement.",
    color: "#4f46e5",
  },
  {
    number: "02",
    icon: Send,
    title: "Envoyez par email",
    description:
      "PDF généré instantanément, email envoyé avec un lien de paiement Stripe, PayPal ou SEPA intégré.",
    color: "#06b6d4",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Recevez le paiement",
    description:
      "Votre client paie en 1 clic. La facture passe automatiquement en statut Payée. Zéro relance.",
    color: "#10b981",
  },
]

const faqs = [
  {
    question: "Quelles sont les mentions légales obligatoires sur une facture auto-entrepreneur ?",
    answer:
      "Nom/prénom, numéro SIRET, adresse, date et numéro de facture, description de la prestation, montant, et 'TVA non applicable, art. 293 B du CGI' si franchise. FacturNow génère tout automatiquement.",
  },
  {
    question: "Un auto-entrepreneur doit-il obligatoirement émettre des factures ?",
    answer:
      "Oui. La facture est obligatoire en B2B (entre professionnels) et recommandée pour les particuliers au-dessus de 25€. L'absence de facturation est passible d'une amende.",
  },
  {
    question: "Comment numéroter ses factures correctement ?",
    answer:
      "La numérotation doit être chronologique, continue, sans trous ni doublons. FacturNow s'en charge automatiquement — format personnalisable (ex: FAC-2026-0001).",
  },
  {
    question: "Faut-il mentionner la TVA en franchise de base ?",
    answer:
      "Oui, vous devez écrire 'TVA non applicable, art. 293 B du CGI'. FacturNow insère cette mention en 1 clic depuis les paramètres d'apparence.",
  },
  {
    question: "FacturNow est-il vraiment gratuit pour les auto-entrepreneurs ?",
    answer:
      "Oui, le plan Free inclut 10 documents/mois, 5 clients, PDF professionnel et toutes les mentions légales. Aucune carte bancaire requise.",
  },
]

// ─── Composant FAQ local (client) ─────────────────────────────────────────────

import { FaqAutoEntrepreneur } from "./faq-auto-entrepreneur"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacturationAutoEntrepreneurPage() {
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
                🧾 Dédié aux auto-entrepreneurs
              </span>
            </div>

            {/* H1 — mot-clé principal */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
              <span className="text-gradient">Facturation auto-entrepreneur</span>
              <br />
              <span className="text-slate-900">gratuite et conforme</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Créez vos factures conformes en 2 minutes. Mentions légales obligatoires,
              numérotation automatique, franchise TVA en 1 clic.
              Gratuit jusqu&apos;à 10 documents/mois, sans carte bancaire.
            </p>

            {/* Checks rapides */}
            <div className="flex flex-wrap justify-center gap-3 xs:gap-4">
              {[
                "Mentions légales automatiques",
                "Numérotation conforme",
                "PDF professionnel",
                "Franchise TVA en 1 clic",
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
              Tout ce qu&apos;exige{" "}
              <span className="text-gradient">l&apos;administration</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              FacturNow connaît les obligations légales des auto-entrepreneurs
              et les applique automatiquement sur chaque document.
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
              Une facture en{" "}
              <span className="text-gradient">3 étapes</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              De la création à l&apos;encaissement, tout est automatisé.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="relative text-center">
                  {/* Connecteur */}
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

          {/* CTA */}
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

      {/* ── Bandeau conformité ───────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl border border-violet-200 p-6 xs:p-8 flex flex-col md:flex-row items-center gap-6"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)",
            }}
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shrink-0">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Conforme à la réglementation française 2026
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                FacturNow respecte toutes les obligations du Code général des impôts
                pour les auto-entrepreneurs et micro-entreprises. Facturation électronique
                obligatoire incluse dès septembre 2026.
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
              Tout ce qu&apos;un auto-entrepreneur doit savoir sur la facturation.
            </p>
          </div>

          <FaqAutoEntrepreneur faqs={faqs} />

          {/* CTA final */}
          <div className="text-center mt-16 p-6 xs:p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Prêt à facturer en règle ?
            </h3>
            <p className="text-slate-600 mb-6">
              Rejoignez les auto-entrepreneurs qui facturent avec FacturNow.
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
