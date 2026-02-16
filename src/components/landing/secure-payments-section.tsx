"use client"

import { Shield, Zap, CreditCard, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

const CountUp = dynamic(() => import("react-countup"), {
  ssr: false,
  loading: () => <span>0</span>
})

const paymentProviders = [
  { name: "Stripe", logo: "💳" },
  { name: "PayPal", logo: "🅿️" },
  { name: "GoCardless", logo: "🏦" },
]

export function SecurePaymentsSection() {
  return (
    <section id="payments" className="relative  bg-linear-to-br from-slate-50 via-white to-slate-50">
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">
        {/* Titre de section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            <span className="text-gradient">Paiements instantanés</span>
            <br />
            <span className="text-slate-900">et ultra-sécurisés</span>
          </h2>
          <p className="text-lg xs:text-xl text-slate-600 max-w-2xl mx-auto">
            Recevez vos paiements plus rapidement grâce aux leaders mondiaux de la sécurité
          </p>
        </div>

        {/* 3 colonnes principales */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* 1. Sécurité maximale */}
          <div 
            className="border border-slate-200 rounded-2xl p-4 xs:p-6 sm:p-8 space-y-6"
            style={{ background: "linear-gradient(135deg, #ecfeff 0%, white 50%)" }}
          >
            <div className="inline-flex p-3 rounded-xl" style={{ backgroundColor: "#ecfeff" }}>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#06b6d4" }}>
                <Shield className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mb-3">
                Sécurité maximale
              </h3>
              <p className="text-slate-600 text-sm xs:text-base leading-relaxed mb-6">
                Vos paiements sont protégés par les leaders mondiaux. Conformité PCI-DSS, chiffrement SSL, et 3D Secure.
              </p>
            </div>

            {/* Logos providers */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 font-ui">Powered by</p>
              <div className="flex flex-wrap gap-3">
                {paymentProviders.map((provider) => (
                  <div
                    key={provider.name}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <span className="text-xl">{provider.logo}</span>
                    <span className="text-sm font-semibold text-slate-700 font-ui">
                      {provider.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full font-ui">
                  PCI-DSS
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full font-ui">
                  SSL/TLS
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full font-ui">
                  3D Secure
                </span>
              </div>
            </div>
          </div>

          {/* 2. Simplicité extrême */}
          <div 
            className="border border-slate-200 rounded-2xl p-4 xs:p-6 sm:p-8 space-y-6"
            style={{ background: "linear-gradient(135deg, #fef3c7 0%, white 50%)" }}
          >
            <div className="inline-flex p-3 rounded-xl" style={{ backgroundColor: "#fef3c7" }}>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#f59e0b" }}>
                <Zap className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mb-3">
                Configuration en 5 minutes
              </h3>
              <p className="text-slate-600 text-sm xs:text-base leading-relaxed mb-6">
                Connectez vos comptes Stripe, PayPal et GoCardless en quelques clics. Pas de code, pas de complexité.
              </p>
            </div>

            {/* Étapes */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Connexion en 1 clic avec OAuth
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Guide pas à pas avec captures d&apos;écran
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Tutoriel vidéo disponible
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Support technique dédié
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Link href="/guide-paiements" className="text-primary hover:text-secondary font-semibold text-sm font-ui inline-flex items-center">
                Voir le tutoriel complet →
              </Link>
            </div>
          </div>

          {/* 3. Tous les moyens de paiement */}
          <div 
            className="border border-slate-200 rounded-2xl p-4 xs:p-6 sm:p-8 space-y-6"
            style={{ background: "linear-gradient(135deg, #eef2ff 0%, white 50%)" }}
          >
            <div className="inline-flex p-3 rounded-xl" style={{ backgroundColor: "#eef2ff" }}>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#4f46e5" }}>
                <CreditCard className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mb-3">
                Tous les moyens de paiement
              </h3>
              <p className="text-slate-600 text-sm xs:text-base leading-relaxed mb-6">
                Offrez le maximum de flexibilité à vos clients pour être payé plus rapidement.
              </p>
            </div>

            {/* Moyens de paiement */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 font-ui">Paiements instantanés</p>
                <div className="flex flex-wrap gap-2">
                  {["CB", "Visa", "Mastercard", "PayPal"].map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg font-ui"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 font-ui">Prélèvements automatiques</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg font-ui">
                    SEPA
                  </span>
                  <span className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg font-ui">
                    Mandat GoCardless
                  </span>
                </div>
              </div>
            </div>

            {/* Note PayPal */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">PayPal :</span> Compte Business requis pour synchronisation automatique{" "}
                <Link href="/guide-paypal" className="text-primary hover:underline font-medium">
                  (créer gratuitement →)
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bandeau de réassurance */}
        <div 
          className="border border-slate-200 rounded-2xl p-4 xs:p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #6366f1 200%)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">
                Vous gardez 100% de vos revenus
              </h3>
              <p className="text-slate-600 text-sm xs:text-base">
                FacturFlow ne prend <span className="font-semibold text-slate-900">aucune commission</span> sur vos transactions. 
                Vous payez uniquement les frais standards de vos prestataires de paiement.
              </p>
            </div>
            <div className="shrink-0">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 px-6 py-4 rounded-xl border border-green-200">
                <p className="text-sm text-slate-600 mb-1 font-ui">Frais moyens</p>
                <p className="text-3xl font-bold font-display text-green-600">1-2%</p>
                <p className="text-xs text-slate-500 font-ui">vs 3-5% ailleurs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <p className="text-4xl font-bold font-display text-slate-900 mb-2">
              +<CountUp
                start={0}
                end={40}
                duration={2.5}
                enableScrollSpy
                scrollSpyOnce
              >
                {({ countUpRef }) => <span ref={countUpRef} />}
              </CountUp>%
            </p>
            <p className="text-slate-600 font-ui">Taux de conversion vs virement</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold font-display text-slate-900 mb-2">
              <CountUp
                start={0}
                end={2}
                duration={2.5}
                enableScrollSpy
                scrollSpyOnce
              >
                {({ countUpRef }) => <span ref={countUpRef} />}
              </CountUp>x
            </p>
            <p className="text-slate-600 font-ui">Payé 2x plus rapidement</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold font-display text-slate-900 mb-2">
              <CountUp
                start={0}
                end={99.9}
                duration={2.5}
                decimals={1}
                enableScrollSpy
                scrollSpyOnce
              >
                {({ countUpRef }) => <span ref={countUpRef} />}
              </CountUp>%
            </p>
            <p className="text-slate-600 font-ui">Taux de disponibilité</p>
          </div>
        </div>
      </div>
    </section>
  )
}
