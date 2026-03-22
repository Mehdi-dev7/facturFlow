// Server Component — pas de hooks ni event handlers
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

// ─── Données personas ─────────────────────────────────────────────────────────

const personas = [
  {
    id: "freelance",
    emoji: "💻",
    label: "Freelance",
    // H3 optimisé pour le mot-clé "logiciel facturation freelance"
    title: "Logiciel de facturation pour freelances",
    subtitle: "Concentrez-vous sur vos missions, pas sur la paperasse.",
    color: "#4f46e5",
    bgColor: "#eef2ff",
    borderColor: "#c7d2fe",
    // Lien contextuel vers la landing page dédiée (maillage interne SEO)
    landingHref: "/logiciel-facturation-freelance",
    features: [
      "Factures et devis illimités en quelques clics",
      "Templates adaptés à votre métier (web, design, conseil...)",
      "Paiement Stripe, PayPal ou SEPA intégré",
      "Relances automatiques pour zéro impayé",
      "Export comptable CSV et FEC",
    ],
  },
  {
    id: "auto-entrepreneur",
    emoji: "🧾",
    label: "Auto-entrepreneur",
    // H3 optimisé pour "facturation auto-entrepreneur"
    title: "Facturation auto-entrepreneur conforme",
    subtitle: "Toutes les mentions légales obligatoires, automatiquement générées.",
    color: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    landingHref: "/facturation-auto-entrepreneur",
    features: [
      "Mention franchise TVA insertable en 1 clic",
      "Numérotation automatique et continue",
      "Franchise de TVA ou collecte — au choix",
      "Factures PDF professionnelles en 1 clic",
      "Gratuit jusqu'à 10 documents/mois",
    ],
  },
  {
    id: "pme",
    emoji: "🏢",
    label: "TPE / PME",
    // H3 optimisé pour "logiciel facturation PME"
    title: "Solution de facturation pour TPE et PME",
    subtitle: "Gérez plusieurs utilisateurs, clients et projets depuis un seul outil.",
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    landingHref: "/encaissement-facture-en-ligne",
    features: [
      "Multi-utilisateurs (jusqu'à 3 comptes)",
      "API & Webhooks pour connecter votre CRM ou ERP",
      "Export FEC et URSSAF pour votre comptable",
      "Facturation électronique obligatoire incluse (sept. 2026)",
      "Relances automatiques à 3 niveaux",
    ],
  },
]

// ─── Section ──────────────────────────────────────────────────────────────────

export function ForWhoSection() {
  return (
    <section id="pour-qui" className=" bg-slate-50">
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Fait pour <span className="text-gradient">vous</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Que vous soyez freelance, auto-entrepreneur ou dirigeant d&apos;une TPE/PME,
            FacturNow s&apos;adapte à votre situation et à vos obligations légales.
          </p>
        </div>

        {/* 3 cartes persona */}
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          {personas.map((persona) => (
            <div
              key={persona.id}
              id={persona.id}
              className="rounded-2xl border p-6 flex flex-col gap-5 hover:shadow-md transition-shadow duration-300 h-full"
              style={{ backgroundColor: persona.bgColor, borderColor: persona.borderColor }}
            >
              {/* Emoji + badge label */}
              <div className="flex items-center gap-3">
                <span className="text-3xl" role="img" aria-hidden="true">{persona.emoji}</span>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: persona.color }}
                >
                  {persona.label}
                </span>
              </div>

              {/* Titre H3 + sous-titre */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{persona.title}</h3>
                <p className="text-sm text-slate-500">{persona.subtitle}</p>
              </div>

              {/* Liste des bénéfices */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {persona.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: persona.color }} />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA — lien vers la landing dédiée (maillage interne SEO) */}
              <Link
                href={persona.landingHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold mt-2 hover:gap-2.5 transition-all duration-200"
                style={{ color: persona.color }}
              >
                En savoir plus
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
