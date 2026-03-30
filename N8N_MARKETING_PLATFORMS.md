# Plateformes marketing — Workflow n8n FacturNow

## Angle éditorial principal
> "Facturation électronique obligatoire en 2026/2027 : ce que chaque freelance doit faire maintenant"
Sujet d'actualité brûlant sur toutes ces plateformes. Se positionner comme la solution, pas comme une pub.

---

## Forums & Communautés — Priorité HAUTE

| Plateforme | URL | Audience | Type d'action |
|---|---|---|---|
| ae.fr | https://ae.fr | Auto-entrepreneurs FR | Articles, réponses aux questions, présentation outil |
| Pragmatic Entrepreneurs Forum | https://forum.pragmaticentrepreneurs.com | Freelances/indépendants FR | Discussion, comparatif logiciels facturation |
| Portail Auto-Entrepreneur | https://www.portail-autoentrepreneur.fr | Auto-entrepreneurs | Article invité facturation électronique 2026 |
| RemoteFR | https://remotefr.com | Freelances remote | Guide facturation, article invité |
| Facebook — Le forum des auto-entrepreneurs | https://www.facebook.com/groups/leforumautoentrepreneur/ | Auto-entrepreneurs | Posts réguliers, tutos |
| Grafikart Forum | https://grafikart.fr/forum/29116 | Devs/designers freelance | Présentation outil |

---

## Reddit — Priorité MOYENNE

| Subreddit | Langue | Type de contenu |
|---|---|---|
| r/france | FR | Posts éducatifs sur la facturation obligatoire 2026 |
| r/entrepreneur | EN | Présentation FacturNow en anglais |
| r/freelance | EN | Tips facturation, présentation outil |
| r/startups | EN | Retour d'expérience builder/fondateur |

---

## Référencement & Visibilité — Priorité HAUTE

| Plateforme | URL | Action |
|---|---|---|
| SaaSForge | https://saasforge.fr | Se faire référencer dans l'annuaire SaaS français (855+ outils) |
| SaaSMania | https://www.saasmania.fr | Article ou review comparatif SaaS freelances |
| Journal du Geek | https://www.journaldugeek.com | Article grand public sur facturation électronique 2026 |
| invoicing.plus | https://invoicing.plus | Blog spécialisé facturation SaaS — article invité |

---

## Plan de contenu n8n

### Trigger options
- **Schedule** : post automatique 2-3x par semaine
- **Événement** : nouvelle inscription → post "X freelances nous ont rejoints cette semaine"

### Contenu par plateforme
- **Forums FR** : articles longs (800-1200 mots), éducatifs, sans spam — 1x/semaine
- **Reddit** : posts courts, valeur directe, lien en commentaire — 2-3x/semaine
- **Annuaires** : inscription unique + màj trimestrielle

### Articles à préparer
1. "Facturation électronique 2026 : guide complet pour les auto-entrepreneurs"
2. "Comment automatiser ses paiements SEPA en tant que freelance"
3. "Comparatif logiciels de facturation gratuits vs payants en 2026"
4. "5 erreurs de facturation qui coûtent cher aux freelances"

---

## À configurer dans n8n
- [ ] Connexion API Reddit (OAuth)
- [ ] Connexion Facebook Graph API (groupe)
- [ ] Templates de posts par plateforme (ton différent selon audience)
- [ ] Schedule hebdomadaire
- [ ] Webhook FacturNow → n8n pour posts événementiels (optionnel)
