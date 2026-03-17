import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  Landmark,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Settings,
  FileText,
  Zap,
  Plus,
  Minus,
} from "lucide-react"
import { Navbar, Footer } from "@/components/landing"
import { Button } from "@/components/ui/button"
import { FaqSepa } from "./faq-sepa"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Facture avec Prélèvement SEPA Automatique — Zéro Impayé — FacturNow",
  description:
    "Encaissez vos factures automatiquement par prélèvement SEPA GoCardless. Mandat signé en ligne, prélèvement à l'échéance, zéro impayé. Pour freelances et PME françaises.",
  keywords: [
    "facture prélèvement SEPA",
    "prélèvement SEPA automatique freelance",
    "GoCardless facturation",
    "mandat SEPA facture",
    "encaissement automatique SEPA",
    "zéro impayé freelance",
  ],
  alternates: {
    canonical: "https://facturnow.fr/facture-sepa-prelevement",
  },
  openGraph: {
    title: "Facture avec Prélèvement SEPA Automatique — Zéro Impayé — FacturNow",
    description:
      "Mandat signé en ligne, prélèvement automatique à l'échéance. Fini les relances et les impayés.",
    url: "https://facturnow.fr/facture-sepa-prelevement",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const schemaLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow — Prélèvement SEPA automatique",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr/facture-sepa-prelevement",
  description:
    "Logiciel de facturation avec prélèvement SEPA automatique via GoCardless. Mandat en ligne, encaissement automatique à l'échéance, zéro impayé pour freelances et PME.",
  offers: {
    "@type": "Offer",
    name: "Plan Pro",
    price: "9.99",
    priceCurrency: "EUR",
    description: "SEPA GoCardless, factures illimitées, relances automatiques",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment fonctionne le prélèvement SEPA avec FacturNow ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Connectez GoCardless dans Paramètres → Paiements. Créez une facture avec mode SEPA. Le client signe le mandat en ligne. Après 3-5 jours d'activation, tous les prélèvements sont automatiques.",
      },
    },
    {
      "@type": "Question",
      name: "Mon client doit-il faire quelque chose à chaque facture ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le mandat SEPA est signé une seule fois. Pour les factures récurrentes, tout est automatique : aucune action de votre client. Pour une facture ponctuelle, votre client clique simplement sur le bouton GoCardless dans l'email — le prélèvement est initié et vous recevez le paiement sous 3 à 5 jours ouvrés.",
      },
    },
    {
      "@type": "Question",
      name: "Quels sont les frais GoCardless SEPA ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GoCardless applique 1% + 0,20€ par transaction (plafonné à 4€). FacturNow ne prend aucune commission supplémentaire. Exemple : facture 500€ → frais 5€ → vous recevez 495€.",
      },
    },
    {
      "@type": "Question",
      name: "Le SEPA fonctionne-t-il avec les factures récurrentes ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, c'est la combinaison idéale. Créez une facture récurrente mensuelle avec mode SEPA : FacturNow génère la facture et déclenche le prélèvement automatiquement chaque mois.",
      },
    },
    {
      "@type": "Question",
      name: "Que se passe-t-il si le prélèvement échoue ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GoCardless vous notifie immédiatement en cas d'échec (fonds insuffisants, compte fermé). FacturNow met la facture en statut 'Échec' et vous pouvez relancer manuellement ou par email.",
      },
    },
  ],
}

// ─── Données ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Landmark,
    title: "Mandat SEPA en 2 minutes",
    description:
      "Votre client clique sur le lien, saisit son IBAN et signe électroniquement. Activation bancaire en 3-5 jours. Ensuite, tout est automatique.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    icon: RefreshCw,
    title: "Prélèvement à l'échéance",
    description:
      "FacturNow déclenche le prélèvement automatiquement à la date d'échéance. Vous recevez une notification quand c'est encaissé.",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    icon: Repeat,
    title: "Factures récurrentes SEPA",
    description:
      "Abonnements, prestations mensuelles, loyers : créez une facture récurrente + SEPA. Génération et prélèvement automatiques chaque mois.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    icon: ShieldCheck,
    title: "Sécurisé par GoCardless",
    description:
      "GoCardless est certifié FCA (Royaume-Uni) et agréé ACPR (France). Mandats protégés par le réseau SEPA européen.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
]

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Connectez GoCardless",
    description:
      "Allez dans Paramètres → Paiements → GoCardless. Créez votre compte gratuit (2 min) et autorisez FacturNow. Badge SEPA activé.",
    color: "#4f46e5",
  },
  {
    number: "02",
    icon: FileText,
    title: "Sélectionnez SEPA",
    description:
      "Lors de la création d'une facture, choisissez 'Prélèvement SEPA'. Un lien de signature de mandat est envoyé automatiquement à votre client.",
    color: "#06b6d4",
  },
  {
    number: "03",
    icon: Zap,
    title: "Encaissez automatiquement",
    description:
      "À l'échéance, le prélèvement part tout seul. Facture marquée Payée. Notification reçue. Vous n'avez rien fait.",
    color: "#10b981",
  },
]

