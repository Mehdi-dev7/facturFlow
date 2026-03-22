import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  FileText,
  MousePointerClick,
  Banknote,
  LayoutDashboard,
  Plus,
  Minus,
} from "lucide-react"
import { Navbar, Footer, RelatedPages } from "@/components/landing"
import { Button } from "@/components/ui/button"
import { FaqFreelance } from "./faq-freelance"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Devis et Facture Freelance en Ligne — Conversion en 1 Clic — FacturNow",
  description:
    "Créez des devis professionnels et convertissez-les en factures en 1 clic. Acompte automatique, suivi des acceptations, paiement en ligne. Pour freelances français.",
  keywords: [
    "devis facture freelance",
    "logiciel devis freelance",
    "convertir devis en facture",
    "devis professionnel freelance",
    "acompte automatique freelance",
    "suivi devis client",
  ],
  alternates: {
    canonical: "https://facturnow.fr/devis-facture-freelance",
  },
  openGraph: {
    title: "Devis et Facture Freelance en Ligne — Conversion en 1 Clic — FacturNow",
    description:
      "Créez des devis professionnels et convertissez-les en factures en 1 clic. Acompte automatique, suivi des acceptations, paiement en ligne.",
    url: "https://facturnow.fr/devis-facture-freelance",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const schemaLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacturNow — Devis et Facture Freelance",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://facturnow.fr/devis-facture-freelance",
  description:
    "Logiciel de devis et facturation pour freelances. Créez un devis professionnel, votre client accepte en ligne, la facture et l'acompte partent automatiquement.",
  offers: {
    "@type": "Offer",
    name: "Plan Gratuit",
    price: "0",
    priceCurrency: "EUR",
    description: "10 documents/mois, devis et factures, conversion en 1 clic",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment envoyer un devis professionnel en tant que freelance ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Depuis FacturNow, créez un devis en 2 minutes avec vos prestations et tarifs. Le client reçoit un email avec le PDF et un bouton Accepter/Refuser. Vous êtes notifié instantanément.",
      },
    },
    {
      "@type": "Question",
      name: "Comment convertir un devis en facture ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dans FacturNow, ouvrez le devis accepté et cliquez sur 'Convertir en facture'. Toutes les lignes sont reprises automatiquement. Plus aucune re-saisie.",
      },
    },
    {
      "@type": "Question",
      name: "Doit-on envoyer un acompte après l'acceptation d'un devis ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ce n'est pas obligatoire mais fortement recommandé (30-50% du montant). FacturNow peut envoyer l'acompte automatiquement dès l'acceptation du devis.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps un devis est-il valable ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La durée de validité est libre (30 jours en général). FacturNow passe automatiquement les devis expirés en statut Annulé et vous envoie une notification.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je relancer un client qui n'a pas répondu à mon devis ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Depuis la liste des devis, vous pouvez renvoyer le devis par email en 1 clic. Votre client reçoit un email avec deux boutons pour accepter ou refuser directement, sans avoir besoin de créer un compte.",
      },
    },
  ],
}

// ─── Données ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: "Devis professionnel",
    description:
      "Créez des devis avec vos prestations, conditions de paiement et validité. Logo et couleurs de marque inclus. PDF généré instantanément.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    icon: MousePointerClick,
    title: "Acceptation en ligne",
    description:
      "Votre client reçoit un email avec un bouton Accepter/Refuser. Sa réponse est enregistrée automatiquement avec horodatage.",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    icon: ArrowRight,
    title: "Conversion instantanée",
    description:
      "Devis accepté → 1 clic pour créer la facture correspondante. Toutes les lignes sont reprises. Zéro re-saisie.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    icon: Banknote,
    title: "Acompte automatique",
    description:
      "Dès l'acceptation du devis, FacturNow peut envoyer automatiquement une demande d'acompte (30%, 50%... au choix).",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
]

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Créez et envoyez le devis",
    description:
      "Remplissez les prestations, montants et conditions. Le devis part par email avec un lien d'acceptation sécurisé.",
    color: "#4f46e5",
  },
  {
    number: "02",
    icon: MousePointerClick,
    title: "Le client accepte en ligne",
    description:
      "Votre client clique sur Accepter depuis son email. Vous êtes notifié instantanément. Le devis passe en statut Accepté.",
    color: "#06b6d4",
  },
  {
    number: "03",
    icon: Banknote,
    title: "Facturez et encaissez",
    description:
      "Convertissez en facture en 1 clic. L'acompte part automatiquement. Le solde est réglé en ligne via Stripe, PayPal ou SEPA.",
    color: "#10b981",
  },
]

