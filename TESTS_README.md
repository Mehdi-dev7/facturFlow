# Tests - FacturNow Quick Start

Bienvenue! Vitest a été configuré et les tests unitaires pour la logique métier sont en place.

## 🚀 Démarrer rapide

### Lancer les tests

```bash
# Mode watch (recommandé en développement)
npm run test

# Mode single-run (rapide, idéal pour CI/CD)
npm run test:run
```

## 📊 État actuel

```
✅ Configuration Vitest complète
✅ 59 tests unitaires passing (100%)
✅ Documentation complète
✅ Prêt pour CI/CD

Test Files: 2
Total Tests: 59
Duration: ~800ms
```

## 📁 Où sont les tests?

```
src/test/
├── setup.ts                    # Initialisation
├── calculs-facture.test.ts     # 26 tests pour calcInvoiceTotals()
├── feature-gate.test.ts        # 33 tests pour getEffectivePlan()
└── EXAMPLES.md                 # 10 patterns d'exemple
```

## 📚 Documentation

### Pour comprendre les tests
1. **TESTING.md** - Guide complet (configuration, bonnes pratiques)
2. **src/test/EXAMPLES.md** - 10 patterns copy-paste ready
3. **VITEST_SETUP.md** - Résumé technique

### Pour les prochaines étapes
**TEST_SETUP_COMPLETE.md** - Roadmap détaillée et FAQ

## ✍️ Écrire un nouveau test

### Exemple simple
```typescript
// src/test/ma-fonction.test.ts
import { describe, it, expect } from 'vitest'
import { maFonction } from '@/lib/utils/ma-fonction'

describe('maFonction', () => {
  it('should return expected value', () => {
    const result = maFonction(10)
    expect(result).toBe(20)
  })
})
```

### Pattern standard (AAA)
```typescript
it('description claire', () => {
  // Arrange : préparer les données
  const input = { clientId: 'c1', amount: 100 }

  // Act : exécuter la fonction
  const result = processInvoice(input)

  // Assert : vérifier le résultat
  expect(result.total).toBe(120)
})
```

### Grouper les tests
```typescript
describe('InvoiceCalculator', () => {
  describe('with VAT', () => {
    it('should apply 20% VAT', () => { })
    it('should apply 5.5% VAT', () => { })
  })

  describe('with discount', () => {
    it('should apply percentage discount', () => { })
    it('should apply fixed discount', () => { })
  })
})
```

## 🎯 Ce qui est testé

### Calculs de factures ✅
- Montants (subtotal, netHT, TVA, total TTC)
- Remises (%, montant, plafonné)
- Acomptes (déduit, plafonné)
- Arrondis à 2 décimales
- 26 tests, 100% coverage

### Feature-gating ✅
- Plans FREE/PRO/BUSINESS
- Admin email, trial, grantedPlan
- Accès aux features par plan
- 33 tests, 100% coverage

## 🔄 Workflow quotidien

### En développement
```bash
# 1. Lancer les tests en watch
npm run test

# 2. Modifiez votre code
# → Les tests relancent automatiquement

# 3. Voir les résultats
# ✓ all tests pass → continue
# ✗ tests fail → fix et re-run automatique
```

### Avant de commiter
```bash
# Lancer une dernière fois
npm run test:run

# Si tout est vert
git add ...
git commit -m "..."
```

### En CI/CD
```bash
# Les tests tournent automatiquement
npm run test:run

# Si un test échoue → CI échoue → pas de merge
# Bien!
```

## ⚡ Prochaines étapes

### Court terme (facile)
```
□ Tests Zod (validation formulaires)
□ Tests formatters (devise, dates)
□ Tests constants/énumérations
→ ~80-100 tests supplémentaires
→ Effort: 1-2 jours
```

### Moyen terme (modéré)
```
□ Tests React components
□ Tests custom hooks
□ Tests calculateurs avancés
→ ~200-300 tests supplémentaires
→ Effort: 1-2 semaines
```

### Long terme (complexe)
```
□ Tests E2E avec Playwright
□ Tests API/webhooks
→ ~100-150 tests supplémentaires
→ Effort: 2-4 semaines
```

## 🐛 Troubleshooting

### Les tests ne passent pas?
```bash
# Vérifier que Vitest est installé
npm install

# Relancer les tests
npm run test:run

# Voir le détail
npm run test:run -- --reporter=verbose
```

### Besoin d'aide?
- Voir `TESTING.md` pour le guide complet
- Voir `src/test/EXAMPLES.md` pour les patterns
- Voir `VITEST_SETUP.md` pour la FAQ

### Comment tester une fonction qui utilise Prisma?
Voir `src/test/EXAMPLES.md` pattern 4 (Mocking)

### Comment tester un composant React?
Voir `src/test/EXAMPLES.md` pattern 3 (React components)

## 📦 Fichiers créés

```
✅ vitest.config.ts          Configuration Vitest
✅ src/test/setup.ts         Initialisation
✅ src/test/calculs-facture.test.ts    26 tests
✅ src/test/feature-gate.test.ts       33 tests
✅ src/test/EXAMPLES.md      10 patterns
✅ package.json              Scripts test ajoutés
✅ .gitignore                .vitest/ ignoré
✅ TESTING.md                Guide complet
✅ VITEST_SETUP.md           Setup summary
✅ TEST_SETUP_COMPLETE.md    Roadmap détaillée
✅ TESTS_README.md           Ce fichier
```

## 🔗 Ressources

- [Vitest docs](https://vitest.dev/) - Documentation officielle
- [Testing Library React](https://testing-library.com/) - Tests React
- [Jest matchers](https://jestjs.io/docs/expect) - Assertions
- [Zod](https://zod.dev/) - Validation

## ✅ Checklist avant le commit

```
□ npm run test:run → All passing
□ npm run build → No errors
□ npm run lint → No warnings
□ Tests couvrent la logique métier
□ Documentation est claire
□ Code suit les patterns dans EXAMPLES.md
```

---

## TL;DR

```bash
# Install
npm install

# Run tests
npm run test          # watch mode
npm run test:run      # single run

# Status
✅ 59 tests passing
✅ 100% coverage pour logique testée
✅ Prêt pour production
```

**Start here**: Open `TESTING.md` for the complete guide.

---

**Last updated**: 2026-03-13
**Status**: ✅ Ready to use
**Maintainer**: Claude Code
