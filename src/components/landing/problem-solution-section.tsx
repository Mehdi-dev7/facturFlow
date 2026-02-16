"use client"

import { AlertTriangle, CheckCircle, Clock, CreditCard, FileX, Mail } from "lucide-react"
import dynamic from "next/dynamic"

const CountUp = dynamic(() => import("react-countup"), {
  ssr: false,
  loading: () => <span>0</span>
})

export function ProblemSolutionSection() {
  const problems = [
    {
      icon: Clock,
      title: "Relances interminables",
      description: "Vous passez des heures à relancer vos clients pour être payé"
    },
    {
      icon: FileX,
      title: "Factures complexes",
      description: "Créer une facture professionnelle prend trop de temps"
    },
    {
      icon: CreditCard,
      title: "Paiements difficiles",
      description: "Vos clients ne savent pas comment vous payer facilement"
    },
    {
      icon: Mail,
      title: "Suivi manuel",
      description: "Impossible de savoir si votre facture a été vue ou payée"
    }
  ]

  const solutions = [
    {
      icon: CheckCircle,
      title: "Paiement en 1 clic",
      description: "Lien de paiement intégré dans chaque facture. Plus de relances !"
    },
    {
      icon: CheckCircle,
      title: "Templates pro",
      description: "Factures professionnelles créées en moins de 2 minutes"
    },
    {
      icon: CheckCircle,
      title: "Multi-paiements",
      description: "CB, PayPal, SEPA - vos clients choisissent leur méthode préférée"
    },
    {
      icon: CheckCircle,
      title: "Suivi en temps réel",
      description: "Notifications instantanées : vue, payée, en retard"
    }
  ]

  return (
    <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-18 xl:py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Fini les galères de <span className="text-gradient">facturation</span>
          </h2>
          <p className="text-xl text-slate-600 font-ui max-w-2xl mx-auto">
            Nous avons résolu tous les problèmes que rencontrent les freelances et PME 
            avec leur facturation traditionnelle.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Problems */}
          <div>
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold font-heading text-slate-900">
                Les problèmes actuels
              </h3>
            </div>
            
            <div className="space-y-6">
              {problems.map((problem, index) => {
                const IconComponent = problem.icon
                return (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 flex-shrink-0 mt-1">
                      <IconComponent className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold font-heading text-slate-900 mb-1">
                        {problem.title}
                      </h4>
                      <p className="text-slate-600 font-ui text-sm">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold font-heading text-slate-900">
                Notre solution
              </h3>
            </div>
            
            <div className="space-y-6">
              {solutions.map((solution, index) => {
                const IconComponent = solution.icon
                return (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-green-50 border border-green-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 flex-shrink-0 mt-1">
                      <IconComponent className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold font-heading text-slate-900 mb-1">
                        {solution.title}
                      </h4>
                      <p className="text-slate-600 font-ui text-sm">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold font-display text-slate-900 mb-2">
                <CountUp
                  start={0}
                  end={87}
                  duration={2.5}
                  enableScrollSpy
                  scrollSpyOnce
                >
                  {({ countUpRef }) => <span ref={countUpRef} />}
                </CountUp>%
              </p>
              <p className="text-slate-600 font-ui">de factures payées plus rapidement</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-display text-slate-900 mb-2">
                <CountUp
                  start={0}
                  end={5}
                  duration={2.5}
                  enableScrollSpy
                  scrollSpyOnce
                >
                  {({ countUpRef }) => <span ref={countUpRef} />}
                </CountUp>h
              </p>
              <p className="text-slate-600 font-ui">économisées par semaine</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-display text-slate-900 mb-2">
                <CountUp
                  start={0}
                  end={0}
                  duration={2.5}
                  enableScrollSpy
                  scrollSpyOnce
                >
                  {({ countUpRef }) => <span ref={countUpRef} />}
                </CountUp>
              </p>
              <p className="text-slate-600 font-ui">relances nécessaires</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}