# Vitest Setup Complete - FacturNow

## Status: ✅ READY TO USE

Vitest a été configuré avec succès et les tests unitaires pour la logique métier critique sont en place.

---

## What's Done

### 1. Installation & Configuration
- **Vitest 4.1.0** installé avec jsdom pour simuler le navigateur
- **@testing-library** intégré pour les futurs tests React
- **Path aliases** configurés pour `@/` imports
- **NPM scripts** ajoutés : `npm run test` (watch) et `npm run test:run` (CI)

### 2. Core Logic Tests (59 tests, all passing)

#### `src/test/calculs-facture.test.ts` - 26 tests
Couvre la fonction `calcInvoiceTotals()` qui calcule les montants des factures.

**Scénarios testés** :
- ✅ Calculs simples (1 ligne, 1 montant)
- ✅ TVA à différents taux : 0%, 5.5%, 20%, 19.6%
- ✅ Remises en pourcentage : 10%, 50%, 100%+
- ✅ Remises en montant : 20€, 100€, dépassement
- ✅ Acomptes : 50€, 100€, dépassement total
- ✅ Cas limites : quantité 0, prix 0, tableau vide
- ✅ Combinaisons : remise + TVA + acompte
- ✅ Arrondis à 2 décimales (cas réels)

**Exemple de couverture** :
```
Input: 2 lignes × 100€ + TVA 20% + 10% remise + 50€ acompte
Expected: subtotal=200 → discount=20 → netHT=180 → tax=36 → totalTTC=216 → netAPayer=166
Status: ✅ PASS
```

#### `src/test/feature-gate.test.ts` - 33 tests
Couvre les fonctions `getEffectivePlan()` et `canUseFeature()` pour le système d'accès.

**Scénarios testés** :
- ✅ Admin email → BUSINESS (priorité 1)
- ✅ grantedPlan BUSINESS → BUSINESS (priorité 2)
- ✅ Trial actif → PRO (priorité 3)
- ✅ Plan DB → FREE/PRO/BUSINESS (priorité 4)
- ✅ Feature access par plan :
  - FREE : aucune feature
  - PRO : Stripe, PayPal, GoCardless, CSV export, e-invoicing (100/mois)
  - BUSINESS : PRO + API/webhooks, e-invoicing illimité, FEC export, multi-users

**Exemple de couverture** :
```
Scenario: User with trial expiring tomorrow + FREE plan
Expected effective plan: PRO (trial active takes precedence)
Features allowed: payment_stripe=true, api_webhooks=false
Status: ✅ PASS
```

### 3. Documentation

#### `TESTING.md` (6.8 KB)
Guide complet :
- Configuration Vitest expliquée
- Scripts et utilisation
- Architecture et patterns AAA
- Bonnes pratiques
- Prochaines étapes
- Ressources

#### `src/test/EXAMPLES.md` (9.7 KB)
10 patterns de tests couvrant :
1. Fonctions pures
2. Validation Zod
3. Composants React
4. Mocking
5. Async/await
6. Hooks custom
7. Snapshots
8. Dates
9. Formatage
10. Constantes

#### `VITEST_SETUP.md` (6.5 KB)
Résumé de la configuration :
- Fichiers créés
- Résultats des tests
- Prochaines étapes (court/moyen/long terme)
- FAQ

---

## Files Created

```
facturflow/
├── vitest.config.ts                    # Configuration Vitest
├── package.json                        # Scripts "test" et "test:run" ajoutés
├── .gitignore                          # .vitest/ ignoré
├── TESTING.md                          # Guide complet des tests
├── VITEST_SETUP.md                     # Setup summary
├── TEST_SETUP_COMPLETE.md              # Ce fichier
└── src/test/
    ├── setup.ts                        # Initialisation
    ├── calculs-facture.test.ts         # 26 tests ✅
    ├── feature-gate.test.ts            # 33 tests ✅
    └── EXAMPLES.md                     # 10 patterns d'exemple
```

---

## Test Results

```
Test Files: 2 passed (2)
Tests:      59 passed (59)
Duration:   ~800ms
Coverage:   100% pour fonctions testées

✅ All tests passing - No failures
```

---

## How to Use

### Run tests in development (watch mode)
```bash
npm run test
```
- Relance automatiquement sur modification
- Affiche les résultats en temps réel
- Appuyez sur `q` pour quitter

### Run tests in CI/CD (single run)
```bash
npm run test:run
```
- Exécute une fois
- Retourne code 0 (succès) ou 1 (erreur)
- Idéal pour les pipelines CI/CD

---

## Next Steps

### ⚡ Court terme (facile, 1-2 jours)
1. **Tests Zod** : Validation des formulaires
   - `src/lib/validations/invoice.test.ts`
   - `src/lib/validations/client.test.ts`
   - `src/lib/validations/quote.test.ts`
   - Estimé : 50-75 tests

2. **Tests Formatters** : Formatage des données
   - `src/lib/utils/formatters.test.ts`
   - Estimé : 20 tests

