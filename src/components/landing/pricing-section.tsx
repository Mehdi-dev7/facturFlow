"use client"

import { Check, Star, Zap, Building } from "lucide-react"

export function PricingSection() {
  const plans = [
    {
      name: "Free",
      subtitle: "Pour les non-professionnels",
      price: "0",
      period: "Gratuit à vie",
      description: "Parfait pour tester et créer quelques factures occasionnelles",
      features: [
        "5 factures par mois",
        "Templates de base",
        "Export PDF simple",
        "Support par email",
        "Stockage 30 jours"
      ],
      cta: "Commencer gratuitement",
      popular: false,
      icon: Star,
      bgColor: "bg-white",
      borderColor: "border-slate-200",
      textColor: "text-slate-900",
      ctaStyle: "border border-slate-300 text-slate-700 hover:bg-slate-50"
    },
    {
      name: "Pro",
      subtitle: "Freelances • Auto-entrepreneurs • PME",
      price: "5",
      period: "par mois",
      description: "La solution complète pour professionnaliser votre facturation",
      features: [
        "Factures illimitées",
        "Tous les templates professionnels",
        "Paiements sécurisés intégrés",
        "Suivi en temps réel",
        "Relances automatiques",
        "Export comptable",
        "Support prioritaire",
        "Stockage illimité"
      ],
      cta: "Choisir Pro",
      popular: true,
      icon: Zap,
      bgColor: "bg-gradient-to-br from-primary/5 to-accent/5",
      borderColor: "border-primary/20",
      textColor: "text-slate-900",
      ctaStyle: "bg-primary text-white hover:bg-primary/90",
      badge: "Recommandé"
    },
    {
      name: "Business",
      subtitle: "Entreprises & Organisations",
      price: "9,99",
      period: "par mois",
      description: "Pour les entreprises qui ont besoin de fonctionnalités avancées",
      features: [
        "Tout du plan Pro",
        "Factures électroniques incluses",
        "Multi-utilisateurs (5 comptes)",
        "API & intégrations",
        "Rapports avancés",
        "Comptabilité intégrée",
        "Support téléphonique",
        "Formation personnalisée"
      ],
      cta: "Choisir Business",
      popular: false,
      icon: Building,
      bgColor: "bg-white",
      borderColor: "border-slate-200",
      textColor: "text-slate-900",
      ctaStyle: "border border-slate-300 text-slate-700 hover:bg-slate-50"
    }
  ]

  return (
    <section className="w-full px-4 sm:px-[8%] lg:px-[12%] py-18 xl:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-slate-900 mb-6">
            Tarifs transparents
          </h2>
          <p className="text-xl text-slate-600 font-ui max-w-3xl mx-auto mb-8">
            Choisissez le plan qui correspond à vos besoins. 
            Changez ou annulez à tout moment.
          </p>
          
          {/* Important notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 shrink-0 mt-0.5">
                <span className="text-amber-600 text-sm font-bold">!</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold font-heading text-amber-800 mb-2">
                  📋 Facturation électronique obligatoire
                </h3>
                <div className="text-sm text-amber-700 font-ui space-y-1">
                  <p><strong>Entreprises :</strong> Obligatoire dès juin 2026 (inclus dans Business)</p>
                  <p><strong>PME, Freelances, Auto-entrepreneurs :</strong> Obligatoire septembre 2027</p>
                  <p className="text-xs mt-2 text-amber-600">
                    Mise à jour prévue pour le plan Pro en juin 2027
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon
            return (
              <div 
                key={index} 
                className={`relative rounded-2xl p-8 ${plan.bgColor} border-2 ${plan.borderColor} transition-all duration-300 hover:shadow-lg ${plan.popular ? 'scale-105 shadow-xl' : ''}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold font-ui">
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${plan.popular ? 'bg-primary/10' : 'bg-slate-100'}`}>
                    <IconComponent className={`w-6 h-6 ${plan.popular ? 'text-primary' : 'text-slate-600'}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold font-heading text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-600 font-ui mb-6">
                    {plan.subtitle}
                  </p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold font-display text-slate-900">
                      {plan.price}€
                    </span>
                    <span className="text-slate-600 font-ui ml-1">
                      {plan.period}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 font-ui">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5 ${plan.popular ? 'bg-primary/10' : 'bg-slate-100'}`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-primary' : 'text-slate-600'}`} />
                      </div>
                      <span className="text-sm text-slate-700 font-ui">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className={`w-full py-4 px-6 rounded-xl font-semibold font-ui transition-colors ${plan.ctaStyle}`}>
                  {plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Bottom info */}
        <div className="text-center mt-16">
          <p className="text-slate-600 font-ui mb-4">
            🔒 Paiement sécurisé • 📞 Support français • 💯 Satisfait ou remboursé 30 jours
          </p>
          <p className="text-sm text-slate-500 font-ui">
            Tous les prix sont HT. TVA applicable selon votre localisation.
          </p>
        </div>
      </div>
    </section>
  )
}