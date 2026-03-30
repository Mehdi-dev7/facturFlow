# Feature — Import de bon de commande externe (OCR/IA)

## Contexte

Un utilisateur qui reçoit un bon de commande d'une société externe peut aujourd'hui :
- Créer une facture manuellement en recopiant les infos
- Convertir un BC **interne** FacturNow en facture (déjà implémenté)

Cette feature permet d'uploader le PDF d'un BC externe et de générer automatiquement une facture pré-remplie.

---

## User story

> "Je reçois un bon de commande PDF d'un client. J'upload le PDF dans FacturNow, les infos sont extraites automatiquement (client, lignes, prix, référence), je vérifie et je génère la facture en 1 clic."

---

## Architecture technique

### Stack retenue
- **API** : GPT-4o Vision (OpenAI) ou Claude API (Anthropic) — à trancher
- **Upload** : Supabase Storage (PDF temporaire, supprimé après extraction)
- **Parsing** : réponse JSON structurée via prompt engineering

### Flux
```
1. User upload le PDF du BC externe
2. PDF converti en image(s) côté serveur (ou envoyé direct selon l'API)
3. Appel API IA avec prompt d'extraction structurée
4. Retour JSON → pré-remplissage du formulaire de facture
5. User vérifie / corrige les données extraites
6. Création de la facture (flow standard)
```

### Prompt d'extraction (exemple)
```
Extrais les informations de ce bon de commande et retourne un JSON avec :
{
  "bcReference": "string",        // numéro du BC
  "clientName": "string",
  "clientAddress": "string",
  "clientSiret": "string | null",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD | null",
  "lines": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "vatRate": number           // 0, 5.5, 10 ou 20
    }
  ],
  "notes": "string | null"
}
Retourne uniquement le JSON, sans texte autour.
```

### Sécurité
- Fichier stocké temporairement (supprimé après extraction, max 5 min)
- Taille max : 10 MB
- Formats acceptés : PDF, PNG, JPG

---

## Coût par extraction

| Service | Prix/page | BC 2 pages | Précision |
|---------|-----------|------------|-----------|
| GPT-4o Vision | ~$0.01 | ~$0.02 | Excellente |
| Claude API (Sonnet) | ~$0.005 | ~$0.01 | Excellente |
| AWS Textract | ~$0.015 | ~$0.03 | Très bonne |
| Google Document AI | ~$0.065 | ~$0.13 | Très bonne |

**Projection à 100 users × 5 extractions/mois = ~$10/mois total** — coût absorbé.

### Limites de sécurité
- **50 extractions/mois** par user (anti-abus)
- Réservé au plan **Business** (ou Pro selon décision)

---

## Plan d'implémentation

### Étapes
1. **Route API** `POST /api/extract-bc` — reçoit le PDF, appelle l'IA, retourne le JSON
2. **Supabase Storage** — bucket temporaire `bc-uploads` avec politique d'expiration
3. **Composant UI** — drag & drop upload + preview des données extraites + formulaire de correction
4. **Création facture** — injection des données dans le flow standard de création

### Variables d'environnement à ajouter
```
OPENAI_API_KEY=sk-...          # si GPT-4o retenu
# ou
ANTHROPIC_API_KEY=sk-ant-...   # si Claude retenu
```

### Durée estimée
~1-2 jours de dev.

---

## Plan tarifaire

- **Business (20€/mois)** : inclus (50 extractions/mois absorbées)
- **Pro (9,99€/mois)** : à décider — inclus limité (10/mois) ou Business only

> 💡 Note : cette feature justifie facilement un prix Business à 25€/mois.
> À considérer pour une prochaine révision tarifaire.

---

## Statut

- [ ] À implémenter (post-lancement)
- [ ] Choix API IA à trancher (GPT-4o vs Claude)
- [ ] Décision plan tarifaire (Business only vs Pro limité)
