// src/lib/gocardless.ts
// Client GoCardless natif (fetch), identique au pattern PayPal.
// GoCardless Billing Requests API : flow complet mandat SEPA.
//
// Flow :
//  1. createBillingRequest()  → billing_request_id
//  2. createBillingRequestFlow() → authorisation_url (à envoyer au client)
//  3. Webhook mandates.active → stocker mandate_id sur le Client
//  4. createSepaPayment()  → payment en cours
//  5. Webhook payments.confirmed → facture PAID

// ─── Config ───────────────────────────────────────────────────────────────────

function gcBase(isSandbox: boolean) {
  return isSandbox
    ? "https://api-sandbox.gocardless.com"
    : "https://api.gocardless.com";
}

const GC_VERSION = "2015-07-06";

function gcHeaders(accessToken: string) {
  return {
    "Authorization": `Bearer ${accessToken}`,
    "GoCardless-Version": GC_VERSION,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function gcPost<T>(
  accessToken: string,
  isSandbox: boolean,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${gcBase(isSandbox)}${path}`, {
    method: "POST",
    headers: gcHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GoCardless ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function gcGet<T>(
  accessToken: string,
  isSandbox: boolean,
  path: string,
): Promise<T> {
  const res = await fetch(`${gcBase(isSandbox)}${path}`, {
    method: "GET",
    headers: gcHeaders(accessToken),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GoCardless GET ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Vérifier un token GoCardless (utilisé à la connexion) ───────────────────

export async function verifyGoCardlessToken(
  accessToken: string,
  isSandbox: boolean,
): Promise<{ organisationId: string }> {
  const data = await gcGet<{ creditors: { id: string }[] }>(
    accessToken,
    isSandbox,
    "/creditors",
  );
  if (!data.creditors?.length) {
    throw new Error("Aucun créancier GoCardless trouvé");
  }
  return { organisationId: data.creditors[0].id };
}

// ─── Créer un Billing Request (demande de mandat SEPA) ───────────────────────
// Renvoie l'ID du Billing Request (BR_xxx)

export async function createBillingRequest(
  accessToken: string,
  isSandbox: boolean,
  params: {
    clientEmail: string;
    clientName: string;
    description: string;
    invoiceId: string;
  },
): Promise<string> {
  const data = await gcPost<{ billing_requests: { id: string } }>(
    accessToken,
    isSandbox,
    "/billing_requests",
    {
      billing_requests: {
        mandate_request: {
          currency: "EUR",
          scheme: "sepa_core",
          description: params.description,
          metadata: { invoiceId: params.invoiceId },
        },
        links: {},
        metadata: { invoiceId: params.invoiceId },
        payer_details: {
          email: params.clientEmail,
          given_name: params.clientName.split(" ")[0],
          family_name: params.clientName.split(" ").slice(1).join(" ") || params.clientName,
        },
      },
    },
  );

  return data.billing_requests.id;
}

// ─── Créer un Billing Request Flow → URL d'autorisation pour le client ───────

export async function createBillingRequestFlow(
  accessToken: string,
  isSandbox: boolean,
  billingRequestId: string,
  successRedirectUri: string,
): Promise<string> {
  const data = await gcPost<{ billing_request_flows: { authorisation_url: string } }>(
    accessToken,
    isSandbox,
    "/billing_request_flows",
    {
      billing_request_flows: {
        redirect_uri: successRedirectUri,
        links: { billing_request: billingRequestId },
        show_redirect_buttons: false,
        skip_success_screen: false,
        lock_bank_account: false,
      },
    },
  );

  return data.billing_request_flows.authorisation_url;
}

// ─── Créer un paiement SEPA sur un mandat actif ───────────────────────────────

export async function createSepaPayment(
  accessToken: string,
  isSandbox: boolean,
  params: {
    mandateId: string;
    amountCents: number;       // en centimes (ex: 1000 = 10,00€)
    description: string;
    invoiceId: string;
  },
): Promise<{ paymentId: string; status: string }> {
  const data = await gcPost<{ payments: { id: string; status: string } }>(
    accessToken,
    isSandbox,
    "/payments",
    {
      payments: {
        amount: params.amountCents,
        currency: "EUR",
        description: params.description,
        metadata: { invoiceId: params.invoiceId },
        links: { mandate: params.mandateId },
      },
    },
  );

  return {
    paymentId: data.payments.id,
    status: data.payments.status,
  };
}

// ─── Vérifier la signature d'un webhook GoCardless ───────────────────────────
// GoCardless signe ses webhooks avec HMAC-SHA256.

import { createHmac } from "crypto";

export function verifyGoCardlessWebhook(
  body: string,
  signature: string,
  webhookSecret: string,
): boolean {
  const expected = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

// ─── Types utiles ─────────────────────────────────────────────────────────────

export interface GcWebhookEvent {
  id: string;
  created_at: string;
  resource_type: string;
  action: string;
  links: {
    mandate?: string;
    payment?: string;
    billing_request?: string;
  };
  metadata: Record<string, string>;
  details: {
    cause: string;
    description: string;
    scheme?: string;
  };
}