const faqs = [
  {
    question: "Comment fonctionne le prélèvement SEPA avec FacturNow ?",
    answer:
      "Connectez GoCardless dans Paramètres → Paiements. Créez une facture avec mode SEPA. Le client signe le mandat en ligne. Après 3-5 jours d'activation, tous les prélèvements sont automatiques.",
  },
  {
    question: "Mon client doit-il faire quelque chose à chaque facture ?",
    answer:
      "Le mandat SEPA est signé une seule fois. Pour les factures récurrentes, tout est automatique : aucune action de votre client. Pour une facture ponctuelle, votre client clique simplement sur le bouton GoCardless dans l'email — le prélèvement est initié et vous recevez le paiement sous 3 à 5 jours ouvrés.",
  },
  {
    question: "Quels sont les frais GoCardless SEPA ?",
    answer:
      "GoCardless applique 1% + 0,20€ par transaction (plafonné à 4€). FacturNow ne prend aucune commission supplémentaire. Exemple : facture 500€ → frais 5€ → vous recevez 495€.",
  },
  {
    question: "Le SEPA fonctionne-t-il avec les factures récurrentes ?",
    answer:
      "Oui, c'est la combinaison idéale. Créez une facture récurrente mensuelle avec mode SEPA : FacturNow génère la facture et déclenche le prélèvement automatiquement chaque mois.",
  },
  {
    question: "Que se passe-t-il si le prélèvement échoue ?",
    answer:
      "GoCardless vous notifie immédiatement en cas d'échec (fonds insuffisants, compte fermé). FacturNow met la facture en statut 'Échec' et vous pouvez relancer manuellement ou par email.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FactureSepaPrelevementPage() {
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
                ⚡ Killer feature — GoCardless SEPA
              </span>
            </div>

            {/* H1 — mot-clé principal */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
              <span className="text-gradient">Prélèvement SEPA automatique</span>
              <br />
              <span className="text-slate-900">zéro impayé, zéro relance</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Connectez GoCardless en 5 minutes. Vos clients signent un mandat SEPA en ligne,
              et chaque facture est prélevée automatiquement à l&apos;échéance. Fini les relances.
            </p>

            {/* Checks rapides */}
            <div className="flex flex-wrap justify-center gap-3 xs:gap-4">
              {[
                "Mandat SEPA signé en ligne",
                "Prélèvement automatique à l'échéance",
                "Factures récurrentes sans effort",
                "Zéro impayé garanti",
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
                  Activer le SEPA gratuitement
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
              Disponible dès le plan Pro • GoCardless 1% + 0,20€/transaction • Sans engagement
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
              Tout ce qu&apos;il faut pour{" "}
              <span className="text-gradient">encaisser sans effort</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              FacturNow s&apos;appuie sur GoCardless, le leader européen du prélèvement SEPA,
              pour automatiser intégralement l&apos;encaissement de vos factures.
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
              En place en{" "}
              <span className="text-gradient">3 étapes</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Connexion, configuration, encaissement. Moins de 10 minutes pour ne plus jamais courir après un paiement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="relative text-center">
                  {/* Connecteur entre étapes */}
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

      {/* ── Bandeau frais SEPA ───────────────────────────────────────────────── */}
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
                Frais SEPA : 1% + 0,20€ — Aucune commission FacturNow
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                GoCardless applique 1% + 0,20€ par transaction. FacturNow ne prend aucune commission.
                Exemple : facture 500€ → vous recevez 494,80€.
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button
                variant="gradient"
                className="h-11 px-6 font-ui text-sm cursor-pointer whitespace-nowrap"
              >
                Activer le SEPA
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
              Tout ce qu&apos;il faut savoir sur le prélèvement SEPA avec FacturNow.
            </p>
          </div>

          <FaqSepa faqs={faqs} />

          {/* CTA final */}
          <div className="text-center mt-16 p-6 xs:p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Fini les impayés, vraiment.
            </h3>
            <p className="text-slate-600 mb-6">
              Activez le prélèvement SEPA et encaissez automatiquement toutes vos factures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
                >
                  Activer le SEPA gratuitement
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
