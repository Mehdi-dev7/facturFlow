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

## Partenaires fondateurs — État actuel (30/03/2026)

FOUED7 et AMIN2026 sont marqués `isFounder = true` dans `/admin/partners` (étoile dorée).

**Comment ça marche :**
- L'user entre FOUED7 ou AMIN2026 au checkout Stripe
- La promo fondateur (`STRIPE_FOUNDER_PROMO_CODE_ID`) est appliquée automatiquement
- Le referral est tracké dans `PartnerReferral` pour les commissions
- Le compteur X/50 est visible dans `/admin/partners`

**Quand tu atteins 50 referrals fondateurs :**

### Étape 1 — Créer le nouveau coupon dans Stripe

1. Stripe Dashboard → `Product catalog → Coupons → Create coupon`
   - Nom : `Remise partenaire 3 mois`
   - Type : **Percentage off → 10%**
   - Duration : **Repeating → 3 months**
   - Sauvegarder → noter l'ID du coupon (ex: `JnX8aZ3p`)

2. Stripe Dashboard → sur ce coupon → `Add promotion code`
   - Code : `PARTNER10` (ou ce que tu veux)
   - Sauvegarder → noter l'ID de la promotion code (format `promo_xxxx`)

### Étape 2 — Mettre à jour le code (3 lignes)

1. Ajouter dans `.env` et dans Vercel :
   ```
   STRIPE_PARTNER_PROMO_CODE_ID=promo_xxxx
   ```

2. Dans `src/lib/actions/subscription.ts`, remplacer la logique `applyFounderPromo` :
   ```typescript
   // AVANT (promo fondateur uniquement)
   const applyFounderPromo = (promoCode === "FONDATEUR" || isFounderPartner) && !!process.env.STRIPE_FOUNDER_PROMO_CODE_ID;
   const discounts = applyFounderPromo ? [{ promotion_code: process.env.STRIPE_FOUNDER_PROMO_CODE_ID! }] : undefined;

   // APRÈS (fondateur → promo fondateur / partenaire standard → -10% 3 mois)
   const applyFounderPromo = (promoCode === "FONDATEUR" || isFounderPartner) && !!process.env.STRIPE_FOUNDER_PROMO_CODE_ID;
   const applyPartnerPromo = resolvedPartnerCode && !isFounderPartner && !!process.env.STRIPE_PARTNER_PROMO_CODE_ID;
   const discounts = applyFounderPromo
     ? [{ promotion_code: process.env.STRIPE_FOUNDER_PROMO_CODE_ID! }]
     : applyPartnerPromo
     ? [{ promotion_code: process.env.STRIPE_PARTNER_PROMO_CODE_ID! }]
     : undefined;
   ```

### Étape 3 — Désactiver le mode fondateur

Dans `/admin/partners`, cliquer l'étoile sur FOUED7 et AMIN2026 pour repasser `isFounder = false`.
Ils passent en partenaires standard → leurs nouveaux clients reçoivent -10%/3 mois au lieu de la promo fondateur.

---

## Pour plus tard : discount client standard (hors partenaires fondateurs)

Même logique mais pour tous les partenaires non-fondateurs si tu veux généraliser le discount client.

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
