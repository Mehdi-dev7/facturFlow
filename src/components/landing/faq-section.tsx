"use client"

import { useState, useCallback } from "react"
import { Plus, Minus, ChevronDown, ChevronUp, ArrowUp } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"

export function FaqSection() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [showAll, setShowAll] = useState(false)

  const faqs = [
    
      {
        question: "Comment configurer le prélèvement SEPA automatique (GoCardless) ?",
        answer: "1️⃣ Allez dans Paramètres → Paiements\n2️⃣ Cliquez sur 'Connecter GoCardless'\n3️⃣ Créez votre compte GoCardless (gratuit, 2 min) ou connectez-vous\n4️⃣ Autorisez FacturNow → Badge 'SEPA activé' apparaît\n\nEnsuite, lors de la création d'une facture, sélectionnez 'Prélèvement SEPA' comme mode de paiement. Votre client recevra un lien pour renseigner son IBAN et signer le mandat en ligne. Après 3 à 5 jours d'activation bancaire, les prélèvements sont automatiques."
      },
      {
        question: "Comment activer les paiements par carte bancaire (Stripe) ?",
        answer: "1️⃣ Créez votre compte sur stripe.com et activez-le complètement (SIRET, IBAN, identité)\n2️⃣ Dans le dashboard Stripe → Développeurs → Clés API → copiez votre clé secrète (sk_live_...)\n3️⃣ Dans Développeurs → Webhooks → ajoutez l'URL : facturnow.fr/api/webhooks/stripe → copiez le Webhook Secret (whsec_...)\n4️⃣ Dans FacturNow → Paiements → collez vos deux clés\n\n💡 Un tutoriel pas-à-pas avec captures d'écran est disponible directement dans FacturNow → Paiements → 'Créez-en un en 5 min'.\n\nVos factures incluront automatiquement un bouton 'Payer par carte' (CB, Apple Pay, Google Pay). Frais : ~1,5% + 0,25€ par transaction, prélevés par Stripe."
      },
      {
        question: "Comment configurer PayPal pour recevoir des paiements ?",
        answer: "⚠️ Vous devez avoir un compte PayPal Business (gratuit).\n\n1️⃣ Allez sur developer.paypal.com → créez une application → copiez le Client ID et le Client Secret\n2️⃣ Dans Webhooks → ajoutez l'URL : facturnow.fr/api/webhooks/paypal → copiez le Webhook ID\n3️⃣ Dans FacturNow → Paiements → collez vos identifiants\n\n💡 Un tutoriel pas-à-pas avec captures d'écran est disponible dans FacturNow → Paiements → 'Créez-en un en 5 min'.\n\nVos factures afficheront un bouton 'Payer avec PayPal'. Frais : ~2,5–3,5% par transaction, prélevés par PayPal."
      },
      {
        question: "Facturation électronique : suis-je concerné et quand ?",
        answer: "📋 La facturation électronique devient obligatoire en France :\n\n🏢 ENTREPRISES B2B (>15 salariés) : Obligatoire dès septembre 2026\n→ Plan Business requis (inclut la conformité Chorus Pro / Factur-X)\n\n👤 FREELANCES, AUTO-ENTREPRENEURS, TPE, PME B2C : Obligatoire septembre 2027\n→ Plan Pro equivalent au plan business sur les factures electroniques\n\n✅ FacturNow est déjà en cours d'agrégation Plateforme Agréée (PA). Vous n'avez rien à faire, la mise à jour sera automatique sur votre plan."
      },
      {
        question: "Mes données bancaires et celles de mes clients sont-elles sécurisées ?",
        answer: "🔒 Sécurité maximale :\n\n✅ Chiffrement SSL/TLS (standard bancaire)\n✅ Serveurs certifiés en Europe (conformité RGPD)\n✅ Nous ne stockons JAMAIS vos données bancaires\n✅ Stripe, PayPal et GoCardless sont certifiés PCI-DSS niveau 1 (norme bancaire mondiale)\n✅ Authentification 2FA disponible\n✅ Sauvegardes quotidiennes chiffrées\n\nVos IBAN, cartes bancaires et mandats SEPA sont stockés chez Stripe/PayPal/GoCardless uniquement, pas chez nous."
      },
      {
        question: "Puis-je personnaliser mes factures avec mon logo et mes couleurs ?",
        answer: "Oui ! 🎨\n\nDans Dashboard → Apparence, vous pouvez :\n→ Uploader votre logo\n→ Choisir une couleur de marque (appliquée sur tous vos documents)\n→ Sélectionner une police\n→ Personnaliser le footer de vos PDF (mentions légales, coordonnées bancaires, message libre)\n\nTout se prévisualise en temps réel avant d'enregistrer."
      },
      {
        question: "Que se passe-t-il si je dépasse 10 factures/mois en plan Free ?",
        answer: "Vous recevrez un email 2 jours avant d'atteindre la limite (8/10 factures).\n\nSi vous atteignez 10/10 :\n→ Vous ne pourrez plus créer de nouvelles factures ce mois-ci\n→ Vos factures existantes restent accessibles\n→ Vous pouvez upgrader vers Pro à tout moment (transition instantanée)\n\nLe compteur se réinitialise le 1er de chaque mois.\n\n💡 Astuce : Passez au plan Pro (9,99€/mois) pour factures illimitées + SEPA + relances automatiques + suivi des paiements, etc."
      },
      {
        question: "Comment fonctionnent les factures récurrentes avec SEPA ?",
        answer: "🔄 Automatisation complète (Plan Pro uniquement) :\n\n1️⃣ Créez une facture récurrente : Clients → Nouvelle facture récurrente\n2️⃣ Définissez fréquence (hebdo, mensuel, trimestriel, annuel)\n3️⃣ Choisissez 'Prélèvement SEPA' comme mode de paiement\n4️⃣ Date de début et fin (optionnel)\n\n📅 Chaque mois (ou selon fréquence) :\n→ Facture générée automatiquement\n→ Email envoyé au client\n→ Prélèvement SEPA lancé 3 jours avant échéance\n→ Facture marquée 'Payée' automatiquement\n\n✅ Zéro intervention manuelle. Idéal pour abonnements, prestations mensuelles, loyers."
      },
      {
        question: "Comment importer mes factures depuis un autre logiciel ?",
        answer: "📥 Import facile en 3 étapes :\n\n1️⃣ Exportez vos données depuis votre ancien logiciel (Excel, CSV)\n2️⃣ Dashboard FacturNow → Paramètres → Import de données\n3️⃣ Uploadez votre fichier → Notre système détecte automatiquement les colonnes\n\n✅ Import pris en charge :\n→ Clients (nom, email, SIRET, adresse)\n→ Produits/Services (nom, prix, TVA)\n→ Factures (numéro, date, montant, statut)\n\n⚠️ Besoin d'aide ? Notre support vous accompagne gratuitement (email support@facturnow.fr)."
      },
      {
        question: "Puis-je annuler mon abonnement à tout moment ?",
        answer: "Oui, aucun engagement ! 🚪\n\nPour annuler :\n1️⃣ Dashboard → Paramètres → Abonnement\n2️⃣ Cliquez 'Annuler l'abonnement'\n3️⃣ Confirmez\n\n✅ Vous gardez l'accès jusqu'à la fin de votre période payée\n✅ Vos données sont conservées 90 jours\n✅ Vous pouvez exporter toutes vos factures en PDF/CSV avant\n✅ Réactivation possible à tout moment\n\n💯 Satisfait ou remboursé 30 jours sur tous les plans payants."
      },
      {
        question: "Y a-t-il des frais cachés sur les paiements ?",
        answer: "❌ Aucun frais caché de notre part !\n\nLes SEULS frais sont ceux des processeurs de paiement (prélevés par eux, pas par nous) :\n\n💳 Stripe (CB, Apple Pay, Google Pay) : 1,5% + 0,25€ par transaction\n🟦 PayPal : ~2,5-3,5% par transaction\n🏦 GoCardless (SEPA) : 1% + 0,20€ par transaction\n\n💡 Exemple : Facture de 100€ payée par SEPA → Vous recevez 98,80€ (100 - 1€ - 0,20€)\n\nCes frais sont les mêmes que si vous utilisiez directement Stripe/PayPal/GoCardless. FacturNow ne prend AUCUNE commission sur vos paiements."
      },
      {
        question: "Le support client est-il inclus ? Dans quelle langue ?",
        answer: "✅ Support inclus dans TOUS les plans :\n\n📧 Plan Free & Pro : Support email en français\n→ Réponse sous 24h (jours ouvrés)\n→ Base de connaissances complète\n\n⚡ Plan Business : Support prioritaire\n→ Réponse sous 12h (jours ouvrés)\n🇫🇷 Équipe 100% française basée à Paris\n📩 Contact : support@facturnow.fr\n\n💡  documentation complète disponibles 24/7 dans le dashboard."
      }
    
  ]

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    )
  }

  const scrollTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), [])

  const visibleFaqs = showAll ? faqs : faqs.slice(0, 5)

  return (
    <section id="faq" className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Questions <span className="text-gradient">fréquentes</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Toutes les réponses aux questions que vous vous posez sur FacturNow. 
            Une question ? Contactez notre support !
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {visibleFaqs.map((faq, index) => {
            const isOpen = openItems.includes(index)
            return (
              <div 
                key={index}
                className="border border-primary rounded-xl bg-white hover:border-tertiary transition-colors"
              >
                {/* Question */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors cursor-pointer duration-300"
                >
                  <span className="text-base sm:text-lg font-semibold text-slate-900 pr-4">
                    {faq.question}
                  </span>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </button>

                {/* Answer */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-5">
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-3">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Show More/Less Button */}
        {faqs.length > 5 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center space-x-2 px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer duration-300"
            >
              <span className="font-semibold">
                {showAll ? `Voir moins` : `Voir ${faqs.length - 5} questions supplémentaires`}
              </span>
              {showAll ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-linear-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Vous avez d&apos;autres questions ?
          </h3>
          <p className="text-slate-600 mb-6">
            Notre équipe support française est là pour vous aider !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="mailto:support@facturnow.fr">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer">
                Contacter le support
              </Button>
            </Link>
           
          </div>
        </div>

        {/* Retour en haut */}
        <div className="flex justify-center mt-12">
          <button
            onClick={scrollTop}
            className="group flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors duration-300 cursor-pointer"
          >
            <span>Retour en haut</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300">
              <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </div>
    </section>
  )
}