3. **Tests Constants** : Énumérations et listes
   - `src/test/constants.test.ts`
   - Estimé : 10 tests

**Total court terme : ~100 tests supplémentaires**

### 🎯 Moyen terme (modéré, 1-2 semaines)
4. **Tests React Components** : Avec @testing-library/react
   - Forms (InvoiceForm, ClientForm, QuoteForm)
   - Modales (CreateClientModal, etc.)
   - Composants partagés (DataTable, etc.)
   - Estimé : 100-150 tests

5. **Tests Custom Hooks** : useInvoices, useClients, useQuotes
   - Estimé : 30-50 tests

6. **Tests Calculateurs** : Acomptes, récurrences, exports
   - Estimé : 50-100 tests

**Total moyen terme : ~200-300 tests supplémentaires**

### 🚀 Long terme (complexe, 2-4 semaines)
7. **Tests E2E avec Playwright** : Workflows critiques
   - Création facture → envoi email → paiement → archivage
   - OAuth login/signup
   - Paiements Stripe/PayPal/GoCardless (sandbox)
   - Estimé : 20-30 tests

8. **Tests API/Webhooks** : Routes `/api/`
   - Webhooks Stripe, PayPal, GoCardless
   - E-invoicing SuperPDP
   - Estimé : 50-100 tests

**Total long terme : ~100-150 tests supplémentaires**

---

## Architecture Pattern

### Test Pyramid (cible)

```
         /\
        /  \  E2E (20 tests)
       /____\
      /      \
     /________\  Integration (100 tests)
    /          \
   /____________\ Unit (300 tests)

Total: ~420 tests
Coverage: 80-90%
```

### Progression recommandée
1. **Phase 1 (Now)** : Unit tests core logic ✅
2. **Phase 2 (1-2 semaines)** : Tests validation & components
3. **Phase 3 (2-4 semaines)** : Tests E2E & API
4. **Phase 4 (Production)** : Maintain & expand

---

## Integration with CI/CD

### GitHub Actions (recommandé)
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
      - run: npm run test:run  # Fail if tests fail
      - run: npm run build     # Fail if build fails
```

### Pre-commit Hook (optionnel)
Ajouter à `.git/hooks/pre-commit` :
```bash
#!/bin/sh
npm run test:run || exit 1
```

### Merge Rules
Ajouter à GitHub Branch Protection :
- ✅ Status checks : `Tests`
- ✅ Dismiss stale reviews
- ✅ Require code review before merge

---

## Performance

| Metric | Value |
|--------|-------|
| Total duration | ~800ms |
| Setup time | ~400ms (jsdom) |
| Test execution | ~8ms |
| Test files | 2 |
| Total tests | 59 |
| Per-test speed | ~135μs |

**Optimisations future** :
- Lazy load Prisma mocks → -50ms
- Parallel test execution → -60%
- Test caching → -40%

---

## Troubleshooting

### Q. Les tests sont lents?
**R.** Le setup jsdom (~400ms) domine. C'est normal pour ~60 tests. À 300+ tests, sera ~1.5s.

### Q. Comment tester avec Prisma?
**R.** Utiliser `vi.mock()` :
```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: { create: vi.fn() }
  }
}))
```
Voir `EXAMPLES.md` pattern 4.

### Q. Comment tester les composants React?
**R.** Utiliser `render()` + `userEvent` :
```typescript
const { screen } = render(<MyComponent />)
await userEvent.click(screen.getByRole('button'))
```
Voir `EXAMPLES.md` pattern 3.

### Q. Ajouter des tests pour Stripe/PayPal?
**R.** Utiliser les sandbox APIs + mocking. Tests E2E recommandés avec Playwright.

---

## Collaboration

### Pour un autre développeur
```bash
# Clone et setup
git clone <repo>
cd facturflow
npm install

# Lancer les tests
npm run test:run
npm run test    # ou watch mode
```

### Écrire un nouveau test
1. Créer `src/test/ma-fonction.test.ts`
2. Importer la fonction à tester
3. Utiliser pattern AAA (Arrange-Act-Assert)
4. Grouper avec `describe()`
5. Lancer `npm run test`
6. Commiter : `git add src/test/ma-fonction.test.ts`

---

## Resources

### Official Documentation
- [Vitest](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/)
- [Jest Matchers](https://jestjs.io/docs/expect)

### Examples in Project
- `src/test/EXAMPLES.md` : 10 patterns
- `TESTING.md` : Guide complet

### Next Learning
- Playwright for E2E : https://playwright.dev/
- Prisma Testing : https://www.prisma.io/docs/guides/testing
- Mock Service Worker (MSW) : https://mswjs.io/

---

## Summary

✅ **Vitest configuré et fonctionnel**
✅ **59 tests unitaires passing pour logique métier critique**
✅ **Documentation complète et exemples fournis**
✅ **Prêt pour CI/CD et expansion**

**Prochaines étapes** : Ajoutez les tests Zod/Formatters (court terme), puis composants React (moyen terme).

---

**Last Updated**: 2026-03-13
**Status**: ✅ Production Ready
**Maintained by**: Claude Code
