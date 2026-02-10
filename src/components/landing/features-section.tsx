"use client"

import { Zap, Send, TrendingUp, Bell, PieChart, Palette, FileStack } from "lucide-react"

const features = [
  {
    icon: FileStack,
    title: "Tous vos documents professionnels",
    description: "Factures, devis, avoirs, bons de commande, bons de livraison, reçus... Gérez l'intégralité de votre cycle de vente depuis une seule plateforme.",
    iconColor: "#06b6d4",
    bgColor: "#ecfeff",
    featured: true,
  },
  {
    icon: Zap,
    title: "Création ultra-rapide",
    description: "Créez tous vos documents en quelques clics grâce à nos templates pré-configurés et à l'auto-complétion intelligente.",
    iconColor: "#f59e0b",
    bgColor: "#fef3c7",
  },
  {
    icon: Send,
    title: "Email + PDF + Paiement en 1 clic",
    description: "Envoyez vos factures par email avec le PDF et un lien de paiement sécurisé (Stripe/PayPal). Vos clients paient directement en un clic, sans friction.",
    iconColor: "#4f46e5",
    bgColor: "#eef2ff",
  },
  {
    icon: TrendingUp,
    title: "Tableau de bord en temps réel",
    description: "Visualisez l'état de toutes vos factures : payées, en attente, en retard. Statistiques et graphiques pour piloter votre activité.",
    iconColor: "#10b981",
    bgColor: "#d1fae5",
  },
  {
    icon: Bell,
    title: "Plus jamais d'impayés",
    description: "Configurez des relances automatiques par email. Le système envoie des rappels progressifs à vos clients en retard de paiement.",
    iconColor: "#ef4444",
    bgColor: "#fee2e2",
  },
  {
    icon: PieChart,
    title: "Statistiques détaillées",
    description: "Suivez votre chiffre d'affaires, vos clients les plus actifs, et exportez vos données comptables en un clic.",
    iconColor: "#3b82f6",
    bgColor: "#dbeafe",
  },
  {
    icon: Palette,
    title: "Design professionnel",
    description: "Choisissez parmi nos templates par métier ou créez le vôtre. Logo, couleurs, mentions légales : tout est personnalisable.",
    iconColor: "#a855f7",
    bgColor: "#f3e8ff",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-10 lg:py-20 bg-white">
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%] py-18 xl:py-10">
        {/* Titre de section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl  mb-4">
            <span className="text-gradient">Tout ce dont vous avez besoin</span>
            <br />
            <span className="text-slate-900">pour gérer vos factures</span>
          </h2>
          <p className="text-lg xs:text-xl text-slate-600 max-w-2xl mx-auto">
            Une solution complète qui automatise votre facturation de A à Z
          </p>
        </div>

        {/* Grille de features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group relative border  rounded-2xl p-4 xs:p-6 sm:p-8 shadow-xl border-primary/50 transition-all duration-300 ${
                  feature.featured ? 'md:col-span-2 lg:col-span-3 lg:max-w-2xl lg:mx-auto' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${feature.bgColor} 0%, white 50%)`
                }}
              >
                {/* Icône avec couleur */}
                <div 
                  className="inline-flex p-3 rounded-xl mb-6"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: feature.iconColor }}
                  >
                    <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Titre */}
                <h3 className="text-xl font-semibold font-heading text-slate-900 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed text-sm xs:text-base">
                  {feature.description}
                </p>

                {/* Effet hover - bordure animée */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-all duration-300" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
