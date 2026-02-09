"use client"

import { useState } from "react"
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "../ui/button"

export function FaqSection() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [showAll, setShowAll] = useState(false)

  const faqs = [
    
      {
        question: "Comment configurer le prélèvement SEPA automatique (GoCardless) ?",
        answer: "1️⃣ Allez dans Paramètres → Paiements\n2️⃣ Cliquez sur 'Connecter GoCardless'\n3️⃣ Créez votre compte GoCardless (gratuit, 2 min) ou connectez-vous\n4️⃣ Autorisez FacturFlow → Badge 'SEPA activé' apparaît\n\nEnsuite, lors de la création d'une facture, sélectionnez 'Prélèvement SEPA' comme mode de paiement. Votre client recevra un email pour signer le mandat (IBAN + autorisation). Après 3-5 jours d'activation, les prélèvements sont automatiques chaque mois."
      },
      {
        question: "Comment activer les paiements par carte bancaire (Stripe) ?",
        answer: "1️⃣ Dans Paramètres → Paiements → Cliquez 'Connecter Stripe'\n2️⃣ Créez votre compte Stripe (gratuit) ou connectez-vous\n3️⃣ Renseignez vos infos entreprise (SIRET, IBAN pour recevoir les fonds)\n4️⃣ Validez votre identité (pièce d'identité, justificatif)\n5️⃣ Autorisez FacturFlow → Activation instantanée\n\nVos factures incluront automatiquement un bouton 'Payer par carte'. Vos clients paient en 1 clic (CB, Apple Pay, Google Pay). Les fonds arrivent sur votre compte sous 2-7 jours. Frais : 1,5% + 0,25€ par transaction (prélevés par Stripe)."
      },
      {
        question: "Comment configurer PayPal pour recevoir des paiements ?",
        answer: "⚠️ Vous devez avoir un compte PayPal Business (gratuit).\n\n1️⃣ Paramètres → Paiements → 'Connecter PayPal'\n2️⃣ Connectez-vous à votre compte PayPal Business\n3️⃣ Autorisez FacturFlow à générer des liens de paiement\n4️⃣ Activation instantanée\n\nVos factures afficheront un bouton 'Payer avec PayPal'. Le client clique, paie via PayPal, et vous recevez l'argent instantanément sur votre compte PayPal. Frais PayPal : ~2,5-3,5% par transaction."
      },
      {
        question: "Facturation électronique : suis-je concerné et quand ?",
        answer: "📋 La facturation électronique devient obligatoire en France :\n\n🏢 ENTREPRISES B2B (>15 salariés) : Obligatoire dès septembre 2026\n→ Plan Business requis (inclut la conformité Chorus Pro / Factur-X)\n\n👤 FREELANCES, AUTO-ENTREPRENEURS, TPE, PME B2C : Obligatoire septembre 2027\n→ Plan Pro sera mis à jour gratuitement en juin 2027\n\n✅ FacturFlow est déjà en cours d'agrégation Plateforme Agréée (PA). Vous n'avez rien à faire, la mise à jour sera automatique sur votre plan."
      },
      {
        question: "Mes données bancaires et celles de mes clients sont-elles sécurisées ?",
        answer: "🔒 Sécurité maximale :\n\n✅ Chiffrement SSL/TLS (standard bancaire)\n✅ Serveurs certifiés en Europe (conformité RGPD)\n✅ Nous ne stockons JAMAIS vos données bancaires\n✅ Stripe, PayPal et GoCardless sont certifiés PCI-DSS niveau 1 (norme bancaire mondiale)\n✅ Authentification 2FA disponible\n✅ Sauvegardes quotidiennes chiffrées\n\nVos IBAN, cartes bancaires et mandats SEPA sont stockés chez Stripe/PayPal/GoCardless uniquement, pas chez nous."
      },
      {
        question: "Puis-je personnaliser mes factures avec mon logo et mes couleurs ?",
        answer: "Oui ! 🎨\n\n📄 Plan Free : 1 template basique + votre logo\n\n💎 Plan Pro : Tout le Free +\n→ 9 templates métiers (Dev web, Designer, BTP, Consultant, etc.)\n→ Personnalisation couleurs (primaire, secondaire, texte)\n→ Footer personnalisé (mentions légales, coordonnées bancaires)\n→ Police custom (bientôt)\n\n🏢 Plan Business : Tout Pro + Templates sur-mesure\n\nPour personnaliser : Dashboard → Paramètres → Apparence → Uploadez votre logo + choisissez template + personnalisez couleurs."
      },
      {
        question: "Que se passe-t-il si je dépasse 10 factures/mois en plan Free ?",
        answer: "Vous recevrez un email 2 jours avant d'atteindre la limite (8/10 factures).\n\nSi vous atteignez 10/10 :\n→ Vous ne pourrez plus créer de nouvelles factures ce mois-ci\n→ Vos factures existantes restent accessibles\n→ Vous pouvez upgrader vers Pro à tout moment (transition instantanée)\n\nLe compteur se réinitialise le 1er de chaque mois.\n\n💡 Astuce : Passez au plan Pro (14€/mois) pour factures illimitées + SEPA + relances automatiques + suivi des paiements etc..."
      },
      {
        question: "Comment fonctionnent les factures récurrentes avec SEPA ?",
        answer: "🔄 Automatisation complète (Plan Pro uniquement) :\n\n1️⃣ Créez une facture récurrente : Clients → Nouvelle facture récurrente\n2️⃣ Définissez fréquence (hebdo, mensuel, trimestriel, annuel)\n3️⃣ Choisissez 'Prélèvement SEPA' comme mode de paiement\n4️⃣ Date de début et fin (optionnel)\n\n📅 Chaque mois (ou selon fréquence) :\n→ Facture générée automatiquement\n→ Email envoyé au client\n→ Prélèvement SEPA lancé 3 jours avant échéance\n→ Facture marquée 'Payée' automatiquement\n\n✅ Zéro intervention manuelle. Idéal pour abonnements, prestations mensuelles, loyers."
      },
      {
        question: "Comment importer mes factures depuis un autre logiciel ?",
        answer: "📥 Import facile en 3 étapes :\n\n1️⃣ Exportez vos données depuis votre ancien logiciel (Excel, CSV)\n2️⃣ Dashboard FacturFlow → Paramètres → Import de données\n3️⃣ Uploadez votre fichier → Notre système détecte automatiquement les colonnes\n\n✅ Import pris en charge :\n→ Clients (nom, email, SIRET, adresse)\n→ Produits/Services (nom, prix, TVA)\n→ Factures (numéro, date, montant, statut)\n\n⚠️ Besoin d'aide ? Notre support vous accompagne gratuitement (email support@facturflow.fr)."
      },
      {
        question: "Puis-je annuler mon abonnement à tout moment ?",
        answer: "Oui, aucun engagement ! 🚪\n\nPour annuler :\n1️⃣ Dashboard → Paramètres → Abonnement\n2️⃣ Cliquez 'Annuler l'abonnement'\n3️⃣ Confirmez\n\n✅ Vous gardez l'accès jusqu'à la fin de votre période payée\n✅ Vos données sont conservées 90 jours\n✅ Vous pouvez exporter toutes vos factures en PDF/CSV avant\n✅ Réactivation possible à tout moment\n\n💯 Satisfait ou remboursé 30 jours sur tous les plans payants."
      },
      {
        question: "Y a-t-il des frais cachés sur les paiements ?",
        answer: "❌ Aucun frais caché de notre part !\n\nLes SEULS frais sont ceux des processeurs de paiement (prélevés par eux, pas par nous) :\n\n💳 Stripe (CB, Apple Pay, Google Pay) : 1,5% + 0,25€ par transaction\n🟦 PayPal : ~2,5-3,5% par transaction\n🏦 GoCardless (SEPA) : 1% + 0,20€ par transaction\n\n💡 Exemple : Facture de 100€ payée par SEPA → Vous recevez 98,80€ (100 - 1€ - 0,20€)\n\nCes frais sont les mêmes que si vous utilisiez directement Stripe/PayPal/GoCardless. FacturFlow ne prend AUCUNE commission sur vos paiements."
      },
      {
        question: "Le support client est-il inclus ? Dans quelle langue ?",
        answer: "✅ Support inclus dans TOUS les plans :\n\n📧 Plan Free & Pro : Support email en français\n→ Réponse sous 24h (jours ouvrés)\n→ Base de connaissances complète\n\n⚡ Plan Business : Support prioritaire\n→ Réponse sous 4h (jours ouvrés)\n→ Chat direct avec l'équipe\n→ Accompagnement migration inclus\n\n🇫🇷 Équipe 100% française basée à Paris\n📩 Contact : support@facturflow.fr\n\n💡 Tutoriels vidéo + documentation complète disponibles 24/7 dans le dashboard."
      }
    
  ]

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    )
  }

  const visibleFaqs = showAll ? faqs : faqs.slice(0, 5)

  return (
    <section className="w-full px-4 sm:px-[8%] lg:px-[12%] py-18 xl:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Questions <span className="text-gradient">fréquentes</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Toutes les réponses aux questions que vous vous posez sur FacturFlow. 
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
                className="border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition-colors"
              >
                {/* Question */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <span className="text-lg font-semibold text-slate-900 pr-4">
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
                      <p className="text-slate-600 leading-relaxed mt-3">
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
              className="inline-flex items-center space-x-2 px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
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
            <Button variant="gradient" size="lg" className="w-full sm:w-auto h-12 px-8 font-ui text-base transition-all duration-300 cursor-pointer">
              Contacter le support
            </Button>
           
          </div>
        </div>
      </div>
    </section>
  )
}