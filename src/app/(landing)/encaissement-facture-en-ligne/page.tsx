import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Wallet,
  Landmark,
  Bell,
  Settings,
  Send,
  BadgeCheck,
} from "lucide-react"
import { Navbar, Footer, RelatedPages } from "@/components/landing"
import { Button } from "@/components/ui/button"
import { FaqLanding } from "@/components/landing/faq-landing"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Encaissez vos Factures en Ligne en 1 Clic — Stripe, PayPal, SEPA — FacturNow",
  description:
    "Recevez vos paiements en ligne instantanément. Lien de paiement Stripe, PayPal ou SEPA intégré dans chaque facture. Vos clients paient en 1 clic, vous êtes notifié immédiatement.",
  keywords: [
    "encaisser facture en ligne",
    "paiement facture en ligne",
    "lien paiement facture",
    "facture avec paiement en ligne",
    "recevoir paiement facture freelance",
    "encaissement automatique facture",
  ],
  alternates: {
    canonical: "https://facturnow.fr/encaissement-facture-en-ligne",
  },
  openGraph: {
    title: "Encaissez vos Factures en Ligne en 1 Clic — Stripe, PayPal, SEPA — FacturNow",
    description:
      "Lien de paiement Stripe, PayPal ou SEPA intégré dans chaque facture. Vos clients paient en 1 clic, vous êtes notifié immédiatement.",
    url: "https://facturnow.fr/encaissement-facture-en-ligne",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const schemaLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow — Encaissement de Factures en Ligne",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr/encaissement-facture-en-ligne",
  description:
    "Encaissez vos factures en ligne via Stripe, PayPal ou prélèvement SEPA GoCardless. Lien de paiement intégré dans chaque email, notification instantanée, réconciliation automatique.",
  offers: {
    "@type": "Offer",
    name: "Plan Pro",
    price: "9.99",
    priceCurrency: "EUR",
    description: "Stripe, PayPal et SEPA GoCardless inclus. Aucune commission FacturNow.",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment ajouter un lien de paiement sur mes factures ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Connectez Stripe, PayPal ou GoCardless dans Paramètres → Paiements. FacturNow ajoute automatiquement les boutons de paiement dans chaque email de facture envoyé.",
      },
    },
    {
      "@type": "Question",
      name: "Mes clients doivent-ils avoir un compte pour payer ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. Stripe permet le paiement par carte sans compte. PayPal propose aussi le paiement invité. Seul SEPA nécessite de signer un mandat une première fois.",
      },
    },
    {
      "@type": "Question",
      name: "FacturNow prend-il une commission sur les paiements ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. FacturNow ne prend aucune commission. Seuls les frais des processeurs s'appliquent : Stripe (~1,5% + 0,25€), PayPal (~2,5-3,5%), GoCardless SEPA (1% + 0,20€).",
      },
    },
    {
      "@type": "Question",
      name: "Comment savoir quand une facture a été payée ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vous recevez une notification email immédiate dès qu'un paiement est reçu. La facture passe automatiquement en statut Payée dans votre tableau de bord.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je utiliser plusieurs moyens de paiement en même temps ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Vous pouvez connecter Stripe, PayPal et GoCardless simultanément. Votre client voit les boutons des providers que vous avez activés et choisit celui qu'il préfère.",
      },
    },
  ],
}

// ─── Données ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: CreditCard,
    title: "Stripe — CB, Apple Pay, Google Pay",
    description:
      "Vos clients paient par carte bancaire, Apple Pay ou Google Pay. Paiement sécurisé PCI-DSS. Frais : ~1,5% + 0,25€.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    icon: Wallet,
    title: "PayPal — 400M d'utilisateurs",
    description:
      "Le bouton PayPal préféré de vos clients. Paiement en 1 clic sans saisir de numéro de carte. Frais : ~2,5-3,5%.",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    icon: Landmark,
    title: "SEPA — Prélèvement automatique",
    description:
      "Mandat signé une seule fois, prélèvement automatique à chaque échéance. Idéal pour les missions récurrentes. Frais : 1% + 0,20€.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    icon: Bell,
    title: "Notification temps réel",
    description:
      "Dès qu'un paiement est reçu, votre facture passe automatiquement en statut Payée et vous recevez une notification.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
]

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Connectez votre moyen de paiement",
    description:
      "Stripe, PayPal ou GoCardless SEPA — connectez-les en 5 minutes depuis Paramètres → Paiements. Tutoriels pas-à-pas inclus.",
    color: "#4f46e5",
  },
  {
    number: "02",
    icon: Send,
    title: "Envoyez la facture",
    description:
      "Votre client reçoit un email avec le PDF et un bouton de paiement. Il choisit son moyen de paiement préféré et paie en 1 clic.",
    color: "#06b6d4",
  },
  {
    number: "03",
    icon: BadgeCheck,
    title: "Encaissez automatiquement",
    description:
      "Paiement reçu → facture marquée Payée → vous êtes notifié. La réconciliation est automatique, zéro action manuelle.",
    color: "#10b981",
  },
]

