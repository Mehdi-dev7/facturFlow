# FacturNow - Context for Claude Code

## Project Overview
SaaS de facturation intelligent avec prélèvement SEPA automatique pour freelances, auto-entrepreneurs et PME françaises. Killer feature : GoCardless pour factures récurrentes sans impayés.

## Tech Stack
- **Framework**: Next.js 16 + TypeScript (strict mode) + App Router
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Auth**: Better Auth (Google, GitHub, Microsoft OAuth + Email OTP)
- **UI**: Tailwind CSS + Shadcn/ui + Lucide React icons
- **State Management**: 
  - Zustand pour état global (user settings, UI state, draft invoices)
  - TanStack Query pour server state (data fetching, cache, mutations)
- **Forms**: React Hook Form + Zod resolver
- **Validation**: Zod (client + server)
- **Dates**: date-fns
- **PDF**: @react-pdf/renderer (préféré) ou jsPDF
- **Payments**: 
  - Stripe (CB, Apple Pay, Google Pay)
  - PayPal
  - GoCardless (SEPA Direct Debit)
- **Emails**: Resend ou Brevo
- **Toast notifications**: Sonner

## Architecture Principles

### Component Strategy
1. **Server Components by default** - Client Components only when:
   - Using React hooks (useState, useEffect, useCallback, useMemo)
   - Event handlers (onClick, onChange, onSubmit)
   - TanStack Query hooks
   - Browser APIs
2. **Server Actions** for all mutations (create, update, delete)
3. **File naming**: kebab-case (`invoice-form.tsx`, `client-list.tsx`)
4. **Component naming**: PascalCase (`InvoiceForm`, `ClientList`)

### Data Fetching & State
- **TanStack Query** for client-side data fetching
  - Query keys format: `['entity', { filters }]` (e.g., `['invoices', { status: 'PAID' }]`)
  - Always invalidate cache after mutations
  - Configure `staleTime` and `cacheTime` appropriately
- **Zustand** for global state
  - One store per domain: `useUserStore`, `useInvoiceStore`, `useUIStore`
  - Use selectors to avoid re-renders
  - Persist important data with `persist` middleware

### Code Quality
- **TypeScript**: NEVER use `any` - use `unknown` if needed
- **Performance**: 
  - ALWAYS use `useCallback` for functions passed as props
  - ALWAYS use `useMemo` for expensive computations or filtered lists
  - Lazy load heavy components with `dynamic()`
  - Debounce search inputs (300ms minimum)
- **Error Handling**: 
  - Always use try/catch in Server Actions
  - Return structured responses: `{ success: boolean, data?, error? }`
  - Display user-friendly error messages with toasts
- **Validation**: 
  - ALWAYS validate with Zod on server-side
  - Optionally validate on client for UX

## Coding Standards

### Server Actions Pattern
```typescript
'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export async function createClient(formData: FormData) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

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
      return { success: false, error: 'Validation failed', details: error.errors }
    }
    return { success: false, error: 'Failed to create client' }
  }
}
```

### TanStack Query Pattern
```typescript
'use client'

// Query
const { data: invoices, isLoading } = useQuery({
  queryKey: ['invoices', { status: 'PAID' }],
  queryFn: () => getInvoices({ status: 'PAID' }),
  staleTime: 5 * 60 * 1000, // 5 min
})

// Mutation
const mutation = useMutation({
  mutationFn: createInvoice,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    toast.success('Facture créée !')
  },
  onError: (error) => {
    toast.error('Erreur lors de la création')
  }
})
```

### Zustand Store Pattern
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface InvoiceStore {
  draftInvoice: Invoice | null
  setDraftInvoice: (invoice: Invoice | null) => void
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set) => ({
      draftInvoice: null,
      setDraftInvoice: (invoice) => set({ draftInvoice: invoice }),
    }),
    { name: 'invoice-storage' }
  )
)

