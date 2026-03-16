// src/lib/stripe.ts
// Stripe REST API wrapper using native fetch — no npm package needed.
// Used for Visa/Mastercard payment processing for premium subscriptions.
// Docs: https://stripe.com/docs/api
//
// Setup: Get keys from dashboard.stripe.com → Developers → API keys
// Add to .env.local:
//   STRIPE_SECRET_KEY=sk_test_...
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
//   STRIPE_WEBHOOK_SECRET=whsec_...

const STRIPE_BASE = 'https://api.stripe.com/v1';

function stripeHeaders(): Record<string, string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

// URL-encode a nested object for Stripe's form-encoded API
function encode(data: Record<string, unknown>, prefix = ''): string {
  return Object.entries(data)
    .map(([key, val]) => {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        return encode(val as Record<string, unknown>, fullKey);
      }
      return `${encodeURIComponent(fullKey)}=${encodeURIComponent(String(val ?? ''))}`;
    })
    .join('&');
}

async function stripeRequest<T>(
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method,
    headers: stripeHeaders(),
    body: body ? encode(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Stripe error [${res.status}]: ${data?.error?.message ?? JSON.stringify(data)}`
    );
  }
  return data as T;
}

// ── Payment Intent ───────────────────────────────────────────────────────────

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, string>;
}

export async function createStripePaymentIntent(params: {
  amountBDT: number; // Major unit amount in BDT
  description: string;
  metadata: Record<string, string>;
}): Promise<StripePaymentIntent> {
  // Stripe requires amount in smallest currency unit.
  // BDT is a zero-decimal currency — 1 BDT = 1 unit in Stripe.
  return stripeRequest<StripePaymentIntent>('/payment_intents', 'POST', {
    amount: Math.round(params.amountBDT * 100),
    currency: 'bdt',
    description: params.description,
    metadata: params.metadata,
    'payment_method_types[0]': 'card',
  });
}

export async function retrieveStripePaymentIntent(
  paymentIntentId: string
): Promise<StripePaymentIntent> {
  return stripeRequest<StripePaymentIntent>(`/payment_intents/${paymentIntentId}`, 'GET');
}

// ── Webhook signature verification ──────────────────────────────────────────
// Used in the webhook route to verify the event came from Stripe.
// Implements Stripe's HMAC-SHA256 signature check.

export async function verifyStripeWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not set');

  const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const sigHash = parts['v1'];
  if (!timestamp || !sigHash) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  );

  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSig === sigHash;
}
