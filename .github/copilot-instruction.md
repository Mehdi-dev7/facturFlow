# FacturNow - SaaS de Facturation Intelligente

## Stack Technique COMPLÈTE
- Next.js 16 + TypeScript (strict mode) + App Router
- Supabase PostgreSQL
- Prisma ORM
- Better Auth (Google, GitHub, Microsoft OAuth + Email OTP)
- Tailwind CSS + Shadcn/ui
- TanStack Query (React Query) pour data fetching
- Zustand pour état global
- jsPDF ou @react-pdf/renderer pour génération PDF
- Zod pour validation
- React Hook Form pour formulaires
- date-fns pour manipulation dates
- **Paiements** : Stripe (CB, Apple Pay, Google Pay) + PayPal + GoCardless (SEPA Direct Debit)

## Architecture du Projet

### Structure des Dossiers
```
app/
├── (auth)/              # Routes publiques (login, signup)
├── (dashboard)/         # Routes protégées (dashboard, clients, factures)
├── api/                 # API Routes & Server Actions
components/
├── ui/                  # Shadcn components
├── forms/               # Formulaires réutilisables
├── layouts/             # Layouts (DashboardLayout, etc.)
lib/
├── auth.ts              # Configuration Better Auth
├── auth-client.ts       # Client Better Auth pour React
├── prisma.ts            # Prisma client singleton
├── validations/         # Schémas Zod
hooks/                   # Custom hooks
stores/                  # Zustand stores
types/                   # Types TypeScript globaux
prisma/
└── schema.prisma        # Schéma DB
```

### Principes d'Architecture
1. **Server Components par défaut** - Client Components uniquement si nécessaire
2. **Server Actions** pour mutations (create, update, delete)
3. **TanStack Query** pour fetching côté client
4. **Zustand** pour état global (user settings, UI state, draft invoice)
5. **Validation** Zod côté serveur ET client

## Règles de Code STRICTES

### Performance & Optimisation
- TOUJOURS utiliser `useCallback` pour fonctions passées en props
- TOUJOURS utiliser `useMemo` pour calculs coûteux ou listes filtrées
- Lazy loading des composants lourds avec `dynamic()` (ex: PDF viewer)
- Utiliser `loading.tsx` et `error.tsx` pour chaque route
- Débouncer les inputs de recherche (300ms minimum)

### React Query (TanStack Query)
- TOUJOURS préfixer les query keys par entité : `['clients']`, `['invoices']`, `['products']`
- Utiliser `useMutation` avec `onSuccess` pour invalider le cache
- Configurer `staleTime` et `cacheTime` selon besoin
- Utiliser `optimisticUpdates` pour meilleure UX

Exemple :
```typescript
// Query
const { data: clients } = useQuery({
  queryKey: ['clients'],
  queryFn: () => getClients()
})

// Mutation
const mutation = useMutation({
  mutationFn: createClient,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  }
})
```

### Zustand Stores
- Un store par domaine : `useUserStore`, `useInvoiceStore`, `useUIStore`
- TOUJOURS utiliser des selectors pour éviter re-renders
- Persister les données importantes avec `persist` middleware

Exemple :
```typescript
const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set) => ({
      draftInvoice: null,
      setDraftInvoice: (invoice) => set({ draftInvoice: invoice }),
    }),
    { name: 'invoice-storage' }
  )
)
```

### TypeScript
- JAMAIS `any` - Utiliser `unknown` si nécessaire
- TOUJOURS typer les props des composants
- Utiliser `satisfies` pour vérifier les types sans perdre l'inférence
- Exporter les types depuis `/types` pour réutilisation

### Composants
- PascalCase pour noms : `InvoiceForm`, `ClientList`
- Fichiers en kebab-case : `invoice-form.tsx`
- `"use client"` uniquement si :
  * Hooks React (useState, useEffect, etc.)
  * Event handlers (onClick, onChange)
  * Context providers
  * TanStack Query hooks
