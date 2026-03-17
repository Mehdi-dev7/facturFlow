import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  Briefcase,
  GitMerge,
  Bell,
  BarChart2,
  FileText,
  Send,
  CreditCard,
  ShieldCheck,
} from "lucide-react"
import { Navbar, Footer } from "@/components/landing"
import { Button } from "@/components/ui/button"
import { FaqLanding } from "@/components/landing/faq-landing"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Logiciel de Facturation pour Freelances — Gratuit — FacturNow",
  description:
    "Le meilleur logiciel de facturation pour freelances. Devis, factures, relances automatiques et paiement en 1 clic. Essai gratuit 7 jours sans carte bancaire.",
  keywords: [
    "logiciel facturation freelance",
    "application facturation freelance",
    "facturation freelance gratuit",
    "devis facture freelance",
    "logiciel devis freelance",
  ],
  alternates: {
    canonical: "https://facturnow.fr/logiciel-facturation-freelance",
  },
  openGraph: {
    title: "Logiciel de Facturation pour Freelances — Gratuit — FacturNow",
    description:
      "Devis, factures, relances automatiques et paiement en 1 clic. Essai gratuit 7 jours sans carte bancaire.",
    url: "https://facturnow.fr/logiciel-facturation-freelance",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const schemaLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow — Logiciel de Facturation Freelance",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr/logiciel-facturation-freelance",
  description:
    "Logiciel de facturation gratuit pour freelances. Devis, factures, relances automatiques, paiement Stripe/PayPal/SEPA intégré.",
  offers: {
    "@type": "Offer",
    name: "Plan Gratuit",
    price: "0",
    priceCurrency: "EUR",
    description: "10 documents/mois, 5 clients, PDF professionnel, templates métier",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quel logiciel de facturation choisir quand on est freelance ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FacturNow est conçu pour les freelances : création rapide, templates métiers, paiement en 1 clic et relances automatiques. Gratuit jusqu'à 10 documents/mois, sans carte bancaire.",
      },
    },
    {
      "@type": "Question",
      name: "Comment créer une facture freelance conforme ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Une facture freelance doit mentionner vos coordonnées, SIRET, numéro de facture, description, montant et TVA. FacturNow génère toutes ces mentions automatiquement.",
      },
    },
    {
      "@type": "Question",
      name: "Peut-on envoyer des devis et des factures avec le même outil ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. FacturNow gère devis, factures, acomptes, avoirs et bons de livraison depuis un seul tableau de bord. La conversion devis → facture se fait en 1 clic.",
      },
    },
    {
      "@type": "Question",
      name: "Comment recevoir des paiements en ligne en tant que freelance ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Connectez Stripe (CB, Apple Pay), PayPal ou GoCardless (SEPA) dans vos paramètres. Chaque facture inclut automatiquement un bouton de paiement pour vos clients.",
      },
    },
    {
      "@type": "Question",
      name: "Les relances automatiques fonctionnent-elles vraiment ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. FacturNow envoie 3 niveaux de relances (J+2, J+7, J+15 après échéance) par email. Vous pouvez personnaliser les délais et les messages.",
      },
    },
  ],
}

// ─── Données ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Briefcase,
    title: "Templates par métier",
    description:
      "9 templates adaptés : web, design, conseil, photographie, rédaction, coaching... Personnalisez avec votre logo et vos couleurs.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    icon: GitMerge,
    title: "Devis → Facture en 1 clic",
    description:
      "Convertissez un devis accepté en facture définitive instantanément. L'acompte est envoyé automatiquement.",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    icon: Bell,
    title: "Zéro relance manuelle",
    description:
      "3 niveaux de relances envoyés automatiquement : amiable, ferme, formelle. Vous dormez, FacturNow relance.",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  {
    icon: BarChart2,
    title: "Statistiques en temps réel",
    description:
      "CA mensuel, factures en attente, taux de paiement. Tout en un coup d'oeil depuis votre tableau de bord.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
]

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Créez votre devis",
    description:
      "Sélectionnez un template métier, ajoutez vos prestations avec auto-complétion depuis votre catalogue produits.",
    color: "#4f46e5",
  },
  {
    number: "02",
    icon: Send,
    title: "Convertissez en facture",
    description:
      "Client accepte ? 1 clic pour transformer le devis en facture. L'acompte part automatiquement.",
    color: "#06b6d4",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Encaissez sans effort",
    description:
      "Stripe, PayPal ou SEPA intégré dans l'email. Notification immédiate à chaque paiement reçu.",
    color: "#10b981",
  },
]

const faqs = [
  {
    question: "Quel logiciel de facturation choisir quand on est freelance ?",
    answer:
      "FacturNow est conçu pour les freelances : création rapide, templates métiers, paiement en 1 clic et relances automatiques. Gratuit jusqu'à 10 documents/mois, sans carte bancaire.",
  },
  {
    question: "Comment créer une facture freelance conforme ?",
    answer:
      "Une facture freelance doit mentionner vos coordonnées, SIRET, numéro de facture, description, montant et TVA. FacturNow génère toutes ces mentions automatiquement.",
  },
  {
    question: "Peut-on envoyer des devis et des factures avec le même outil ?",
    answer:
      "Oui. FacturNow gère devis, factures, acomptes, avoirs et bons de livraison depuis un seul tableau de bord. La conversion devis → facture se fait en 1 clic.",
  },
  {
    question: "Comment recevoir des paiements en ligne en tant que freelance ?",
    answer:
      "Connectez Stripe (CB, Apple Pay), PayPal ou GoCardless (SEPA) dans vos paramètres. Chaque facture inclut automatiquement un bouton de paiement pour vos clients.",
  },
  {
    question: "Les relances automatiques fonctionnent-elles vraiment ?",
    answer:
      "Oui. FacturNow envoie 3 niveaux de relances (J+2, J+7, J+15 après échéance) par email.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogicielFacturationFreelancePage() {
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
                💻 Pour freelances web, design & conseil
              </span>
            </div>

            {/* H1 — mot-clé principal */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
              <span className="text-gradient">Logiciel de facturation</span>
              <br />
              <span className="text-slate-900">pensé pour les freelances</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Gérez devis, factures et relances depuis un seul outil. Paiement Stripe, PayPal
              ou SEPA intégré. Concentrez-vous sur vos missions, pas sur la paperasse.
            </p>

            {/* Checks rapides */}
            <div className="flex flex-wrap justify-center gap-3 xs:gap-4">
              {[
                "Devis → Facture en 1 clic",
                "Templates par métier",
                "Paiement instantané",
                "Relances automatiques",
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
              Sans carte bancaire • 7 jours d&apos;essai Pro offerts • Annulation à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
              Tout ce dont un{" "}
              <span className="text-gradient">freelance a besoin</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              FacturNow automatise toute la partie administrative pour que vous
              puissiez vous concentrer sur ce qui compte : vos missions.
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
              De la mission à{" "}
              <span className="text-gradient">l&apos;encaissement</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Devis, facture, paiement — 3 étapes, tout est automatisé.
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
                Conforme à la facturation électronique 2026
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                FacturNow inclut la facturation électronique obligatoire dès septembre 2026
                — format Factur-X via SuperPDP, partenaire agréé DGFiP.
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
              Tout ce qu&apos;un freelance doit savoir sur la facturation.
            </p>
          </div>

          <FaqLanding faqs={faqs} />

          {/* CTA final */}
          <div className="text-center mt-16 p-6 xs:p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Prêt à facturer comme un pro ?
            </h3>
            <p className="text-slate-600 mb-6">
              Rejoignez les freelances qui ont arrêté de courir après leurs paiements.
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
