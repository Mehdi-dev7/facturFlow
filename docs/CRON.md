# 🕐 Cron Jobs - FacturNow

## Vue d'ensemble

FacturNow utilise 3 cron jobs automatisés pour maintenir les données à jour :

| Cron | Fréquence | Description |
|------|-----------|-------------|
| `update-overdue` | Quotidien 00h00 | Met à jour les factures en retard |
| `update-expired-quotes` | Quotidien 00h00 | Expire les devis anciens |
| `sync-einvoice-events` | Quotidien 01h00 | Synchronise les statuts SuperPDP |

## Sécurité

Tous les crons sont protégés par `CRON_SECRET` :

```bash
# .env.local
CRON_SECRET="votre-secret-securise-ici"
```

**⚠️ Important** : Utilisez un secret fort (32+ caractères aléatoires)

## Test en développement

### 1. Lancer le serveur
```bash
npm run dev
```

### 2. Tester la sécurité des crons
```bash
node scripts/test-cron.js
```

### 3. Déclencher manuellement un cron
```bash
# Avec curl
curl -H "Authorization: Bearer votre-cron-secret" \
  http://localhost:3000/api/cron/sync-einvoice-events

# Réponse attendue
{"success":true,"processed":0,"lastEventId":0}
```

## Configuration Vercel

Les crons sont automatiquement déployés avec cette config dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-einvoice-events",
      "schedule": "0 1 * * *"
    }
  ]
}
```

## Variables d'environnement requises

### Pour sync-einvoice-events
- `CRON_SECRET` - Sécurité des routes cron
- `SUPERPDP_CLIENT_ID` - Authentification SuperPDP
- `SUPERPDP_CLIENT_SECRET` - Authentification SuperPDP
- `DATABASE_URL` - Base de données Prisma

## Monitoring

### Logs Vercel
```bash
vercel logs --function=api/cron/sync-einvoice-events
```

### Statuts possibles
- `200` - Succès
- `401` - Secret cron incorrect
- `500` - Erreur SuperPDP ou base de données

## Dépannage

### Erreur 401 Unauthorized
- Vérifiez `CRON_SECRET` dans les variables d'environnement
- Assurez-vous que Vercel a la bonne valeur

### Erreur 500 SuperPDP
- Vérifiez `SUPERPDP_CLIENT_ID` et `SUPERPDP_CLIENT_SECRET`
- Testez l'authentification SuperPDP manuellement

### Pas de synchronisation
- Vérifiez que des factures ont `einvoiceRef` non null
- Consultez la table `EInvoiceSyncState` pour le `lastEventId`