- Props interface toujours explicite :
```typescript
interface InvoiceFormProps {
  initialData?: Invoice
  onSuccess?: () => void
}
```

### Server Actions
- Fichier `actions.ts` dans chaque feature folder
- TOUJOURS valider avec Zod
- TOUJOURS try/catch avec messages d'erreur clairs
- Retourner `{ success: boolean, data?, error? }`

Exemple :
```typescript
'use server'

export async function createInvoice(data: unknown) {
  try {
    const validated = invoiceSchema.parse(data)
    const invoice = await prisma.document.create({ data: validated })
    revalidatePath('/dashboard/invoices')
    return { success: true, data: invoice }
  } catch (error) {
    return { success: false, error: 'Failed to create invoice' }
  }
}
```

### Gestion des Erreurs
- TOUJOURS afficher des messages utilisateur clairs
- Utiliser toast/sonner pour feedback
- Logger les erreurs serveur avec détails
- Fallback UI avec error boundaries

## Schéma de Données (Prisma)

### Models Principaux
- **User** : Infos entreprise, settings facturation, templates, connexion GoCardless
- **Client** : B2B (SIRET) ou B2C (particulier), mandats SEPA
- **Product** : Services ou produits avec prix/TVA
- **Document** : Factures, devis, avoirs, etc.
- **DocumentLineItem** : Lignes de documents
- **RecurringInvoice** : Abonnements
- **Template** : Templates par métier
- **Reminder** : Relances automatiques
- **Payment** : Historique paiements multi-providers

### Relations Importantes
- User → Clients (1-n)
- User → Products (1-n)
- User → Documents (1-n)
- Client → Documents (1-n)
- Document → LineItems (1-n) avec CASCADE delete
- Document → Payments (1-n)
- Document → Template (n-1)

### Extensions Prisma pour SEPA
```prisma
model Client {
  // ... champs existants
  
  // SEPA/GoCardless fields
  gocardlessMandateId        String?        // ID mandat GoCardless
  gocardlessMandateStatus    MandateStatus? // PENDING, ACTIVE, CANCELLED
  gocardlessMandateCreatedAt DateTime?
  gocardlessCustomerId       String?        // Customer ID GoCardless
  
  @@index([gocardlessMandateId])
}

model User {
  // ... champs existants
  
  // GoCardless integration
  gocardlessAccessToken   String?
  gocardlessCreditorId    String?   // Creditor ID du user sur GoCardless
  gocardlessConnectedAt   DateTime?
}

enum MandateStatus {
  PENDING_SUBMISSION
  SUBMITTED
  ACTIVE
  CANCELLED
  FAILED
  EXPIRED
}

model Payment {
  id                String          @id @default(cuid())
  documentId        String
  document          Document        @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  provider          PaymentProvider // GOCARDLESS, STRIPE, PAYPAL, BANK_TRANSFER
  
  // GoCardless specific
  gocardlessPaymentId  String?
  gocardlessStatus     String?      // pending_submission, confirmed, paid_out, failed
  
  amount            Decimal         @db.Decimal(12,2)
  currency          String          @default("EUR")
  
  createdAt         DateTime        @default(now())
  paidAt            DateTime?
  failedAt          DateTime?
  failureReason     String?
  
  @@index([documentId])
  @@index([gocardlessPaymentId])
}

enum PaymentProvider {
  GOCARDLESS
  STRIPE
  PAYPAL
  BANK_TRANSFER
}
```

## Flows Applicatifs Clés

### 1. Authentification
```
1. User arrive sur /login
2. Choix : Email/Password OU OAuth (Google/GitHub/Microsoft)
3. Si Email/Password :
   - Inscription → Email envoyé avec code OTP
   - Vérification code → Compte activé
4. Si OAuth :
   - Redirect vers provider → Callback → Auto-login
5. Session créée → Redirect /dashboard
6. Middleware protège routes /dashboard/*
```

