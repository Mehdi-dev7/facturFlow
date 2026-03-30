# Feature — Import de bon de commande externe (OCR/IA)

## Statut : ✅ Implémenté (30/03/2026)

---

## Contexte

Un utilisateur qui reçoit un bon de commande d'une société externe peut :
- Créer une facture manuellement en recopiant les infos ❌ (fastidieux)
- Convertir un BC **interne** FacturNow en facture (déjà implémenté) ✅
- **Uploader le PDF/image d'un BC externe → IA extrait les données → facture pré-remplie** ✅ (cette feature)

---

## User story

> "Je reçois un bon de commande PDF d'un client. J'upload le PDF dans FacturNow, les infos sont extraites automatiquement (client, lignes, prix, référence), je vérifie et je génère la facture en 1 clic."

---

## Comment l'utiliser

### Prérequis
- Être sur le plan **Business**
- Variable d'env `ANTHROPIC_API_KEY=sk-ant-api03-...` configurée (`.env.local` + Vercel)

### Flux utilisateur

1. **Factures → bouton "Importer un BC"** (header, à gauche de "Nouvelle facture")
2. **Upload** le PDF ou l'image du BC reçu (drag & drop ou clic)
3. Claude analyse le document — quelques secondes
4. **Aperçu** des données extraites : référence, client, lignes, dates, TVA
5. Clic **"Créer la facture"** → redirige vers `/dashboard/invoices/new?from=bc`
6. Le formulaire est **pré-rempli** — vérifier, corriger, sauvegarder normalement

### Ce que l'IA extrait

| Champ extrait | Injection dans le formulaire |
|---------------|------------------------------|
| `bcReference` | Mis dans les Notes |
| `clientName` + `clientAddress` | Mis dans les Notes (lier manuellement le client) |
| `lines` (description, qty, prix HT) | Lignes du formulaire |
| `vatRate` | TVA (prise sur la 1ère ligne) |
| `date` | Date de la facture |
| `dueDate` | Échéance |
| `notes` | Notes de la facture |

> Le client n'est pas lié automatiquement (pas de correspondance SIRET/email fiable) — à sélectionner manuellement dans le formulaire.

---

## Architecture technique

### Stack
- **API IA** : Claude API (Anthropic) — modèle `claude-sonnet-4-6`
- **Support natif** : PDF + PNG + JPG + WebP (base64 → Claude)
- **Pas de stockage** : le fichier n'est jamais sauvegardé en DB ni Supabase Storage
- **Passage de données** : `localStorage` (clé `bc_import_data`), effacé après usage

### Fichiers implémentés

```
src/
├── app/api/extract-bc/route.ts          ← POST /api/extract-bc
├── components/factures/
│   └── bc-import-dialog.tsx             ← Dialog upload + preview extraits
└── app/(dashboard)/dashboard/invoices/
    ├── page.tsx                          ← Bouton "Importer un BC" + BcImportDialog
    └── new/page.tsx                      ← Lecture localStorage ?from=bc + pré-remplissage
```

### Flux technique

```
1. User upload le fichier (PDF/PNG/JPG, max 10 MB)
2. POST /api/extract-bc — FormData avec le fichier
3. Vérification auth + feature gate Business (canUseFeature userId "bc_import")
4. Fichier converti en base64
5. Appel claude-sonnet-4-6 :
   - PDF  → type "document" (support natif Claude)
   - Image → type "image"
6. Claude retourne JSON structuré (prompt d'extraction)
7. JSON parsé + nettoyé (retrait backticks si présents)
8. Retourné au client : { success: true, data: BcExtractedData }
9. Dialog affiche l'aperçu — user valide
10. localStorage.setItem("bc_import_data", JSON.stringify(data))
11. Redirect → /dashboard/invoices/new?from=bc
12. Page new/ lit le localStorage, setValue() sur le formulaire RHF
13. localStorage.removeItem("bc_import_data") — nettoyage immédiat
```

### Prompt d'extraction

```
Extrais les informations de ce bon de commande et retourne UNIQUEMENT un objet JSON :
{
  "bcReference": "string | null",
  "clientName": "string | null",
  "clientAddress": "string | null",
  "clientSiret": "string | null",
  "clientEmail": "string | null",
  "date": "YYYY-MM-DD | null",
  "dueDate": "YYYY-MM-DD | null",
  "lines": [{ "description", "quantity", "unitPrice" (HT), "vatRate" (0/5.5/10/20) }],
  "notes": "string | null"
}
```

### Sécurité
- Auth vérifiée server-side (session Better Auth)
- Feature gate : `canUseFeature(dbUser, "bc_import")` → 403 si pas Business
- Taille max : 10 MB (vérification client + serveur)
- Formats acceptés : `application/pdf`, `image/png`, `image/jpeg`, `image/webp`
- Aucun fichier stocké — traitement en mémoire uniquement

### Gestion des erreurs dans le dialog

| Cas | Comportement |
|-----|--------------|
| Fichier trop lourd ou mauvais format | Message d'erreur, retour step upload |
| Plan pas Business (403) | Écran upgrade avec lien `/dashboard/subscription` |
| Erreur API Claude | Message d'erreur, retour step upload |
| Données partiellement extraites | Warning jaune + invitation à compléter le formulaire |

---

## Feature gate

```typescript
// src/lib/feature-gate.ts
type Feature = ... | "bc_import";

const BUSINESS_FEATURES: Feature[] = [
  ...PRO_FEATURES,
  "bc_import",  // ← ajouté
  ...
];
```

---

## Coût par extraction

| Service | Prix/page | BC 2 pages | Précision |
|---------|-----------|------------|-----------|
| **Claude Sonnet 4.6** ← retenu | ~$0.005 | ~$0.01 | Excellente |
| GPT-4o Vision | ~$0.01 | ~$0.02 | Excellente |
| AWS Textract | ~$0.015 | ~$0.03 | Très bonne |

**Projection à 100 users × 5 extractions/mois = ~$5/mois total** — coût absorbé dans le plan Business.

### Limites anti-abus
- Réservé plan **Business** uniquement
- 50 extractions/mois par user *(à implémenter si abus constatés)*

---

## Plan tarifaire

- **Business (20€/mois)** : inclus (coût IA absorbé)
- **Pro / Free** : non disponible — écran upgrade affiché

---

## Variables d'environnement

```bash
# .env.local + Vercel
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Clé à générer sur : https://console.anthropic.com → API Keys
