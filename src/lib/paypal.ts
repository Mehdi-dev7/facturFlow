// src/lib/paypal.ts
// Client PayPal API (fetch natif — pas de SDK npm)

const SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const LIVE_URL    = "https://api-m.paypal.com";

export function getPaypalBaseUrl(isSandbox = true) {
  return isSandbox ? SANDBOX_URL : LIVE_URL;
}

// ─── OAuth2 access token ──────────────────────────────────────────────────────

export async function getPaypalAccessToken(
  clientId: string,
  clientSecret: string,
  isSandbox = true,
): Promise<string> {
  const base = getPaypalBaseUrl(isSandbox);
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth échoué : ${err}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ─── Créer un Order PayPal ────────────────────────────────────────────────────

export interface PaypalOrderResult {
  orderId: string;
  approvalUrl: string;
}

export async function createPaypalOrder(
  accessToken: string,
  {
    amount,
    invoiceNumber,
    invoiceId,
    returnUrl,
    cancelUrl,
    isSandbox = true,
  }: {
    amount: number; // montant décimal en euros
    invoiceNumber: string;
    invoiceId: string;
    returnUrl: string;
    cancelUrl: string;
    isSandbox?: boolean;
  },
): Promise<PaypalOrderResult> {
  const base  = getPaypalBaseUrl(isSandbox);
  const value = amount.toFixed(2);

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount:      { currency_code: "EUR", value },
          description: `Facture ${invoiceNumber}`,
          custom_id:   invoiceId,
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order échoué : ${err}`);
  }

  const data = (await res.json()) as {
    id: string;
    links: { href: string; rel: string; method: string }[];
  };

  const approvalLink = data.links.find(
    (l) => l.rel === "payer-action" || l.rel === "approve",
  );

  if (!approvalLink) {
    throw new Error("PayPal : URL d'approbation absente de la réponse");
  }

  return { orderId: data.id, approvalUrl: approvalLink.href };
}

// ─── Capturer un Order PayPal ─────────────────────────────────────────────────

export async function capturePaypalOrder(
  accessToken: string,
  orderId: string,
  isSandbox = true,
): Promise<{ status: string; captureId: string }> {
  const base = getPaypalBaseUrl(isSandbox);

  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture échoué : ${err}`);
  }

  const data = (await res.json()) as {
    status: string;
    purchase_units?: { payments?: { captures?: { id: string }[] } }[];
  };

  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? "";
  return { status: data.status, captureId };
}

// ─── Vérification de signature webhook ───────────────────────────────────────

export async function verifyPaypalWebhook(
  accessToken: string,
  {
    headers,
    rawBody,
    webhookId,
    isSandbox = true,
  }: {
    headers: {
      authAlgo: string;
      certUrl: string;
      transmissionId: string;
      transmissionSig: string;
      transmissionTime: string;
    };
    rawBody: string;
    webhookId: string;
    isSandbox?: boolean;
  },
): Promise<boolean> {
  const base = getPaypalBaseUrl(isSandbox);

  try {
    const res = await fetch(
      `${base}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo:        headers.authAlgo,
          cert_url:         headers.certUrl,
          transmission_id:  headers.transmissionId,
          transmission_sig: headers.transmissionSig,
          transmission_time: headers.transmissionTime,
          webhook_id:       webhookId,
          webhook_event:    JSON.parse(rawBody) as unknown,
        }),
        cache: "no-store",
      },
    );

    if (!res.ok) return false;
    const data = (await res.json()) as { verification_status: string };
    return data.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}