### 2. Création de Facture
```
1. User clique "Nouvelle facture"
2. Sélection client (existant ou création rapide)
3. Choix mode paiement :
   - Virement bancaire classique
   - Carte bancaire (Stripe)
   - Prélèvement SEPA (GoCardless)
4. Ajout lignes :
   - Produit existant (auto-fill prix/TVA) OU
   - Ligne custom (description manuelle)
5. Calculs automatiques :
   - Sous-total = sum(quantity × unitPrice)
   - TVA = sum(subtotal × vatRate)
   - Total TTC = subtotal + TVA
   - Remise optionnelle
6. Aperçu temps réel du PDF
7. Choix : Brouillon / Envoyer / Télécharger
8. Génération numéro auto (prefix + counter)
9. Save DB + Génération PDF + (optionnel) Email client
10. Si SEPA sélectionné : setup mandat (voir flow GoCardless)
```

### 3. Génération PDF
```
1. Template sélectionné (par défaut ou custom)
2. Données facture + user + client injectées
3. Calculs vérifiés server-side
4. PDF généré avec @react-pdf/renderer ou jsPDF
5. Upload Supabase Storage OU génération à la volée
6. URL retournée et stockée dans document.pdfUrl
```

### 4. Relances Automatiques
```
1. Cron job quotidien (Vercel Cron ou externe)
2. Query factures OVERDUE (status != PAID && dueDate < today)
3. Pour chaque facture :
   - Check dernière relance envoyée
   - Déterminer niveau (FRIENDLY → FIRM → FORMAL)
   - Générer email avec template
   - Envoyer + Log dans Reminder
   - Update status si besoin
```

## Flow GoCardless & SEPA Direct Debit

### 1. Connexion User FacturNow → GoCardless (One-time setup)

**Workflow OAuth GoCardless :**
```
1. User clique "Activer paiements SEPA" dans Settings
2. Redirect vers GoCardless OAuth :
   - URL : https://connect.gocardless.com/oauth/authorize
   - Params : client_id, redirect_uri, scope=read_write
3. User crée compte GoCardless ou login si existe
4. User autorise FacturNow à accéder à son compte
5. GoCardless redirect vers FacturNow callback avec code
6. Exchange code contre access_token (server-side)
7. Stocker access_token dans DB (User.gocardlessAccessToken)
8. Afficher badge "✅ SEPA activé" dans dashboard
```

**API Calls nécessaires :**
- POST /oauth/access_token (exchange code)
- GET /creditors (récupérer creditor_id du user)

### 2. Création Facture avec Option SEPA

**Interface utilisateur :**
```
Lors de création facture, proposer modes de paiement :
- [ ] Virement bancaire classique
- [ ] Carte bancaire (Stripe)
- [x] Prélèvement SEPA automatique (GoCardless)
```

**Si SEPA sélectionné :**
```
1. Facture créée avec paymentMethod: "SEPA_DIRECT_DEBIT"
2. Email envoyé au client avec lien "Autoriser prélèvement"
3. Lien pointe vers page GoCardless de setup mandat
```

### 3. Setup Mandat SEPA (Client final)

**Workflow signature mandat (géré par GoCardless) :**
```
1. Client clique sur lien dans email
2. Redirect vers page GoCardless (branded FacturNow)
3. Client entre infos :
   - Nom complet
   - Email
   - IBAN
   - Adresse postale
4. Client accepte mandat SEPA (légal)
5. GoCardless envoie email confirmation au client
6. Mandat status: PENDING_SUBMISSION (3-5 jours activation)
7. Webhook envoyé à FacturNow : mandate.submitted
8. Après délai bancaire : mandate.active
9. Prélèvement possible
```

**API Calls nécessaires :**
- POST /redirect_flows (créer flow de signature)
- GET /redirect_flows/:id (compléter après signature)
- POST /mandates (confirmer le mandat)

### 4. Prélèvement Automatique

