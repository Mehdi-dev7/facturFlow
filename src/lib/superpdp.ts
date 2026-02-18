/**
 * Client API SuperPDP — Facture électronique
 *
 * SuperPDP est une Plateforme Agréée (PA/PDP) certifiée Peppol + ISO27001.
 * Auth : OAuth 2.0 Client Credentials
 * Doc : https://www.superpdp.tech/documentation
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Objet facture au format EN16931 (modèle sémantique européen) */
export interface EN16931Invoice {
  type_code: number
  number: string
  issue_date: string
  payment_due_date?: string
  currency_code: string
  process_control: {
    business_process_type: string
    specification_identifier: string
  }
  seller: EN16931Party
  buyer: EN16931Party
  lines: EN16931Line[]
  totals: EN16931Totals
  vat_break_down: EN16931VatBreakdown[]
  notes?: { note: string; subject_code?: string }[]
  payment_instructions?: {
    credit_transfers?: {
      payment_account_identifier?: { scheme: string; value: string }
      payment_account_name?: string
      payment_service_provider_identifier?: string
    }[]
    payment_means_type_code?: string
    payment_means_text?: string
    remittance_information?: string
  }
}

interface EN16931Party {
  name: string
  postal_address: {
    address_line1?: string
    city?: string
    post_code?: string
    country_code: string
  }
  electronic_address?: { scheme: string; value: string }
  legal_registration_identifier?: { scheme: string; value: string }
  tax_registration_identifier?: string
  vat_identifier?: string
  contact?: {
    email_address?: string
    phone_number?: string
  }
}

interface EN16931Line {
  identifier: string
  invoiced_quantity: string
  invoiced_quantity_code: string
  net_amount: string
  item_information: { name: string; description?: string }
  vat_information: {
    invoiced_item_vat_category_code: string
    invoiced_item_vat_rate?: string
  }
  price_details: { item_net_price: string }
}

interface EN16931Totals {
  sum_invoice_lines_amount: string
  total_without_vat: string
  total_vat_amount: { currency_code: string; value: string }
  total_with_vat: string
  amount_due_for_payment: string
  paid_amount?: string
}

interface EN16931VatBreakdown {
  vat_category_code: string
  vat_category_rate?: string
  vat_category_taxable_amount: string
  vat_category_tax_amount: string
  vat_exemption_reason_code?: string
  vat_exemption_reason?: string
}

/** Réponse de l'API lors de la création d'une facture */
export interface SuperPDPInvoiceResponse {
  id: number
  company_id: number
  created_at: string
  direction: "in" | "out"
  events: SuperPDPEvent[]
}

/** Event de cycle de vie d'une facture */
export interface SuperPDPEvent {
  id: number
  invoice_id: number
  status_code: string
  status_text: string
  created_at: string
  data: Record<string, unknown>
}

export interface SuperPDPEventsResponse {
  data: SuperPDPEvent[]
  has_after: boolean
}

// ─── Cache token OAuth ────────────────────────────────────────────────────────

// Stocké en mémoire (valable pour la durée de vie du processus Node/Serverless)
// Le token SuperPDP expire après 1h — on le renouvelle 5 min avant
let tokenCache: { value: string; expiresAt: number } | null = null

/**
 * Obtient un access_token OAuth 2.0 via Client Credentials.
 * Utilise le cache si le token est encore valide.
 */
async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value
  }

  const clientId = process.env.SUPERPDP_CLIENT_ID
  const clientSecret = process.env.SUPERPDP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Variables SUPERPDP_CLIENT_ID / SUPERPDP_CLIENT_SECRET manquantes")
  }

  const res = await fetch("https://api.superpdp.tech/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SuperPDP auth échoué (${res.status}): ${err}`)
  }

  const data = await res.json()
  // expires_in est en secondes — on enlève 5 min de marge
  const expiresIn = (data.expires_in ?? 3600) - 300
  tokenCache = { value: data.access_token, expiresAt: Date.now() + expiresIn * 1000 }

  return tokenCache.value
}

/** Helper pour les appels API authentifiés */
async function superpdpFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken()
  const res = await fetch(`https://api.superpdp.tech${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  return res
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

/**
 * Convertit un objet EN16931 JSON en XML CII (format officiel français).
 * SuperPDP génère le XML conforme — on n'a pas à le faire nous-mêmes.
 */
export async function convertInvoiceToXml(invoice: EN16931Invoice): Promise<string> {
  const res = await superpdpFetch(
    "/v1.beta/invoices/convert?from=en16931&to=cii",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SuperPDP convert échoué (${res.status}): ${err}`)
  }

  // Retourne le XML CII en string
  return res.text()
}

/**
 * Envoie une facture XML via le réseau Peppol.
 * Retourne l'ID SuperPDP de la facture pour suivi ultérieur.
 */
export async function sendInvoiceXml(xml: string): Promise<SuperPDPInvoiceResponse> {
  const res = await superpdpFetch("/v1.beta/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SuperPDP envoi échoué (${res.status}): ${err}`)
  }

  return res.json()
}

/**
 * Envoie directement un objet EN16931 JSON à SuperPDP (sans conversion intermédiaire).
 * SuperPDP accepte le JSON EN16931 en natif sur POST /v1.beta/invoices.
 * C'est la méthode recommandée — pas besoin de passer par /convert.
 */
export async function sendInvoiceJson(invoice: EN16931Invoice): Promise<SuperPDPInvoiceResponse> {
  const res = await superpdpFetch("/v1.beta/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SuperPDP envoi échoué (${res.status}): ${err}`)
  }

  return res.json()
}

/**
 * Récupère les nouveaux events depuis un ID donné (polling).
 * Utilisé par le cron de synchronisation des statuts.
 */
export async function getInvoiceEvents(startingAfterId: number): Promise<SuperPDPEventsResponse> {
  const params = startingAfterId > 0 ? `?starting_after_id=${startingAfterId}` : ""
  const res = await superpdpFetch(`/v1.beta/invoice_events${params}`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SuperPDP events échoué (${res.status}): ${err}`)
  }

  return res.json()
}

/**
 * Valide une facture XML avant envoi.
 * Retourne un rapport avec les erreurs éventuelles.
 */
export async function validateInvoice(xml: string, fileName = "invoice.xml") {
  const formData = new FormData()
  formData.append("file_name", new Blob([xml], { type: "application/xml" }), fileName)

  const res = await superpdpFetch("/v1.beta/validation_reports", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SuperPDP validation échouée (${res.status}): ${err}`)
  }

  return res.json()
}

// ─── Labels des statuts pour l'UI ────────────────────────────────────────────

export const EINVOICE_STATUS_LABELS: Record<string, string> = {
  "api:uploaded":  "Transmise à SuperPDP",
  "fr:204":        "Mise à disposition",
  "fr:205":        "Prise en charge",
  "fr:206":        "Reçue par le destinataire",
  "fr:207":        "Refusée par le destinataire",
  "fr:208":        "Acceptée par le destinataire",
  "fr:209":        "Litige ouvert",
  "fr:210":        "Litige résolu",
  "fr:211":        "Annulée",
  "fr:212":        "Paiement reçu",
}

export function getEInvoiceStatusLabel(code: string): string {
  return EINVOICE_STATUS_LABELS[code] ?? code
}