const faqs = [
  {
    question: "Comment ajouter un lien de paiement sur mes factures ?",
    answer:
      "Connectez Stripe, PayPal ou GoCardless dans Paramètres → Paiements. FacturNow ajoute automatiquement les boutons de paiement dans chaque email de facture envoyé.",
  },
  {
    question: "Mes clients doivent-ils avoir un compte pour payer ?",
    answer:
      "Non. Stripe permet le paiement par carte sans compte. PayPal propose aussi le paiement invité. Seul SEPA nécessite de signer un mandat une première fois.",
  },
  {
    question: "FacturNow prend-il une commission sur les paiements ?",
    answer:
      "Non. FacturNow ne prend aucune commission. Seuls les frais des processeurs s'appliquent : Stripe (~1,5% + 0,25€), PayPal (~2,5-3,5%), GoCardless SEPA (1% + 0,20€).",
  },
  {
    question: "Comment savoir quand une facture a été payée ?",
    answer:
      "Vous recevez une notification email immédiate dès qu'un paiement est reçu. La facture passe automatiquement en statut Payée dans votre tableau de bord.",
  },
  {
    question: "Puis-je utiliser plusieurs moyens de paiement en même temps ?",
    answer:
      "Oui. Vous pouvez connecter Stripe, PayPal et GoCardless simultanément. Votre client voit les boutons des providers que vous avez activés et choisit celui qu'il préfère.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EncaissementFactureEnLignePage() {
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
        {/* Fond radial */}
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
                💳 Stripe • PayPal • SEPA GoCardless
              </span>
            </div>

            {/* H1 — mot-clé principal */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
              <span className="text-gradient">Encaissez vos factures</span>
              <br />
              <span className="text-slate-900">en ligne en 1 clic</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Chaque facture FacturNow contient un lien de paiement intégré.
              Vos clients paient par carte, PayPal ou prélèvement SEPA directement depuis
              leur email. Vous êtes notifié en temps réel.
            </p>

            {/* Checks rapides */}
            <div className="flex flex-wrap justify-center gap-3 xs:gap-4">
              {[
                "Lien de paiement dans chaque email",
                "Carte, PayPal ou SEPA au choix",
                "Notification instantanée à chaque paiement",
                "Aucune commission FacturNow",
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
                  Activer les paiements en ligne
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
              Sans carte bancaire • Essai 7 jours Pro inclus • Annulation à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
              3 providers,{" "}
              <span className="text-gradient">1 seule intégration</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Connectez une fois vos comptes de paiement et FacturNow s&apos;occupe
              de tout — génération des liens, redirection client, mise à jour des statuts.
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
              Encaissez en{" "}
              <span className="text-gradient">3 étapes</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              De la connexion du provider à l&apos;encaissement automatique,
              tout est guidé et fluide.
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

      {/* ── Bandeau ──────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl border border-violet-200 p-6 xs:p-8 flex flex-col md:flex-row items-center gap-6"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)",
            }}
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shrink-0">
              <Landmark className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Vous gardez 100% de vos revenus
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                FacturNow ne prend aucune commission sur vos paiements. Seuls les frais standards
                de Stripe, PayPal ou GoCardless s&apos;appliquent — les mêmes que si vous les
                utilisiez directement.
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
              Tout ce qu&apos;il faut savoir sur l&apos;encaissement de factures en ligne.
            </p>
          </div>

          <FaqLanding faqs={faqs} />

          {/* CTA final */}
          <div className="text-center mt-16 p-6 xs:p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Vos clients paient, vous dormez.
            </h3>
            <p className="text-slate-600 mb-6">
              Activez les paiements en ligne et encaissez automatiquement toutes vos factures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
                >
                  Activer les paiements en ligne
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

      {/* Maillage interne — liens vers les autres landing pages et articles */}
      <RelatedPages
        pages={["facture-sepa-prelevement", "logiciel-facturation-freelance", "facturation-auto-entrepreneur"]}
        articles={["impayes", "sepa"]}
      />

      <Footer />
    </>
  )
}