**Workflow prélèvement :**
```
1. Date d'échéance facture arrivée (dueDate)
2. Cron job quotidien détecte factures à prélever :
   - status: SENT ou VIEWED
   - dueDate <= today
   - paymentMethod: SEPA_DIRECT_DEBIT
   - Client a mandat actif
3. Créer payment via API GoCardless :
   - POST /payments
   - Params : amount, currency, mandate_id
4. Payment status: PENDING_SUBMISSION
5. Préavis client envoyé par GoCardless (3 jours avant)
6. J+3 : Prélèvement effectué
7. Webhooks reçus :
   - payments.submitted → prélèvement en cours
   - payments.confirmed → prélèvement réussi
   - payments.paid_out → argent viré sur compte user
8. Update facture status: PAID + paidAt + paidAmount
```

**API Calls nécessaires :**
- POST /payments (créer prélèvement)
- GET /payments/:id (vérifier statut)

### 5. Webhooks GoCardless (Events handling)

**Events critiques à gérer :**
```typescript
// app/api/webhooks/gocardless/route.ts

export async function POST(request: Request) {
  const signature = request.headers.get('Webhook-Signature')
  const body = await request.text()
  
  // Vérifier signature webhook (sécurité)
  // Utiliser GOCARDLESS_WEBHOOK_SECRET
  
  const events = JSON.parse(body).events
  
  for (const event of events) {
    switch (event.resource_type) {
      case 'mandates':
        await handleMandateEvent(event)
        break
      case 'payments':
        await handlePaymentEvent(event)
        break
      case 'payouts':
        await handlePayoutEvent(event)
        break
    }
  }
  
  return new Response('OK', { status: 200 })
}
```

**Events à traiter :**

| Event | Action FacturNow |
|-------|------------------|
| `mandates.created` | Log création mandat |
| `mandates.submitted` | Update client: mandateStatus = PENDING |
| `mandates.active` | Update client: mandateStatus = ACTIVE, badge vert |
| `mandates.cancelled` | Update client: mandateStatus = CANCELLED, alert user |
| `payments.created` | Update facture: status = PROCESSING |
| `payments.submitted` | Update facture: note "Prélèvement soumis" |
| `payments.confirmed` | Update facture: status = PAID, paidAt = now |
| `payments.failed` | Update facture: status = PAYMENT_FAILED, envoyer email user + client |
| `payments.paid_out` | Log payout reçu (optionnel) |

### 6. Gestion Factures Récurrentes avec SEPA

**Workflow automatisé :**
```
1. User crée facture récurrente avec SEPA activé
2. Première facture envoyée → setup mandat (voir étape 3)
3. Chaque mois/trimestre (selon frequency) :
   - Cron génère nouvelle facture
   - GoCardless crée payment automatiquement
   - Client prélevé sans action
   - Facture marquée PAID après confirmation
4. Si échec prélèvement :
   - Email envoyé au user + client
   - Facture status: PAYMENT_FAILED
   - Retry automatique après X jours (configurable)
```

### 7. UI/UX Considérations SEPA

**Dashboard user :**
- Badge "SEPA activé" avec statut connexion GoCardless
- Liste clients avec mandat actif (badge vert ✓)
- Alerte si mandat expire ou échoue
- Stats : total prélevé ce mois, échecs, en attente

**Formulaire facture :**
- Radio button "Mode de paiement"
- Si SEPA sélectionné + client sans mandat → proposer setup
- Aperçu PDF avec mention "Prélèvement SEPA autorisé"

**Emails client :**
- Email 1 : "Autoriser le prélèvement" (lien setup mandat)
- Email 2 : Confirmation mandat signé
- Email 3 : Préavis prélèvement (J-3)
- Email 4 : Confirmation paiement effectué

**Dashboard Analytics :**
- Graphique taux de réussite prélèvements
- Liste échecs avec raisons
- Comparaison frais CB vs SEPA

### 8. Sécurité & Compliance SEPA