// Usage with selector to avoid re-renders
const draftInvoice = useInvoiceStore((state) => state.draftInvoice)
```

## Project Structure
```
facturnow/
├── app/
│   ├── (auth)/                 # Public routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/            # Protected routes
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Dashboard home
│   │   ├── clients/
│   │   ├── products/
│   │   ├── invoices/
│   │   ├── quotes/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/[...all]/      # Better Auth routes
│   │   └── webhooks/           # Stripe, PayPal, GoCardless webhooks
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Shadcn components
│   ├── forms/                  # Reusable forms
│   │   ├── invoice-form.tsx
│   │   ├── client-form.tsx
│   │   └── product-form.tsx
│   └── layouts/
│       └── dashboard-layout.tsx
├── lib/
│   ├── auth.ts                 # Better Auth config
│   ├── auth-client.ts          # Better Auth client for React
│   ├── prisma.ts               # Prisma singleton
│   ├── validations/            # Zod schemas
│   │   ├── client.ts
│   │   ├── invoice.ts
│   │   └── product.ts
│   └── utils.ts                # Utility functions
├── hooks/                      # Custom hooks
│   ├── use-clients.ts
│   ├── use-invoices.ts
│   └── use-products.ts
├── stores/                     # Zustand stores
│   ├── use-user-store.ts
│   ├── use-invoice-store.ts
│   └── use-ui-store.ts
├── types/                      # TypeScript types
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── .claude.md                  # This file
├── .github/
│   └── copilot-instructions.md # Full detailed docs
└── README.md
```

## Database Schema (Prisma)

### Key Models

**User**
- Company info (name, SIRET, SIREN, VAT, address, logo)
- Business type (WEB_DEV, DESIGN, CONSULTING, etc.)
- Invoice settings (prefixes, next numbers)
- Payment providers (GoCardless tokens, Stripe ID)
- Relations: clients[], products[], documents[]

**Client**
- Type: COMPANY (B2B with SIRET) or INDIVIDUAL (B2C)
- Contact info (email, phone, address)
- SEPA mandate info (GoCardless mandate ID, status)
- Stats: totalInvoiced, totalPaid
- Relations: documents[]

**Product**
- Name, description, type (SERVICE/PRODUCT)
- Pricing: unitPrice, unit, vatRate
- Optional stock tracking
- Relations: lineItems[]

**Document**
- Type: INVOICE, QUOTE, CREDIT_NOTE, PURCHASE_ORDER, DELIVERY_NOTE, RECEIPT, PROFORMA, CONTRACT
- Client reference
- Dates: date, dueDate, validUntil
- Status: DRAFT, SENT, VIEWED, ACCEPTED, PAID, OVERDUE, etc.
- Amounts: subtotal, taxTotal, total, discount, paidAmount
- Payment: paymentMethod, paidAt
- Relations: lineItems[], payments[], reminders[]

**DocumentLineItem**
- Product reference (optional)
- Description, quantity, unitPrice, vatRate
- Calculated totals: subtotal, taxAmount, total
- Order for sorting
- CASCADE delete with document

**RecurringInvoice**
- Client reference
- Frequency: WEEKLY, MONTHLY, QUARTERLY, YEARLY
- Schedule: startDate, endDate, nextDate
- Template data (JSON)
- Status: active/inactive

**Payment**
- Document reference
- Provider: GOCARDLESS, STRIPE, PAYPAL, BANK_TRANSFER
- GoCardless specific: paymentId, status
- Amount, currency, timestamps

## Key Features

### 1. Multi-Document Types
- Factures (invoices)
- Devis (quotes)
- Avoirs (credit notes)
- Bons de commande (purchase orders)
- Bons de livraison (delivery notes)
- Reçus (receipts)
- Factures proforma
- Contrats (contracts) - post-MVP

### 2. SEPA Direct Debit (GoCardless) - KILLER FEATURE

**Setup Flow:**
```
1. User → Settings → Connect GoCardless (OAuth)
2. Create/connect GoCardless account
3. Authorize FacturNow
4. Store access_token in DB
5. Badge "SEPA activé" in dashboard
```

**Invoice with SEPA Flow:**
```
1. Create invoice → Select "SEPA" payment method
2. Send to client
3. Client clicks link → GoCardless mandate page
4. Client enters IBAN + signs mandate
5. Mandate pending (3-5 days bank activation)
6. Webhook: mandate.active → Client ready
7. On due date: automatic payment created
8. Webhook: payment.confirmed → Invoice marked PAID
```

**Recurring + SEPA Flow:**
```
1. Create recurring invoice + SEPA
2. First invoice → mandate setup (once)
3. Monthly: auto-generate invoice + auto-payment
4. Zero manual intervention
```

### 3. Payments Integration

**Stripe** (CB, Apple Pay, Google Pay):
- Connect Stripe via OAuth
- Generate payment links in invoices
- Webhooks: payment.succeeded → Invoice PAID
- Fees: ~1.5% + 0.25€

**PayPal**:
- Connect PayPal Business account
- Generate PayPal payment buttons
- Webhooks: PAYMENT.CAPTURE.COMPLETED → Invoice PAID
- Fees: ~2.5-3.5%

**GoCardless** (SEPA):
- OAuth connection
- Mandate management
- Automatic payments
- Fees: 1% + 0.20€

### 4. Templates Métiers
9 templates adaptés par métier:
- Web Developer
- Designer / Graphiste
- Consultant
- Artisan / BTP
- Photographe
- Rédacteur
- Coach / Formateur
- E-commerce
- Services génériques

### 5. Recurring Invoices
- Weekly, monthly, quarterly, yearly
- Auto-generation on schedule
- Auto-payment with SEPA
- Email notifications

### 6. Automatic Reminders
3 levels:
- FRIENDLY (soft reminder)
- FIRM (stronger tone)
- FORMAL (official notice)

Scheduled based on due date.

### 7. Annual Reports & Admin Docs
- CA total, TVA collectée
- Charges déductibles
- Export pour URSSAF
- Export comptable (FEC, CSV)
- Attestations diverses

### 8. E-invoicing via SuperPDP (intégration validée, sandbox prêt)
- Obligatoire sept 2026 pour entreprises, sept 2027 pour freelances
- Partenaire retenu : **SuperPDP** (plateforme agréée PA/PDP, ISO 27001, Peppol)
- Docs API : https://www.superpdp.tech/documentation | OpenAPI disponible

#### API technique
- **Base URL** : `https://api.superpdp.tech/v1.beta/`
- **Auth** : OAuth 2.0 Client Credentials
  - Token : `POST https://api.superpdp.tech/oauth2/token`
  - `grant_type=client_credentials` + `client_id` + `client_secret`
  - Puis `Authorization: Bearer {access_token}` sur chaque requête
