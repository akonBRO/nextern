'use client';

import { useEffect, useRef, useState } from 'react';
import { CreditCard, LoaderCircle, Lock, ShieldCheck, X } from 'lucide-react';
import type { PlanId } from '@/lib/subscription-plans';

type CardMethod = 'visa' | 'mastercard';
type UserRole = 'student' | 'employer';

type StripeInitResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  planName: string;
  method: CardMethod;
  details?: string;
};

type StripeElement = {
  mount: (selector: string | HTMLElement) => void;
  destroy?: () => void;
};

type StripeElementsInstance = {
  create: (type: 'payment', options?: Record<string, unknown>) => StripeElement;
};

type StripeInstance = {
  elements: (options: {
    clientSecret: string;
    appearance?: Record<string, unknown>;
  }) => StripeElementsInstance;
  confirmPayment: (options: {
    elements: StripeElementsInstance;
    confirmParams: { return_url: string };
    redirect?: 'always';
  }) => Promise<{ error?: { message?: string } }>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

const COLORS = {
  blue: '#2563EB',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F8FAFC',
  success: '#10B981',
};

async function ensureStripeScriptLoaded() {
  if (window.Stripe) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-stripe-js="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.dataset.stripeJs = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(script);
  });
}

async function waitForMountNode(ref: { current: HTMLDivElement | null }, attempts = 8) {
  for (let index = 0; index < attempts; index += 1) {
    if (ref.current) {
      return ref.current;
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  return null;
}

export default function StripeCheckoutModal({
  open,
  role,
  planId,
  planName,
  amount,
  method,
  onClose,
}: {
  open: boolean;
  role: UserRole;
  planId: PlanId;
  planName: string;
  amount: number;
  method: CardMethod;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElementsInstance | null>(null);
  const paymentElementRef = useRef<StripeElement | null>(null);

  useEffect(() => {
    if (!open) {
      setError('');
      setLoading(false);
      setSubmitting(false);
      setInitialized(false);
      paymentElementRef.current?.destroy?.();
      paymentElementRef.current = null;
      elementsRef.current = null;
      stripeRef.current = null;
      if (mountNodeRef.current) {
        mountNodeRef.current.innerHTML = '';
      }
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setInitialized(false);
        setError('');

        await ensureStripeScriptLoaded();

        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error('Stripe publishable key is missing.');
        }
        if (!window.Stripe) {
          throw new Error('Stripe.js is not available.');
        }

        const initRes = await fetch('/api/payment/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planId, method }),
        });
        const initData = (await initRes.json()) as StripeInitResponse & { error?: string };

        if (!initRes.ok) {
          throw new Error(
            initData.details ?? initData.error ?? 'Failed to initialize secure checkout.'
          );
        }

        if (cancelled) {
          return;
        }

        const stripe = window.Stripe(publishableKey);
        stripeRef.current = stripe;

        const elements = stripe.elements({
          clientSecret: initData.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: COLORS.blue,
              colorText: COLORS.text,
              colorBackground: '#FFFFFF',
              colorDanger: '#B91C1C',
              borderRadius: '12px',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            },
          },
        });

        const paymentElement = elements.create('payment', {
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              name: '',
            },
          },
        });

        const mountNode = await waitForMountNode(mountNodeRef);
        if (!mountNode) {
          throw new Error('Payment form container is unavailable.');
        }

        mountNode.innerHTML = '';
        paymentElement.mount(mountNode);
        paymentElementRef.current = paymentElement;
        elementsRef.current = elements;
        setInitialized(true);
      } catch (initError) {
        setError(
          initError instanceof Error ? initError.message : 'Failed to initialize secure checkout.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [method, open, planId]);

  async function handleConfirm() {
    if (!stripeRef.current || !elementsRef.current) {
      setError('Secure card form is still loading.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const returnUrl = `${window.location.origin}/${role}/subscription?payment=processing`;
      const result = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: { return_url: returnUrl },
        redirect: 'always',
      });

      if (result.error?.message) {
        setError(result.error.message);
      }
    } catch {
      setError('Card payment could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.68)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#FFFFFF',
          borderRadius: 28,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 30px 80px rgba(15,23,42,0.22)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B, rgba(37,99,235,0.96))',
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#BFDBFE',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <ShieldCheck size={14} />
              Secure card checkout
            </div>
            <h3
              style={{
                margin: 0,
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
              }}
            >
              {planName}
            </h3>
            <p style={{ margin: '6px 0 0', color: '#CBD5E1', fontSize: 13 }}>
              Pay securely with {method === 'visa' ? 'Visa' : 'Mastercard'} via Stripe.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div
            style={{
              background: COLORS.bg,
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>Order total</div>
              <div
                style={{
                  color: COLORS.text,
                  fontSize: 18,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  marginTop: 2,
                }}
              >
                BDT {amount}
              </div>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: COLORS.success,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Lock size={14} />
              PCI-compliant card fields
            </div>
          </div>

          {error ? (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 14,
                padding: '12px 14px',
                color: '#991B1B',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 18,
              padding: 16,
              minHeight: 180,
              background: '#FFFFFF',
              position: 'relative',
            }}
          >
            <div
              ref={mountNodeRef}
              style={{
                minHeight: 148,
                opacity: loading && !initialized ? 0 : 1,
                transition: 'opacity 0.2s ease',
              }}
            />

            {loading ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: COLORS.muted,
                  fontSize: 14,
                  background: '#FFFFFF',
                  borderRadius: 12,
                }}
              >
                <LoaderCircle size={22} className="stripe-loader" />
                Preparing secure payment form...
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.muted }}>
              <CreditCard size={15} />
              <span style={{ fontSize: 12 }}>
                Stripe redirects you back after payment confirmation.
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!initialized || loading || submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minWidth: 180,
                padding: '12px 18px',
                borderRadius: 14,
                border: 'none',
                background: !initialized || loading || submitting ? '#93C5FD' : COLORS.blue,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                cursor: !initialized || loading || submitting ? 'not-allowed' : 'pointer',
                boxShadow:
                  !initialized || loading || submitting
                    ? 'none'
                    : '0 10px 24px rgba(37,99,235,0.28)',
              }}
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="stripe-loader" />
                  Redirecting...
                </>
              ) : (
                <>Pay BDT {amount}</>
              )}
            </button>
          </div>
        </div>

        <style>{`
          .stripe-loader {
            animation: stripe-spin 0.9s linear infinite;
          }

          @keyframes stripe-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