**Obligations légales :**
- ✅ Stocker mandats 14 mois minimum (GoCardless le fait)
- ✅ Préavis client 14 jours avant PREMIER prélèvement
- ✅ Préavis client 2-3 jours avant prélèvements suivants
- ✅ Client peut annuler mandat à tout moment
- ✅ Remboursement possible sous 8 semaines (règles SEPA)

**Sécurité technique :**
- Vérifier signature webhooks GoCardless (HMAC)
- Jamais exposer access_token côté client
- Rate limiting sur endpoints webhooks
- Logs détaillés de tous les events SEPA

### 9. Gestion Erreurs SEPA

**Erreurs courantes :**

| Erreur | Cause | Action |
|--------|-------|--------|
| `insufficient_funds` | Compte client vide | Retry J+3, email client |
| `mandate_cancelled` | Client a annulé | Alert user, proposer autre moyen |
| `bank_account_closed` | IBAN invalide/fermé | Email user + client, demander nouvel IBAN |
| `refer_to_payer` | Banque refuse | Contact client pour déblocage |

**Workflow retry automatique :**
```
1. Payment échoue → webhook payments.failed
2. Attendre 3 jours
3. Retry automatique (max 2 fois)
4. Si 2ème échec → facture status OVERDUE
5. Email user + client avec alternative (CB, virement)
```

### 10. Coûts & Pricing Strategy

**Frais GoCardless :**
- Standard : 1% + 0.20€ par transaction
- Volume : dégressif selon volume mensuel
- Setup gratuit, pas d'abonnement

**Stratégie FacturNow :**
- Option A : Frais transparents (user paie 1% + 0.20€)
- Option B : Commission FacturNow (ajouter 0.3-0.5%)
- Option C : Forfait mensuel incluant SEPA illimité (19€/mois)

**Affichage UI :**
```
💳 Paiements SEPA automatiques
- Frais : 1% + 0.20€ par transaction
- Exemple : Facture 100€ → Vous recevez 98.80€
- Délai encaissement : 3-5 jours
```

## Paiements & Intégrations

### **Stripe** : Paiements instantanés CB, wallets digitaux
- Paiements : CB, Apple Pay, Google Pay, Stripe Link
- Webhooks pour mise à jour automatique statut factures
- Stripe Connect pour multi-comptes (phase avancée)
- Configuration : STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- Frais : ~1.5-3% + 0.25€ par transaction

### **PayPal** : Alternative populaire freelances/PME
- Compte Business REQUIS pour API/webhooks
- Synchronisation automatique des paiements via webhooks
- Fallback manuel si compte Standard
- Configuration : PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
- Frais : ~2.5-3.5% par transaction

### **GoCardless** : Prélèvements SEPA automatiques (priorité MVP)
- **Use case principal** : Factures récurrentes B2B, abonnements
- **Avantages** :
  * Frais réduits vs CB : 1% + 0.20€ (vs 1.5-3%)
  * Prélèvement automatique SEPA
  * Idéal pour paiements mensuels récurrents
  * Pas de friction client après mandat signé
- **Configuration** : GOCARDLESS_ACCESS_TOKEN, GOCARDLESS_WEBHOOK_SECRET
- **Environnements** : Sandbox (test) et Production

## Tests & Validation GoCardless

### Tests Sandbox (obligatoire avant prod)

**URL Sandbox :** https://api-sandbox.gocardless.com

**Scénarios de test :**
1. Connexion OAuth → vérifier access_token stocké
2. Setup mandat → utiliser IBAN test fourni par GoCardless
3. Mandat activation → simuler délai 3-5 jours (immédiat en sandbox)
4. Créer payment → vérifier statut transitions
5. Webhook events → tester tous les events critiques
6. Échec payment → tester insufficient_funds

**IBANs de test GoCardless :**
- Success : GB33BUKB20201555555555
- Insufficient funds : GB60BARC20000055779911
- Account closed : GB89NWBK60161331926819

### Migration Sandbox → Production

