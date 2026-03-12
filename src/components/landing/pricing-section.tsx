"use client"

import { Check, X, Star, Zap, Building } from "lucide-react"
import { Button } from "@/components/ui/button"

type FeatureValue = string | boolean

interface Feature {
  name: string
  free: FeatureValue
  pro: FeatureValue
  business: FeatureValue
}

export function PricingSection() {
  const allFeatures: Feature[] = [
    // LIMITES
    { name: "Documents par mois",              free: "10",       pro: "Illimités",   business: "Illimités" },
    { name: "Clients",                          free: "5",        pro: "Illimités",   business: "Illimités" },
    { name: "Utilisateurs",                     free: "1 compte", pro: "1 compte",    business: "3 comptes" },

    // PAIEMENTS
    { name: "🔥 Prélèvement SEPA automatique", free: false,      pro: true,          business: true },
    { name: "Stripe CB / Apple Pay / Google Pay",free: false,    pro: true,          business: true },
    { name: "PayPal",                           free: false,      pro: true,          business: true },
    { name: "Virement bancaire (IBAN affiché)", free: true,       pro: true,          business: true },

    // FEATURES CLÉS
    { name: "Factures récurrentes",             free: false,      pro: true,          business: true },
    { name: "Relances automatiques (3 niveaux)",free: false,      pro: true,          business: true },
    { name: "Apparence & templates métiers",    free: false,      pro: "9 templates", business: "9 templates" },
    { name: "Statistiques & export CSV",        free: false,      pro: true,          business: true },

    // COMPTABILITÉ & AVANCÉ
    { name: "Export FEC comptable",             free: false,      pro: false,         business: true },
    { name: "Bilan annuel & URSSAF",            free: false,      pro: false,         business: true },
    { name: "API & Webhooks",                   free: false,      pro: false,         business: true },
    { name: "Support prioritaire",              free: false,      pro: false,         business: true },

    // E-INVOICING
    { name: "Facturation électronique",         free: "5/mois",   pro: "Illimitée",   business: "Illimitée" },
  ]

  const plans = [
    {
      name: "Gratuit",
      subtitle: "Pour démarrer",
      price: "0",
      period: "/ mois",
      description: "7 jours d'essai Pro inclus, puis 10 documents/mois",
      cta: "Commencer gratuitement",
      popular: false,
      icon: Star,
      bgColor: "bg-linear-to-br from-slate-50 to-slate-100",
      borderColor: "border-slate-300",
      iconBg: "bg-slate-200",
      iconColor: "text-slate-600",
    },
    {
      name: "Pro",
      subtitle: "Freelances · Auto-entrepreneurs · PME",
      price: "9,99",
      period: "/ mois",
      description: "Documents & clients illimités · SEPA · récurrentes",
      cta: "Choisir Pro",
      popular: true,
      icon: Zap,
      bgColor: "bg-linear-to-br from-primary/10 via-violet-50/50 to-primary/5 dark:from-primary/20 dark:via-[#1e1845] dark:to-primary/10",
      borderColor: "border-primary/40",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      badge: "⭐ Le plus populaire",
    },
    {
      name: "Business",
      subtitle: "Entreprises B2B · Équipes",
      price: "25",
      period: "/ mois",
      description: "Tout Pro + multi-users + comptabilité + API",
      cta: "Choisir Business",
      popular: false,
      icon: Building,
      bgColor: "bg-linear-to-br from-amber-50 via-white to-blue-50",
      borderColor: "border-amber-300",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ]

  const getFeatureValue = (feature: Feature, planIndex: number): FeatureValue => {
    const planKeys: (keyof Feature)[] = ["free", "pro", "business"]
    return feature[planKeys[planIndex]]
  }

  const renderFeatureIcon = (value: FeatureValue) => {
    if (value === false) {
      return (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 shrink-0 mt-0.5">
          <X className="w-3 h-3 text-slate-400" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 shrink-0 mt-0.5">
        <Check className="w-3 h-3 text-emerald-600" />
      </div>
    )
  }

  const renderFeatureText = (value: FeatureValue): string => {
    if (value === false) return "Non inclus"
    if (value === true) return "Inclus"
    return value as string
  }

  return (
    <section id="pricing" className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl md:text-5xl text-slate-900 mb-4">
            Tarifs <span className="text-gradient">transparents</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Choisissez le plan qui correspond à vos besoins.
            Changez ou annulez à tout moment.
          </p>

          {/* E-invoicing notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 shrink-0 mt-0.5">
                <span className="text-amber-600 text-sm font-bold">📋</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm sm:text-base text-amber-800 mb-2">
                  Facturation électronique obligatoire
                </h3>
                <div className="text-xs  text-amber-700 space-y-1">
                  <p><strong>Entreprises B2B :</strong> Obligatoire septembre 2026 (inclus dans Business)</p>
                  <p><strong>Freelances, auto-entrepreneurs et PME B2C :</strong> Obligatoire septembre 2027</p>
                  
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, planIndex) => {
            const IconComponent = plan.icon
            return (
              <div
                key={planIndex}
                className={`relative rounded-2xl mb-14 p-8 ${plan.bgColor} border-2 ${plan.borderColor} transition-all duration-300 hover:shadow-lg ${plan.popular ? "scale-105 shadow-xl ring-2 ring-primary/20" : ""}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-2 rounded-full text-xs xs:text-sm font-semibold">
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${plan.iconBg}`}>
                    <IconComponent className={`w-6 h-6 ${plan.iconColor}`} />
                  </div>

                  <h3 className="text-2xl golos-text text-slate-900 font-semibold mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    {plan.subtitle}
                  </p>

                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.popular ? "text-gradient" : "text-slate-900"}`}>
                      {plan.price}€
                    </span>
                    <span className="text-slate-600 ml-1">
                      {plan.period}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {allFeatures.map((feature, featureIndex) => {
                    const value = getFeatureValue(feature, planIndex)
                    return (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        {renderFeatureIcon(value)}
                        <div className="flex-1">
                          <span className="text-sm text-slate-700 golos-text font-medium">
                            {feature.name}
                          </span>
                          <div className="text-xs text-slate-500 mt-0.5 golos-text">
                            {renderFeatureText(value)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* CTA */}
                {plan.popular ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full h-12 px-8 text-base transition-all hover:scale-105 duration-300 cursor-pointer"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <button
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 cursor-pointer hover:scale-105 ${
                      planIndex === 0
                        ? "border-2 border-slate-400 text-slate-700 hover:bg-slate-100 hover:border-slate-500"
                        : "border-2 border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500"
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom info */}
        <div className="text-center mt-16">
          <p className="text-slate-600 mb-4">
            🔒 Paiement sécurisé · Support français · 💯 Satisfait ou remboursé 30 jours
          </p>
          <p className="text-sm text-slate-500">
            Tous les prix sont HT · TVA applicable selon votre localisation · -20% en facturation annuelle
          </p>
        </div>
      </div>
    </section>
  )
}
