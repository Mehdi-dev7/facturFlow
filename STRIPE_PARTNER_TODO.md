# Stripe — Actions à faire pour le système partenaires

## Rien à configurer maintenant
Le tracking partenaire fonctionne via les metadata Stripe (partnerCode dans checkout session).
Aucune configuration Stripe supplémentaire n'est requise pour le MVP.

## Ajouter l'événement `invoice.paid` au webhook Stripe

Actuellement le webhook écoute : checkout.session.completed, customer.subscription.created/updated/deleted

À ajouter dans le dashboard Stripe :
1. Stripe Dashboard → Developers → Webhooks → [ton endpoint]
2. Ajouter l'événement : `invoice.paid`
3. Sauvegarder

Pourquoi : cet événement se déclenche à chaque renouvellement d'abonnement (mensuel ou annuel).
Le code dans /api/webhooks/stripe détecte si l'user a un referral partenaire actif et crée
la commission correspondante automatiquement.

## Pour plus tard : discount client (5-10% sur 3 premiers mois)

Quand tu voudras activer le discount client pour les users qui viennent via un partenaire :

1. Stripe Dashboard → Products → Coupons → Create coupon
   - Nom : "Remise partenaire 3 mois"
   - Type : Percentage
   - Percent off : 10
   - Duration : repeating
   - Duration in months : 3

2. Stripe Dashboard → Products → Promotion codes → Create promotion code
   - Coupon : sélectionner "Remise partenaire 3 mois"
   - Code : PARTNER10 (ou un code générique)
   - OU créer un promotion code par partenaire si tu veux tracker individuellement

3. Dans le code (`src/lib/actions/subscription.ts`) :
   - Ajouter la logique pour appliquer le promotion code quand partnerCode est présent
   - Actuellement on ignore le discount client pour éviter de cumuler avec l'offre Fondateur

## Variables d'environnement déjà utilisées
- STRIPE_SECRET_KEY ✅
- STRIPE_WEBHOOK_SECRET ✅
- STRIPE_PRO_MONTHLY_PRICE_ID ✅
- STRIPE_PRO_YEARLY_PRICE_ID ✅
- STRIPE_BUSINESS_MONTHLY_PRICE_ID ✅
- STRIPE_BUSINESS_YEARLY_PRICE_ID ✅
- STRIPE_FOUNDER_PROMO_CODE_ID ✅

Aucune nouvelle variable Stripe n'est nécessaire pour le MVP partenaires.

## Rappel des montants de référence (prix HT)

| Plan     | Cycle   | Montant/période | Commission % | Commission €  |
|----------|---------|-----------------|--------------|---------------|
| PRO      | Monthly | 9,99 €          | 10%          | ~1,00 €       |
| PRO      | Yearly  | 95,90 €         | 15%          | ~14,39 €      |
| BUSINESS | Monthly | 20,00 €         | 10%          | 2,00 €        |
| BUSINESS | Yearly  | 192,00 €        | 15%          | 28,80 €       |

Max 12 périodes par referral (= 12 mois pour monthly, 12 ans pour yearly).