**Checklist :**
- [ ] Access tokens régénérés (prod ≠ sandbox)
- [ ] Webhooks URL configurée (https obligatoire)
- [ ] Webhook secret stocké en env
- [ ] Emails transactionnels activés (Resend/Brevo)
- [ ] Monitoring errors (Sentry)
- [ ] Dashboard GoCardless vérifié
- [ ] Tests avec vrais IBANs (petits montants)

## Conventions de Nommage

### Fichiers
- Components: `InvoiceForm.tsx`, `ClientCard.tsx`
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- API routes: `route.ts`
- Actions: `actions.ts`
- Types: `types.ts`
- Stores: `use-invoice-store.ts`

### Variables
- camelCase : `invoiceTotal`, `clientList`
- Constantes : `UPPER_SNAKE_CASE` : `MAX_ITEMS_PER_PAGE`
- Types/Interfaces : `PascalCase` : `InvoiceFormData`
- Enums Prisma : `UPPER_SNAKE_CASE` : `DocumentType.INVOICE`

### Fonctions
- Handlers : `handleSubmit`, `handleDelete`
- Getters : `getInvoices`, `getClientById`
- Actions : `createInvoice`, `updateClient`, `deleteProduct`
- Utils : `formatCurrency`, `calculateTax`, `generateInvoiceNumber`

## Librairies & Outils

### UI/UX
- Shadcn/ui pour composants base (Button, Dialog, Form, etc.)
- Lucide React pour icônes
- Sonner pour toasts
- Recharts pour graphiques dashboard

### Formulaires
- React Hook Form + Zod resolver
- Validation temps réel
- Error messages clairs

### Dates
- date-fns pour toutes manipulations
- Format ISO stocké en DB
- Format localisé côté client

### PDF
- @react-pdf/renderer (préféré - React components)
- OU jsPDF (si besoin de plus de contrôle bas niveau)

### Emails
- Resend (recommandé - DX excellente)
- OU Brevo (Sendinblue)
- Templates avec React Email

## Points d'Attention Spécifiques

### Calculs Financiers
- TOUJOURS utiliser Decimal ou stocker en centimes (integer)
- Arrondir à 2 décimales pour affichage
- Vérifier calculs server-side avant save
- Formatter avec formatCurrency() helper

### Numérotation Documents
- Incrémenter atomiquement (transaction Prisma)
- Format : `{prefix}-{year}-{number}` ex: `INV-2025-0001`
- Séquence par type de document
- Pas de gaps acceptables

### Sécurité
- Valider TOUJOURS côté serveur
- Vérifier ownership (user peut accéder à ses données uniquement)
- Sanitizer inputs utilisateur
- Rate limiting sur API routes sensibles

### Performance
- Pagination pour listes (20 items/page)
- Infinite scroll sur mobile
- Virtual scrolling si >100 items
- Index DB sur userId, clientId, status, date

## Exemples de Code

### Query avec TanStack Query
```typescript
'use client'

export function InvoiceList() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { status: 'PAID' }],
    queryFn: () => getInvoices({ status: 'PAID' }),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  if (isLoading) return <Skeleton />
  
  return <div>{data?.map(invoice => <InvoiceCard key={invoice.id} {...invoice} />)}</div>
}
```

### Server Action avec validation
```typescript
'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  // ...
})

export async function createClient(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  try {
    const data = schema.parse(Object.fromEntries(formData))
    
    const client = await prisma.client.create({
      data: {
        ...data,
        userId: session.user.id,
      }
    })
    
    revalidatePath('/dashboard/clients')
    return { success: true, data: client }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Validation failed', details: error.errors }
    }
    return { error: 'Failed to create client' }
  }
}
```

## Rappels Importants
- Penser mobile-first (responsive design)
- Accessibilité (ARIA labels, keyboard navigation)
- SEO (metadata, Open Graph)
- Analytics (Plausible ou Vercel Analytics)
- Monitoring erreurs (Sentry optionnel)