- **Env variables** : `SUPERPDP_CLIENT_ID`, `SUPERPDP_CLIENT_SECRET`
  - La clé détermine auto si on est en sandbox ou production (pas de flag séparé)

#### Endpoints utilisés
| Route | Usage |
|-------|-------|
| `POST /v1.beta/invoices/convert?from=en16931&to=cii` | Convertit notre JSON → XML CII |
| `POST /v1.beta/invoices` (body: XML) | Envoie la facture via Peppol |
| `GET /v1.beta/invoice_events?starting_after_id=X` | Polling des statuts |
| `POST /v1.beta/validation_reports` | Valide une facture avant envoi |
| `GET /v1.beta/invoices/generate_test_invoice?format=en16931` | Facture test sandbox |

#### Contraintes API critiques (validées sur OpenAPI)

1. **`POST /v1.beta/invoices` n'accepte PAS JSON** — uniquement `application/xml` ou `multipart/form-data`.
   Ne jamais envoyer `Content-Type: application/json` à cet endpoint → 400 "unknown format".

2. **`seller.electronic_address` est REQUIRED** dans le schéma seller `['name', 'electronic_address', 'postal_address']`.
   Le vendeur DOIT avoir un SIREN pour pouvoir envoyer. Vérifier avant de construire l'EN16931.

3. **`addressed_to` est PIÈGE** — utilise le schéma `extension_contact` avec 8 champs required.
   Ne pas l'inclure dans l'EN16931 : le routage Peppol se fait via `buyer.electronic_address`.

