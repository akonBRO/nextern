// src/lib/bkash.ts
// bKash Tokenized Checkout API wrapper (sandbox + production).
// Docs: https://developer.bka.sh/docs/tokenized-checkout-process-overview
// Sandbox base URL: https://tokenized.sandbox.bka.sh/v1.2.0-beta
//
// Flow:
//   1. grantToken()      → get access_token (cache for 1 hour)
//   2. createPayment()   → get bKashURL → redirect user
//   3. [user pays on bKash payment page]
//   4. executePayment()  → confirm payment and get trxID
//   5. queryPayment()    → optional status check

const BASE_URL = process.env.BKASH_BASE_URL ?? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

// In-memory token cache (Next.js serverless — lasts for the process lifetime)
let cachedToken: { token: string; expiresAt: number } | null = null;

// ── Token management ─────────────────────────────────────────────────────────

async function getHeaders(includeToken = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    username: process.env.BKASH_USERNAME!,
    password: process.env.BKASH_PASSWORD!,
  };

  if (includeToken) {
    const token = await grantToken();
    headers['authorization'] = token;
    headers['x-app-key'] = process.env.BKASH_APP_KEY!;
  }

  return headers;
}

export async function grantToken(): Promise<string> {
  // Return cached token if still valid (buffer 5 min before expiry)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: await getHeaders(false),
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY!,
      app_secret: process.env.BKASH_APP_SECRET!,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`bKash token grant failed: ${err}`);
  }

  const data = await res.json();

  if (data.statusCode !== '0000') {
    throw new Error(`bKash token error: ${data.statusMessage}`);
  }

  // Token is valid for 3600 seconds per bKash docs
  cachedToken = {
    token: data.id_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return cachedToken.token;
}

// ── Create payment ───────────────────────────────────────────────────────────

export interface BkashCreatePaymentParams {
  amount: number; // BDT integer
  orderId: string; // your internal reference (e.g. userId_timestamp)
  intent: 'sale'; // always 'sale' for subscriptions
  callbackURL: string; // your /api/payment/bkash/callback URL
}

export interface BkashCreatePaymentResult {
  paymentID: string;
  bkashURL: string; // redirect user here
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
}

export async function createBkashPayment(
  params: BkashCreatePaymentParams
): Promise<BkashCreatePaymentResult> {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
    method: 'POST',
    headers: await getHeaders(true),
    body: JSON.stringify({
      mode: '0011', // tokenized checkout mode
      payerReference: params.orderId,
      callbackURL: params.callbackURL,
      amount: params.amount.toString(),
      currency: 'BDT',
      intent: params.intent,
      merchantInvoiceNumber: params.orderId,
    }),
  });

  const data = await res.json();

  if (data.statusCode !== '0000') {
    throw new Error(`bKash create payment failed: ${data.statusMessage}`);
  }

  return data as BkashCreatePaymentResult;
}

// ── Execute payment ──────────────────────────────────────────────────────────

export interface BkashExecuteResult {
  paymentID: string;
  trxID: string;
  transactionStatus: string; // 'Completed' on success
  amount: string;
  currency: string;
  intent: string;
  paymentExecuteTime: string;
  merchantInvoiceNumber: string;
  payerReference: string;
  customerMsisdn: string; // masked bKash number e.g. 01XXXXXXXXX
}

export async function executeBkashPayment(paymentID: string): Promise<BkashExecuteResult> {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: await getHeaders(true),
    body: JSON.stringify({ paymentID }),
  });

  const data = await res.json();

  if (data.statusCode !== '0000') {
    throw new Error(`bKash execute failed: ${data.statusMessage}`);
  }

  return data as BkashExecuteResult;
}

// ── Query payment ────────────────────────────────────────────────────────────

export async function queryBkashPayment(paymentID: string) {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
    method: 'POST',
    headers: await getHeaders(true),
    body: JSON.stringify({ paymentID }),
  });

  return res.json();
}
