"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Star, Zap, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
// Link retiré : les CTAs utilisent désormais des buttons avec router.push / checkout Stripe
import { authClient } from "@/lib/auth-client"
import { createStripeCheckoutSession } from "@/lib/actions/subscription"

type FeatureValue = string | boolean

interface Feature {
  name: string
  free: FeatureValue
  pro: FeatureValue
  business: FeatureValue
}

// Clé de plan associée à chaque card
type PlanKey = "FREE" | "PRO" | "BUSINESS"

export function PricingSection() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  // Gestion du clic sur un CTA
  const handlePlanClick = useCallback(
    async (planKey: PlanKey, ctaHref: string) => {
      // Plan Gratuit → toujours vers /signup
      if (planKey === "FREE") {
        router.push(ctaHref)
        return
      }

      // Utilisateur connecté → checkout Stripe direct
      if (session?.user) {
        setLoadingPlan(planKey)
        try {
          const result = await createStripeCheckoutSession(planKey, "monthly")
          if (result.success && result.data?.url) {
            window.location.href = result.data.url
          } else {
            toast.error((result as { error?: string }).error ?? "Impossible de créer la session de paiement.")
          }
        } catch {
          toast.error("Une erreur est survenue. Veuillez réessayer.")
        } finally {
          setLoadingPlan(null)
        }
        return
      }

      // Non connecté → redirection vers /signup avec plan en param
      router.push(ctaHref)
    },
    [session, router],
  )

  const allFeatures: Feature[] = [
    // LIMITES
    { name: "Documents par mois",              free: "10",       pro: "Illimités",   business: "Illimités" },
    // E-INVOICING
    { name: "Facturation électronique",         free: "5/mois",   pro: "Illimitée",   business: "Illimitée" },
    { name: "Clients",                          free: "5",        pro: "Illimités",   business: "Illimités" },
    { name: "Utilisateurs",                     free: "1 compte", pro: "1 compte",    business: "3 comptes" },

    // PAIEMENTS
    { name: "Stripe CB / Apple Pay / Google Pay",free: false,    pro: true,          business: true },
    { name: "PayPal",                           free: false,      pro: true,          business: true },
    { name: "🔥 Prélèvement SEPA automatique", free: false,      pro: true,          business: true },
    { name: "Virement bancaire (IBAN affiché)", free: true,       pro: true,          business: true },

    // FEATURES CLÉS
    { name: "Factures récurrentes",             free: false,      pro: true,          business: true },
    { name: "Relances automatiques (3 niveaux)",free: false,      pro: true,          business: true },
    { name: "Apparence & templates métiers",    free: false,      pro: "5 templates", business: "5 templates" },
    { name: "Statistiques & export CSV",        free: false,      pro: true,          business: true },

    // COMPTABILITÉ & AVANCÉ
    { name: "Export FEC comptable",             free: false,      pro: false,         business: true },
    { name: "Rapport mensuel comptable (PDF)", free: false,      pro: false,         business: true },
    { name: "Bilan annuel & URSSAF",            free: false,      pro: false,         business: true },
    { name: "Archivage légal 10 ans",           free: false,      pro: false,         business: true },
    { name: "API & Webhooks",                   free: false,      pro: false,         business: true },
    { name: "Support prioritaire",              free: false,      pro: false,         business: true },

  ]

  const plans = [
    {
      name: "Gratuit",
      subtitle: "Pour démarrer",
      price: "0",
      period: "/ mois",
      description: "7 jours d'essai Pro inclus, puis 10 documents/mois",
      cta: "Commencer gratuitement",
      ctaHref: "/signup",
      planKey: "FREE" as PlanKey,
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
      ctaHref: "/signup?plan=pro",
      planKey: "PRO" as PlanKey,
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
      price: "20",
      period: "/ mois",
      description: "Tout Pro + multi-users + comptabilité + API",
      cta: "Choisir Business",
      ctaHref: "/signup?plan=business",
      planKey: "BUSINESS" as PlanKey,
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

  const renderFeatureRow = (feature: Feature, planIndex: number) => {
    const value = getFeatureValue(feature, planIndex)
    const isString = typeof value === "string"

    const icon = value === false
      ? <div className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 shrink-0"><X className="w-2.5 h-2.5 text-slate-400" /></div>
      : <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 shrink-0"><Check className="w-2.5 h-2.5 text-emerald-600" /></div>

    return (
      <div key={feature.name} className="flex items-center gap-2 py-1.5 border-b border-slate-100/60 last:border-0">
        {icon}
        <span className={`text-sm flex-1 leading-tight ${value === false ? "text-slate-400" : "text-slate-700"}`}>
          {feature.name}
        </span>
        {isString && (
          <span className="text-sm font-semibold text-primary shrink-0">{value}</span>
        )}
      </div>
    )
  }

  return (
    <section id="pricing" className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Tarifs <span className="text-gradient">transparents</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-4">
            Choisissez le plan qui correspond à vos besoins.
            Changez ou annulez à tout moment.
          </p>

          {/* E-invoicing notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">📋</span>
              <div className="text-left">
                <p className="font-semibold text-xs sm:text-sm text-amber-800 mb-1">Facturation électronique obligatoire</p>
                <p className="text-xs text-amber-700"><strong>B2B :</strong> Obligatoire sept. 2026 · <strong>Freelances & PME B2C :</strong> Obligatoire sept. 2027</p>
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
                className={`relative rounded-2xl mb-14 p-5 sm:p-6 ${plan.bgColor} border-2 ${plan.borderColor} transition-all duration-300 hover:shadow-lg ${plan.popular ? "scale-105 shadow-xl ring-2 ring-primary/20" : ""}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-1.5 rounded-full text-xs xs:text-sm font-semibold">
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-5">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${plan.iconBg}`}>
                    <IconComponent className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>

                  <h3 className="text-xl golos-text text-slate-900 font-semibold mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {plan.subtitle}
                  </p>

                  <div className="mb-1">
                    <span className={`text-3xl font-bold ${plan.popular ? "text-gradient" : "text-slate-900"}`}>
                      {plan.price}€
                    </span>
                    <span className="text-slate-500 text-sm ml-1">
                      {plan.period}
                    </span>
                  </div>
                  {plan.price !== "0" && (
                    <p className="text-xs text-slate-400">TTC · -20% annuel</p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="mb-5">
                  {allFeatures.map((feature) => renderFeatureRow(feature, planIndex))}
                </div>

                {/* CTA — button intelligent : checkout direct si connecté, sinon /signup */}
                {plan.popular ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full h-10 px-6 text-sm transition-all hover:scale-105 duration-300 cursor-pointer"
                    disabled={loadingPlan === plan.planKey}
                    onClick={() => handlePlanClick(plan.planKey, plan.ctaHref)}
                  >
                    {loadingPlan === plan.planKey ? "Chargement..." : plan.cta}
                  </Button>
                ) : (
                  <button
                    type="button"
                    disabled={loadingPlan === plan.planKey}
                    onClick={() => handlePlanClick(plan.planKey, plan.ctaHref)}
                    className={`w-full py-2.5 px-5 rounded-xl text-sm font-semibold text-center block transition-all duration-300 cursor-pointer hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed ${
                      planIndex === 0
                        ? "border-2 border-slate-400 text-slate-700 hover:bg-slate-100 hover:border-slate-500"
                        : "border-2 border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500"
                    }`}
                  >
                    {loadingPlan === plan.planKey ? "Chargement..." : plan.cta}
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
            Tous les prix sont TTC · TVA 20% incluse · -20% en facturation annuelle
          </p>
        </div>
      </div>
    </section>
  )
}