4. **`buyer.electronic_address` n'est PAS required** — buyer ne requiert que `['name', 'postal_address']`.
   Ajouter l'electronic_address du buyer conditionnellement si SIREN client présent.

5. **Format `total_vat_amount`** : c'est `{ value: string (required), currency_code?: string }` (schéma `amount`).

#### Flux d'envoi dans notre code
```
1. sendEInvoice(invoiceId) — Server Action
   a. Récupère la facture + lignes + client + user en DB
   b. Vérifie client.companySiren (routage Peppol client)
   c. Vérifie user.companySiren (adresse Peppol vendeur, REQUIRED)
   d. Construit l'objet EN16931 JSON (seller avec electronic_address, buyer, lines, totals, vat_break_down)
   e. POST /convert?from=en16931&to=cii (Content-Type: application/json) → reçoit XML CII
   f. POST /invoices (Content-Type: application/xml, body: XML) → reçoit { id: superpdpId }
   g. Stocke superpdpId dans Document.einvoiceRef + status initial

2. Cron Vercel (toutes les heures ou matin) — syncEInvoiceStatuses()
   a. GET /invoice_events?starting_after_id={dernierIdConnu}
   b. Met à jour Document.einvoiceStatus selon status_code reçu
   c. Stocke le max id pour la prochaine sync
```

**Pas de webhooks pour l'instant** → polling obligatoire

#### Statuts importants (status_code)
- `api:uploaded` : reçu par SuperPDP, en attente de traitement
- `fr:204` à `fr:211` : statuts cycle de vie DGFiP (envoyé, reçu, accepté, refusé…)
- `fr:212` : paiement partiel reçu

#### Champs Prisma à ajouter sur Document
```prisma
einvoiceRef    String?   // ID SuperPDP de la facture
einvoiceStatus String?   // Dernier status_code reçu
einvoiceSentAt DateTime? // Date d'envoi électronique
```
+ table `EInvoiceSyncState` (id, lastEventId) pour le polling

#### Plans tarifaires
- **Business (29€/mois)** : inclus sans limite (coût absorbé par FacturNow)
- **Pro (14€/mois)** : 100 factures électroniques gratuites/mois, ensuite à décider

## Pricing (Validé 02/03/2026)

### Free
- Trial 7 jours Pro (anti-cheat IP, 30j)
- 10 documents/mois, 5 clients
- Virement bancaire uniquement (IBAN affiché)
- 5 e-invoices SuperPDP/mois
- PDF basique

### Pro - 9,99€/mois (ou annuel -20%)
- Documents & clients illimités
- Stripe CB/Apple Pay/Google Pay
- PayPal
- SEPA GoCardless 🔥
- Relances automatiques (3 niveaux)
- Factures récurrentes
- Export CSV
- E-invoicing SuperPDP inclus (limité)

### Business - 25€/mois (ou annuel -20%)
- Tout Pro +
- Multi-users (3 comptes)
- Export comptable FEC + URSSAF
- E-invoicing illimité (SuperPDP absorbé) 🏛️
- API & Webhooks
- Support prioritaire

## Important Workflows

### Creating an Invoice
```
1. Dashboard → New Invoice
2. Select client (or create quick)
3. Add line items:
   - Select existing product (auto-fill price/VAT) OR
   - Custom line (manual description/price)
4. Auto-calculations:
   - Subtotal = sum(quantity × unitPrice)
   - VAT = sum(subtotal × vatRate)
   - Total = subtotal + VAT
5. Choose payment method:
   - Bank transfer
   - Credit card (Stripe)
   - PayPal
   - SEPA Direct Debit
6. PDF preview
7. Save as draft OR Send
8. Auto-generate invoice number (prefix + year + counter)
9. Email to client (optional)
```

### PDF Generation
```
1. Select template (default or custom)
2. Inject invoice + user + client data
3. Verify calculations server-side
4. Generate PDF with @react-pdf/renderer
5. Upload to Supabase Storage OR generate on-the-fly
6. Store URL in document.pdfUrl
```

### Financial Calculations
- ALWAYS use Decimal or store as cents (integer)
- Round to 2 decimals for display
- Verify calculations server-side before save
- Use formatCurrency() helper for display

