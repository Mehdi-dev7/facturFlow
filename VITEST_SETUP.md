# Vitest Setup - FacturNow

Vitest a été configuré et intégré avec succès dans le projet FacturNow.

## Fichiers créés

### Configuration
- **`vitest.config.ts`** : Configuration Vitest avec support React et path aliases
- **`src/test/setup.ts`** : Fichier d'initialisation pour `@testing-library/jest-dom`

### Tests unitaires
- **`src/test/calculs-facture.test.ts`** : 26 tests pour `calcInvoiceTotals()`
  - Calculs simples, TVA, remises (%, montant), acomptes
  - Cas limites et combinaisons complexes
  - Arrondis à 2 décimales

- **`src/test/feature-gate.test.ts`** : 33 tests pour `getEffectivePlan()` et `canUseFeature()`
  - Plans FREE/PRO/BUSINESS et leurs features
  - Admin email, trial actif/expiré, grantedPlan
  - Priorités de plan et feature-gating par plan

### Documentation
- **`TESTING.md`** : Guide complet des tests
  - Configuration expliquée
  - Couverture des tests
  - Bonnes pratiques
  - Ressources

- **`src/test/EXAMPLES.md`** : 10 exemples de patterns de tests
  - Fonctions pures, validation Zod, composants React
  - Mocking, async/await, hooks, dates
  - Best practices

## Scripts disponibles

```bash
# Mode watch (développement local)
npm run test

# Mode single-run (CI/CD, rapide)
npm run test:run
```

## Résultats

```
Test Files: 2 passed (2)
Tests:      59 passed (59)
Duration:   ~800ms
```

### Détail des tests

| Fichier | Tests | Couverture |
|---------|-------|-----------|
| `calculs-facture.test.ts` | 26 | calcInvoiceTotals() : 100% |
| `feature-gate.test.ts` | 33 | getEffectivePlan() + canUseFeature() : 100% |

## Points clés

### ✅ Ce qui a été testé
- **Logique métier pur** : calculs, feature-gating
- **Cas nominaux et limites** : 0%, 100%, valeurs nulles, montants négatifs
- **Ordre de priorité** : admin > grantedPlan > trial > plan
- **Arrondis décimaux** : 2 décimales, cas réels avec TVA 19.6%

### ⏭️ Prochaines étapes

#### Court terme (facile)
1. **Tests de validation Zod** (`src/lib/validations/*.ts`)
   - Schémas des formulaires (facture, devis, client, etc.)
   - Cas invalides : emails, montants négatifs, dates
   - ~5 fichiers × 10-15 tests = 50-75 tests supplémentaires

2. **Tests de formatage** (`src/lib/utils/formatters.ts`)
   - `formatCurrency()` : locale FR, arrondis
   - `formatDate()` : locale FR, dates invalides
   - ~20 tests

3. **Tests de constantes** (`src/lib/constants.ts`)
   - Vérifier qu'aucune constante n'est manquante
   - Énumérations DOCUMENT_TYPES, PAYMENT_METHODS, etc.
   - ~10 tests

#### Moyen terme (modéré)
4. **Tests de composants React**
   - `src/components/shared/*.tsx` : composants réutilisables
   - `src/components/forms/*.tsx` : formulaires (InvoiceForm, ClientForm)
   - Utiliser `@testing-library/react` + `render()` + `userEvent`
   - Mock les Server Actions
   - ~100-150 tests

5. **Tests de custom hooks**
   - `src/hooks/use-*.ts` : hooks custom
   - `renderHook()` + `act()`
   - ~30-50 tests

6. **Tests de calculateurs complexes**
   - Acomptes, factures récurrentes
   - Export CSV, FEC, URSSAF
   - ~50-100 tests

#### Long terme (complexe)
7. **Tests E2E avec Playwright**
   - Workflows critiques : créer facture → payer → archiver
   - Paiements en sandbox : Stripe, PayPal, GoCardless
   - Authentification : login, signup, OAuth
   - ~20-30 tests

8. **Tests d'intégration API**
   - Routes `/api/` : webhooks, paiements, e-invoicing
   - Mock des providers externes (Stripe, SuperPDP, etc.)
   - ~50-100 tests

## Structure de test recommandée

```
src/test/
├── setup.ts                          # Initialisation
├── calculs-facture.test.ts          # Tests actuels ✅
├── feature-gate.test.ts              # Tests actuels ✅
├── validations/
│   ├── invoice.test.ts
│   ├── client.test.ts
│   └── quote.test.ts
├── utils/
│   ├── formatters.test.ts
│   ├── dates.test.ts
│   └── constants.test.ts
├── components/
│   ├── invoice-form.test.tsx
│   ├── client-form.test.tsx
│   └── modals/
├── hooks/
│   ├── use-invoices.test.ts
│   └── use-clients.test.ts
├── api/
│   └── webhooks.test.ts
└── e2e/
    └── invoice-workflow.test.ts
```

## Commandes Git à venir

```bash
# Créer un commit avec les tests
git add vitest.config.ts src/test/ TESTING.md VITEST_SETUP.md package.json
git commit -m "feat: Configure Vitest and add unit tests for core logic"

# Dans la Pipeline CI/CD
- npm install
- npm run lint
- npm run test:run  ← S'arrête si un test échoue
- npm run build
```

## Intégration CI (recommandée)

### GitHub Actions
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
```

### Pre-commit hook (optionnel)
```bash
#!/bin/sh
npm run test:run || exit 1
```

## FAQ

### Q. Pourquoi tests purs et pas de Prisma?
**R.** Les tests de Prisma nécessitent une DB de test complexe. Les fonctions pures testées (`calcInvoiceTotals`, `getEffectivePlan`) couvrent la logique métier critique sans dépendances externes. Les tests de Prisma peuvent être ajoutés en utilisant `@prisma/client/test-utils` (v6+).

### Q. Suffit-il de 59 tests?
**R.** C'est un bon start. L'objectif est d'atteindre 70-80% de couverture globale. Les tests actuels couvrent la logique critère. Les tests de formulaires et composants seront ajoutés progressivement.

### Q. Comment tester les Server Actions?
**R.** Server Actions retournent des `Promise`. Les tester nécessite un mock de Prisma. Exemple :
```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: { document: { create: vi.fn() } }
}))
```

### Q. Et les webhooks Stripe/PayPal/GoCardless?
**R.** Utiliser les APIs sandbox et `@stripe/stripe-cli` ou `@paypal/checkout-sdk` pour simuler les webhooks en local. Tests E2E recommandés pour ces cas.

## Performance

- **Test actuels** : ~800ms (jsdom setup ~600ms, tests ~8ms)
- **Target** : <1s pour 100 tests
- **Optimisations** : lazy load Prisma, mock intelligents

## Ressources

- Vitest docs : https://vitest.dev/
- Testing Library : https://testing-library.com/
- Zod : https://zod.dev/
- Jest Matchers : https://jestjs.io/docs/expect

---

**Dernière mise à jour** : 13/03/2026
**État** : ✅ Configuré et fonctionnel
