"use client"

import { FileText, Send, CreditCard } from "lucide-react"
import { Button } from "../ui/button"

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Créez votre facture",
      description: "Utilisez nos templates professionnels ou créez votre propre design. Ajoutez vos produits/services en quelques clics.",
      color: "#4f46e5" // Primary
    },
    {
      number: "02", 
      icon: Send,
      title: "Envoyez par email",
      description: "Votre facture est automatiquement envoyée avec un lien de paiement sécurisé intégré. Fini les relances !",
      color: "#06b6d4" // Accent
    },
    {
      number: "03",
      icon: CreditCard,
      title: "Recevez le paiement",
      description: "Vos clients paient en 1 clic via Stripe, PayPal ou SEPA. Vous êtes notifié instantanément.",
      color: "#10b981" // Success
    }
  ]

  return (
    <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-18 xl:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Comment ça <span className="text-gradient">marche</span> ?
          </h2>
          <p className="text-xl text-slate-600 font-ui max-w-2xl mx-auto">
            Créez, envoyez et recevez vos paiements en 3 étapes simples. 
            Aucune compétence technique requise.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <div key={index} className="relative">
                {/* Connector line (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-linear-to-r from-slate-300 to-transparent transform translate-x-6 -translate-y-1/2" />
                )}
                
                {/* Step card */}
                <div className="text-center">
                  {/* Number badge */}
                  <div 
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg mb-6"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                    style={{ 
                      background: `linear-gradient(135deg, ${step.color}20 0%, ${step.color}10 100%)`,
                      border: `1px solid ${step.color}30`
                    }}
                  >
                    <IconComponent 
                      className="w-8 h-8" 
                      style={{ color: step.color }}
                    />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold font-heading text-slate-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 font-ui leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-600 font-ui mb-6">
            Prêt à simplifier votre facturation ?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="gradient"
              className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer"
            >
              Commencer gratuitement
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-8 border-slate-300 hover:border-primary hover:bg-primary/10 font-semibold font-ui text-base transition-all duration-300 cursor-pointer"
            >
              Voir la démo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}