const faqs = [
  {
    question: "Comment envoyer un devis professionnel en tant que freelance ?",
    answer:
      "Depuis FacturNow, créez un devis en 2 minutes avec vos prestations et tarifs. Le client reçoit un email avec le PDF et un bouton Accepter/Refuser. Vous êtes notifié instantanément.",
  },
  {
    question: "Comment convertir un devis en facture ?",
    answer:
      "Dans FacturNow, ouvrez le devis accepté et cliquez sur 'Convertir en facture'. Toutes les lignes sont reprises automatiquement. Plus aucune re-saisie.",
  },
  {
    question: "Doit-on envoyer un acompte après l'acceptation d'un devis ?",
    answer:
      "Ce n'est pas obligatoire mais fortement recommandé (30-50% du montant). FacturNow peut envoyer l'acompte automatiquement dès l'acceptation du devis.",
  },
  {
    question: "Combien de temps un devis est-il valable ?",
    answer:
      "La durée de validité est libre (30 jours en général). FacturNow passe automatiquement les devis expirés en statut Annulé et vous envoie une notification.",
  },
  {
    question: "Puis-je relancer un client qui n'a pas répondu à mon devis ?",
    answer:
      "Oui. Depuis la liste des devis, vous pouvez renvoyer le devis par email en 1 clic. Votre client reçoit un email avec deux boutons pour accepter ou refuser directement, sans avoir besoin de créer un compte.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevisFactureFreelancePage() {
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
                🔄 Du devis au paiement automatisé
              </span>
            </div>

            {/* H1 — mot-clé principal */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
              <span className="text-gradient">Devis et factures freelance</span>
              <br />
              <span className="text-slate-900">de la mission au paiement</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Envoyez un devis professionnel, votre client accepte en ligne, la facture
              et l&apos;acompte partent automatiquement. Tout le cycle de votre mission
              géré en un seul outil.
            </p>

            {/* Checks rapides */}
            <div className="flex flex-wrap justify-center gap-3 xs:gap-4">
              {[
                "Devis professionnel en 2 min",
                "Acceptation en ligne par le client",
                "Conversion devis → facture en 1 clic",
                "Acompte envoyé automatiquement",
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
              Tout le cycle de votre{" "}
              <span className="text-gradient">mission freelance</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Du premier devis à l&apos;encaissement final, FacturNow automatise
              chaque étape pour que vous vous concentriez sur votre métier.
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
              Une mission facturée en{" "}
              <span className="text-gradient">3 étapes</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              De l&apos;envoi du devis à l&apos;encaissement, tout est automatisé.
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

      {/* ── Bandeau suivi cycle de vie ────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl border border-violet-200 p-6 xs:p-8 flex flex-col md:flex-row items-center gap-6"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)",
            }}
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shrink-0">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Suivi complet du cycle de vie de chaque mission
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Statuts en temps réel : Brouillon → Envoyé → Accepté/Refusé → Facturé → Payé.
                Tableau de bord centralisé avec tous vos devis et leur avancement.
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
              Tout ce qu&apos;un freelance doit savoir sur les devis et la facturation.
            </p>
          </div>

          <FaqFreelance faqs={faqs} />

          {/* CTA final */}
          <div className="text-center mt-16 p-6 xs:p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              De la mission au paiement, en automatique.
            </h3>
            <p className="text-slate-600 mb-6">
              Arrêtez de jongler entre emails, Excel et Word. Tout dans FacturNow.
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

      {/* Maillage interne — liens vers les autres landing pages et articles */}
      <RelatedPages
        pages={["logiciel-facturation-freelance", "encaissement-facture-en-ligne", "facture-pdf-gratuite"]}
        articles={["devis-facture", "impayes"]}
      />

      <Footer />
    </>
  )
}
