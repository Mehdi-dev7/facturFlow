# Testing Guide - FacturNow

Ce guide couvre la stratégie de tests unitaires pour FacturNow utilisant **Vitest**.

## Configuration

### Installation
Les packages suivants ont été installés :
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Fichiers de configuration

#### `vitest.config.ts`
Configuration de base de Vitest avec support React et path aliases :
- **Environnement** : `jsdom` (simule un navigateur)
- **Globals** : `true` (fonctions `describe`, `it`, `expect` disponibles globalement)
- **Setup** : `src/test/setup.ts` (initialise `@testing-library/jest-dom`)
- **Aliases** : `@` pointant vers `src/`

#### `src/test/setup.ts`
Fichier d'initialisation qui importe `@testing-library/jest-dom` pour étendre les matchers de Jest/Vitest.

### Scripts disponibles

```bash
npm run test          # Lance Vitest en mode watch (pour développement local)
npm run test:run      # Lance Vitest en mode single-run (pour CI/CD)
```

## Tests implémentés

### 1. `src/test/calculs-facture.test.ts`

Tests unitaires pour `src/lib/utils/calculs-facture.ts`, qui calcule les montants des factures.

**Couverture** :
- Calculs simples sans TVA ni remise
- TVA à différents taux (0%, 5.5%, 20%, 19.6%)
- Remises en pourcentage (0-100%, plafonné à 100%)
- Remises en montant fixe (plafonné au subtotal)
- Acomptes / dépôts (plafonné au totalTTC)
- Cas limites (quantité 0, prix 0, lignes vides)
- Combinaisons complexes (% + TVA + acompte)
- Arrondis à 2 décimales (cas réels avec TVA 19.6%)

**Signature de la fonction** :
```typescript
calcInvoiceTotals(opts: {
  lines: { quantity: number, unitPrice: number }[]
  vatRate: number
  discountType?: "pourcentage" | "montant"
  discountValue?: number
  depositAmount?: number
}): InvoiceTotals
```

**Chaîne de calcul** :
```
subtotal → − réduction → netHT → + TVA → totalTTC → − acompte → netAPayer
```

**26 tests** couvrant tous les scénarios.

### 2. `src/test/feature-gate.test.ts`

Tests unitaires pour `src/lib/feature-gate.ts`, qui gère le contrôle d'accès aux features selon le plan.

**Couverture** :

#### `getEffectivePlan(user)`
Détermine le plan effectif de l'utilisateur selon les priorités :
1. Admin email → BUSINESS
2. Accès invité accordé (`grantedPlan`) → BUSINESS
3. Trial actif → PRO
4. Plan de la DB → FREE/PRO/BUSINESS

**Tests** :
- Admin email retourne BUSINESS
- grantedPlan BUSINESS retourne BUSINESS
- Trial actif retourne PRO
- Trial expiré retourne le plan réel (FREE)
- Plans FREE/PRO/BUSINESS retournent le bon plan
- Priorités appliquées correctement

#### `canUseFeature(user, feature)`
Vérifie si l'utilisateur a accès à une feature donnée.

**Tests par plan** :
- **FREE** : aucune feature (documents/clients limités, pas de paiements)
- **PRO** : Stripe, PayPal, GoCardless, CSV export, e-invoicing (100/mois), etc.
- **BUSINESS** : tout PRO + API/webhooks, e-invoicing illimité, FEC export, multi-users, etc.
- **Trial** : traité comme PRO
- **Trial expiré** : retombe au plan réel

**33 tests** couvrant tous les plans et features.

## Architecture des tests

### Pattern AAA (Arrange-Act-Assert)

Tous les tests suivent ce pattern :

```typescript
it('description du test', () => {
  // Arrange : préparer les données
  const user = { plan: 'PRO', trialEndsAt: null }

  // Act : appeler la fonction
  const result = canUseFeature(user, 'payment_stripe')

  // Assert : vérifier le résultat
  expect(result).toBe(true)
})
```

### Fonctions pures uniquement

Les tests ciblent uniquement des fonctions pures sans dépendances externes :
- `calcInvoiceTotals()` : logique de calcul pur
- `getEffectivePlan()` : logique de priorité pur
- `canUseFeature()` : lookup dans un dictionnaire pur

**Pas de mocking de Prisma** : les fonctions `canCreateDocument()`, `canAddClient()`, `canSendEInvoice()` ne sont pas testées car elles dépendent de Prisma et nécessiteraient une DB de test.

## Bonnes pratiques

### Nommage des tests

Les tests doivent être descriptifs en anglais :
```typescript
// Bon
it('should return BUSINESS for admin email', () => {})
it('should apply 20% VAT correctly', () => {})
it('should cap discount at 100%', () => {})

// Mauvais
it('admin email', () => {})
it('VAT', () => {})
it('discount', () => {})
```

### Utilisation de `describe`

Grouper les tests par fonction :
```typescript
describe('calcInvoiceTotals', () => {
  describe('with discount', () => {
    it('should apply percentage discount', () => {})
    it('should apply fixed discount', () => {})
  })
})
```

### Matchers recommandés

```typescript
expect(result).toBe(value)              // Comparaison d'égalité stricte
expect(result).toEqual(value)           // Comparaison d'objets
expect(result).toBe(true/false)         // Booléens
expect(array).toHaveLength(n)           // Longueur d'array
expect(fn).toThrow()                    // Erreurs levées
```

## Exécution locale

### Mode watch (développement)
```bash
npm run test
```
- Relance automatiquement les tests à chaque modification
- Affiche le résumé + détails des échecs
- Appuyez sur `q` pour quitter

### Mode single-run (CI/CD)
```bash
npm run test:run
```
- Exécute tous les tests une fois
- Retourne un code d'erreur en cas d'échec
- Idéal pour les pipelines CI

## Couverture de code (futur)

Pour ajouter un rapport de couverture :
```bash
npm run test:run -- --coverage
```

Configuration à ajouter dans `vitest.config.ts` :
```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    include: ['src/lib/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/test/**']
  }
}
```

## Intégration CI/CD (recommandations)

### GitHub Actions
```yaml
- name: Run tests
  run: npm run test:run
```

### Avant de merger en main
```bash
npm run lint   # ESLint
npm run test:run  # Tests unitaires
npm run build  # Build Next.js
```

## Prochaines étapes

### Tests à ajouter

1. **Tests d'intégration Prisma**
   - Mock Prisma avec `@vitest/test-double`
   - Tester `canCreateDocument()`, `canAddClient()`, `canSendEInvoice()`

2. **Tests de composants React**
   - `render()` + `@testing-library/react`
   - Tests de formulaires (React Hook Form)
   - Tests de modales (shadcn/ui)

3. **Tests E2E**
   - Playwright pour workflows critiques
   - Paiements Stripe/PayPal/GoCardless (sandbox)
   - Création facture → email → PDF

4. **Tests de validation Zod**
   - Schémas de validation des formulaires
   - Cas limites (emails invalides, SIRET, montants négatifs, etc.)

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library - React](https://testing-library.com/docs/react-testing-library/intro/)
- [Zod](https://zod.dev/)
- [Jest Matchers](https://jestjs.io/docs/expect)