### Document Numbering
- Atomic increment (Prisma transaction)
- Format: `{prefix}-{year}-{number}` (e.g., `INV-2025-0001`)
- Separate sequence per document type
- No gaps allowed

## Security Rules

### Data Protection
- Validate ALWAYS server-side (Zod)
- Verify ownership (user can only access their data)
- Sanitize user inputs
- Rate limiting on sensitive API routes
- Never store passwords in plain text
- Never expose API keys client-side

### Financial Data
- Never log sensitive data (IBANs, card numbers)
- Use HTTPS only
- PCI-DSS compliance via Stripe/PayPal
- SEPA mandates stored by GoCardless only
- Encrypt sensitive fields in DB

### Access Control
- Middleware protects /dashboard/* routes
- Server Actions check session
- API routes verify authentication
- Multi-user: role-based permissions (Business plan)

## Performance Optimization

- Pagination: 20 items/page
- Infinite scroll on mobile
- Virtual scrolling if >100 items
- DB indexes on: userId, clientId, status, date
- Lazy load PDF viewer with dynamic()
- Debounce search inputs (300ms)
- Optimize images (Next.js Image component)

## Never Do

❌ Never use `any` type
❌ Never skip server-side validation
❌ Never store sensitive data in localStorage
❌ Never reproduce copyrighted content
❌ Never use browser storage APIs
❌ Never expose API keys
❌ Never trust client-side data
❌ Never skip error handling
❌ Never use `bg-gradient-to-r/b` — toujours `bg-linear-to-r/b` (Tailwind v4)
❌ Never write Unicode escaped chars (`\u20AC`, etc.) — écrire les vrais caractères
❌ Never use `googleFont` in FONT_OPTIONS — polices locales uniquement (public/fonts/)

## Always Do

✅ Use Shadcn/ui components
✅ Validate with Zod on server
✅ Use Server Actions for mutations
✅ Use TanStack Query for fetching
✅ Add proper TypeScript types
✅ Handle errors with try/catch
✅ Use ARIA labels for accessibility
✅ SelectItem avec contenu long → layout 3 colonnes flex (shrink-0 | flex-1 truncate | shrink-0 ml-auto)
✅ SelectContent dark mode → `dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438]`
✅ Test payment flows in sandbox first
✅ Use loading.tsx and error.tsx for routes
✅ Revalidate paths after mutations

## Testing Strategy

### Payment Providers Sandbox

**Stripe Test Cards:**
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- 3D Secure: 4000 0027 6000 3184

**GoCardless Test IBANs:**
- Success: GB33BUKB20201555555555
- Insufficient funds: GB60BARC20000055779911
- Account closed: GB89NWBK60161331926819

**Webhooks Testing:**
- Use ngrok for local webhook testing
- Stripe CLI for event simulation
- GoCardless sandbox environment

## Common Patterns

### Loading States
```typescript
if (isLoading) return <Skeleton />
if (error) return <ErrorMessage error={error} />
if (!data) return null
```

### Form Handling
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialData
})

async function onSubmit(data) {
  const result = await createInvoice(data)
  if (result.success) {
    toast.success('Facture créée !')
    router.push('/dashboard/invoices')
  } else {
    toast.error(result.error)
  }
}
```

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateInvoice,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['invoices', id] })
    const previous = queryClient.getQueryData(['invoices', id])
    queryClient.setQueryData(['invoices', id], newData)
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['invoices', id], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices', id] })
  }
})
```

## Reference

Full detailed documentation in `.github/copilot-instructions.md`

For GoCardless API: https://developer.gocardless.com
For Stripe API: https://stripe.com/docs/api
For Better Auth: https://www.better-auth.com/docs
For Prisma: https://www.prisma.io/docs
For Shadcn/ui: https://ui.shadcn.com
For TanStack Query: https://tanstack.com/query/latest


## Mode Team / Agents

Quand une tâche est complexe ou peut être parallélisée, utilise les agents (teams) :
- **Agent Frontend** : composants React, UI, Tailwind, animations
- **Agent Backend** : API routes, Prisma, logique métier, intégration Stripe/SEPA
- **Agent SEO** : métadonnées, sitemap, performance, accessibilité

Quand tu utilises les agents :
- Tu ne codes PAS toi-même
- Tu agis comme **Tech Lead** : tu découpes les tâches, tu distribues, tu review
- Tu fournis un brief clair à chaque agent avec le contexte nécessaire
- Tu vérifies la cohérence entre les livrables des agents

Utilise les agents quand :
- Plusieurs fichiers/domaines sont impactés en parallèle
- Une feature touche à la fois le front, le back et le SEO
- Le gain de temps est significatif par rapport au mode solo
## État du Projet & Reste à faire

### Fonctionnalités implémentées ✅
- [x] Auth (login, signup, OAuth Google/GitHub) — Microsoft OAuth à activer
- [x] Dashboard layout + sidebar avec notification dots (rouges, animate-ping)
- [x] Factures — CRUD complet, PDF, email Resend, statuts, cron OVERDUE, row highlight 3.5s
- [x] Devis — CRUD complet, email Resend (boutons Accepter/Refuser tokens), statuts, cron CANCELLED
- [x] Acomptes — CRUD complet, email Resend, automation depuis devis accepté, DB branché
- [x] Clients — CRUD complet, modale Dialog, SIRET lookup
- [x] E-invoicing SuperPDP — API intégrée (sendEInvoice + cron sync + badge UI)
- [x] Reçus — PDF instantané + liste manuels
- [x] Apparence — themeColor, companyFont, companyLogo, previews temps réel
- [x] Paiements Stripe — clé API user, Checkout, webhook PAID, email bouton ✅ testé en live
- [x] Paiements PayPal — create order, capture, webhook, email bouton ✅ testé en live
- [x] Paiements GoCardless — mandats SEPA, webhook PAID, email bouton ⚡ à tester sandbox
- [x] Relances auto — 3 niveaux (FRIENDLY/FIRM/FORMAL), cron nightly J+2/J+7/J+15
- [x] Système abonnements — Free/Pro 9,99€/Business 25€, trial 7j anti-cheat IP, feature-gate, guards, UpgradeBanner/FeatureGate, webhook Stripe subscription, page /dashboard/subscription
- [x] IBAN/BIC — Mon Entreprise + PDF facture + email Resend
- [x] Notification dots sidebar — rouge animate-ping, disparition au clic, row highlight 3.5s
- [x] Pages légales (mentions, RGPD, CGU/CGV) + Formulaire contact/support

### Bugs connus
- [ ] **Bug SuperPDP** : envoi e-invoicing échoue dans certains cas — investiguer logs, vérifier seller.electronic_address et flux convert → send

### Pricing (validé 02/03/2026)

**FREE** : 10 docs/mois, 5 clients, virement bancaire uniquement, 5 e-invoices SuperPDP
**PRO — 9,99€/mois** (ou annuel -20%) : illimité, Stripe/PayPal/GoCardless, relances auto, templates, SEPA
**BUSINESS — 25€/mois** : tout Pro + multi-users (3), export CSV comptable, e-invoicing illimité, API/webhooks

### Reste à faire — App (11/03/2026)

- [x] **Responsive xs** : revoir toute l'app ✅
- [x] **Boutons paiement dans form facture** : afficher par provider connecté ✅
- [x] **OAuth Microsoft** : activé ✅
- [x] **Export CSV** (Pro) : factures, CA, TVA — page /dashboard/stats ✅
- [x] **Export comptable** (Business) : FEC, URSSAF, rapport annuel, journal mensuel, email comptable ✅
- [x] **Statistiques** : page /dashboard/stats — CA, TVA, graphiques mensuels ✅
- [x] **Factures récurrentes** : page /dashboard/recurring + cron ✅
- [x] **Mon Compte** : page profil (email, téléphone, avatar) ✅
- [x] **Tutoriels intégrés** : optimisés (images WebP, steps fusionnés) ✅
- [x] **API & Webhooks** (Business) : clés API `fnk_xxx`, routes `/api/v1/`, dispatcher HMAC, page `/dashboard/api`, logs livraisons ✅ (11/03/2026)
- [ ] **Style email paiement** : responsive mobile des emails avec boutons Stripe/PayPal/SEPA
- [ ] **Documents complémentaires** : avoirs, bons de commande, bons de livraison, proforma
- [ ] **PWA mobile** : manifest + service worker, encadré sidebar "Installer l'app" + prompt après X jours d'utilisation (Pro/Business uniquement)

### Reste à faire — Qualité & Lancement

- [ ] **SEO audit** : métadonnées, sitemap, og:image, structured data
- [ ] **Security audit** : CSP headers, rate limiting, XSS, CSRF
- [ ] **Tests unitaires** : agent spécial — calculs, feature-gate, webhooks critiques
- [ ] **Test complet live .fr** : parcours complet en production
- [ ] **Google Search Console** : soumettre sitemap
- [ ] **Google Ads** : campagne de lancement
- [ ] **Lancement officiel** 🚀

---

## FEATURE : Intégration Paiements Multi-Providers (Stripe / PayPal / GoCardless)

### Contexte
L'argent ne transite JAMAIS par FacturNow — les paiements vont directement sur les comptes
des users. Notre rôle : créer les liens de paiement à la volée et écouter les webhooks
pour mettre à jour les statuts de factures automatiquement.

### Architecture cible

**1. Table Supabase `payment_accounts`**
Stocker par user et par provider : provider (stripe|paypal|gocardless), credentials chiffrées
(api_key ou access_token), statut (connected|disconnected), date de connexion.
Les credentials doivent être chiffrées en base (vault Supabase ou chiffrement AES côté serveur
avant insertion).

**2. Page `/dashboard/payments`**
- Cards par provider (Stripe / PayPal / GoCardless) avec statut connecté/déconnecté
- Formulaire de saisie de clé API (v1 manuelle, pas OAuth)
- Bouton déconnecter
- Tuto steps intégré par provider (comment créer son compte et récupérer sa clé)

**3. Route API `POST /api/payments/create-link`**
Reçoit : `invoice_id`, `provider`
- Récupère la facture (montant, devise, référence, email client)
- Récupère les credentials du user pour le provider
- Appelle l'API du provider pour créer une session/order/payment request
- Retourne l'URL de paiement
- **Stripe** : Checkout Session (line_items avec montant exact, currency, description = n° facture, customer_email, success_url, cancel_url)
- **PayPal** : access_token → créer un Order avec le montant
- **GoCardless** : créer un Payment Request SEPA

**4. Webhooks**
- `POST /api/webhooks/stripe` → vérifier signature → `checkout.session.completed` → invoice status = `PAID`
- `POST /api/webhooks/paypal` → vérifier authenticité → `PAYMENT.CAPTURE.COMPLETED` → invoice status = `PAID`
- `POST /api/webhooks/gocardless` → `payment.paid` → invoice status = `PAID`

**5. Intégration dans la facture**
Boutons "Payer par carte" / "Payer via PayPal" / "Prélèvement SEPA" sur la vue facture
(PDF + page web), visibles uniquement pour les providers connectés par le user.
Appellent `/api/payments/create-link` puis redirigent le client.

### Règles importantes
- Ne jamais logger les credentials en clair
- Valider la signature des webhooks OBLIGATOIREMENT avant tout traitement
- Montants toujours en centimes pour Stripe, en string décimal pour PayPal
- Gérer les erreurs API proprement (provider indisponible, clé invalide, etc.)
- RLS Supabase sur `payment_accounts` (user voit uniquement ses propres comptes)

### Librairies autorisées
`stripe` (npm), `@paypal/paypal-js` ou fetch natif, `gocardless-nodejs-client`

### Ordre d'implémentation
1. Migration Supabase (table `payment_accounts` + RLS)
2. Page Dashboard Paiements (UI connexion/déconnexion)
3. Route API `create-link` pour Stripe en premier
4. Webhook Stripe + test avec Stripe CLI
5. PayPal puis GoCardless (même pattern)
6. Intégration boutons dans la vue facture
