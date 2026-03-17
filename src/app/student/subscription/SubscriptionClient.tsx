'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, CreditCard, Crown, XCircle } from 'lucide-react';
import { PLANS } from '@/lib/subscription-plans';

const PREMIUM_STATUS_EVENT = 'nextern-premium-status-updated';

interface Props {
  role: 'student' | 'employer';
  subscription: {
    _id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    amountBDT: number;
    paymentMethod: string;
    daysLeft: number;
  } | null;
  payments: {
    _id: string;
    amountBDT: number;
    method: string;
    status: string;
    createdAt: string;
    bkashTrxId?: string;
    stripePaymentIntentId?: string;
  }[];
}

const C = {
  blue: '#2563EB',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  success: '#10B981',
  bg: '#F1F5F9',
};

const METHOD_LABEL: Record<string, string> = {
  bkash: '🔴 bKash',
  visa: '💳 Visa',
  mastercard: '💳 Mastercard',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  success: { bg: '#DCFCE7', color: '#166534' },
  initiated: { bg: '#FEF9C3', color: '#92400E' },
  failed: { bg: '#FEE2E2', color: '#991B1B' },
  refunded: { bg: '#EDE9FE', color: '#5B21B6' },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SubscriptionClient({ role, subscription, payments }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const paymentIntentId = searchParams.get('payment_intent');
  const hasVerifiedRef = useRef(false);

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [message, setMessage] = useState(
    paymentStatus === 'success'
      ? 'Payment successful! Your premium access is now active.'
      : paymentStatus === 'pending' || paymentStatus === 'processing'
        ? 'Payment is being processed. Premium will activate shortly.'
        : ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(PREMIUM_STATUS_EVENT, {
        detail: { isPremium: Boolean(subscription) },
      })
    );
  }, [subscription]);

  useEffect(() => {
    if (!paymentIntentId || hasVerifiedRef.current) {
      return;
    }

    const currentPaymentIntentId = paymentIntentId;
    hasVerifiedRef.current = true;

    async function verifyStripePayment() {
      try {
        setMessage('Checking your card payment...');
        const res = await fetch(
          `/api/payment/stripe/verify?paymentIntentId=${encodeURIComponent(currentPaymentIntentId)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? 'Failed to verify card payment.');
          return;
        }

        if (data.status === 'succeeded') {
          setMessage('Payment successful! Your premium access is now active.');
          window.dispatchEvent(
            new CustomEvent(PREMIUM_STATUS_EVENT, {
              detail: { isPremium: true },
            })
          );
          router.refresh();
          return;
        }

        setMessage(data.message ?? 'Payment is still processing. Please refresh in a moment.');
      } catch {
        setError('Could not verify card payment. Please refresh the page once.');
      }
    }

    verifyStripePayment();
  }, [paymentIntentId, router]);

  async function handleCancel() {
    setCancelling(true);
    setError('');

    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to cancel subscription.');
        return;
      }

      setMessage(`Subscription cancelled. Access continues until ${formatDate(data.accessUntil)}.`);
      window.dispatchEvent(
        new CustomEvent(PREMIUM_STATUS_EVENT, {
          detail: { isPremium: true },
        })
      );
      setShowCancelConfirm(false);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  const plan = subscription
    ? PLANS[subscription.plan as 'student_premium' | 'employer_premium']
    : role === 'student'
      ? PLANS.student_premium
      : PLANS.employer_premium;
  const upgradeHref = role === 'student' ? '/student/premium' : '/employer/premium';
  const emptyDescription =
    role === 'student'
      ? 'Upgrade to Premium for unlimited AI skill analysis, mock interviews, and priority job recommendations.'
      : 'Upgrade to Premium for unlimited job postings, AI shortlisting, and priority employer visibility.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message ? (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#166534',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#991B1B',
            fontSize: 14,
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      {subscription ? (
        <div
          style={{
            background: 'linear-gradient(145deg, #1E293B, #0F172A)',
            borderRadius: 24,
            padding: 28,
            border: '1px solid rgba(37,99,235,0.3)',
            boxShadow: '0 16px 40px rgba(15,23,42,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              background: 'radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)',
              borderRadius: '50%',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 999,
                  padding: '4px 12px',
                  marginBottom: 10,
                }}
              >
                <Crown size={13} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>
                  {subscription.status === 'cancelled' ? 'Cancelled renewal' : 'Active'}
                </span>
              </div>
              <h2
                style={{
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </h2>
              <p style={{ color: '#64748B', fontSize: 14 }}>{plan.tagline}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  color: '#fff',
                  fontSize: 36,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                ৳{subscription.amountBDT}
              </div>
              <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>per month</div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              { label: 'Started', value: formatDate(subscription.startDate) },
              { label: 'Ends', value: formatDate(subscription.endDate) },
              {
                label: 'Days Remaining',
                value: `${subscription.daysLeft} days`,
                highlight: subscription.daysLeft <= 7,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    color: '#475569',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    color: item.highlight ? '#F59E0B' : '#E2E8F0',
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#475569', fontSize: 13 }}>Paid via</span>
              <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>
                {METHOD_LABEL[subscription.paymentMethod] ?? subscription.paymentMethod}
              </span>
            </div>

            {subscription.status === 'active' ? (
              !showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#F87171',
                    padding: '9px 18px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <XCircle size={14} />
                  Cancel subscription
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#F87171', fontSize: 13 }}>Are you sure?</span>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{
                      background: '#EF4444',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 9,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#CBD5E1',
                      padding: '8px 14px',
                      borderRadius: 9,
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Keep
                  </button>
                </div>
              )
            ) : (
              <span style={{ color: '#FBBF24', fontSize: 13, fontWeight: 700 }}>
                Renewal cancelled - access continues until the end date
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: 40,
            border: `1px solid ${C.border}`,
            textAlign: 'center',
            boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: '#EFF6FF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Crown size={28} color={C.blue} />
          </div>
          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.text,
              fontFamily: 'var(--font-display)',
              marginBottom: 8,
            }}
          >
            No active subscription
          </h3>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 auto 24px', maxWidth: 420 }}>
            {emptyDescription}
          </p>
          <Link
            href={upgradeHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: C.blue,
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 14,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
            }}
          >
            <Crown size={16} />
            Upgrade to Premium - ৳{plan.price}/month
          </Link>
        </div>
      )}

      {payments.length > 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: 24,
            border: `1px solid ${C.border}`,
            boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
          }}
        >
          <h3
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: C.text,
              fontFamily: 'var(--font-display)',
              marginBottom: 18,
            }}
          >
            Payment History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {payments.map((payment, index) => {
              const statusStyle = STATUS_STYLE[payment.status] ?? STATUS_STYLE.initiated;
              const providerReference =
                payment.method === 'bkash' ? payment.bkashTrxId : payment.stripePaymentIntentId;
              return (
                <div
                  key={payment._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: index < payments.length - 1 ? `1px solid ${C.bg}` : 'none',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CreditCard size={16} color={C.blue} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>
                        Nextern Premium
                      </div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>
                        {formatDate(payment.createdAt)} ·{' '}
                        {METHOD_LABEL[payment.method] ?? payment.method}
                      </div>
                      {providerReference ? (
                        <div
                          style={{
                            color: '#475569',
                            fontSize: 11,
                            marginTop: 4,
                            wordBreak: 'break-all',
                          }}
                        >
                          {payment.method === 'bkash' ? 'Transaction ID' : 'Payment Intent'}:{' '}
                          <span style={{ fontWeight: 700 }}>{providerReference}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontWeight: 800,
                        color: C.text,
                        fontSize: 16,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      ৳{payment.amountBDT}
                    </span>
                    <span
                      style={{
                        ...statusStyle,
                        padding: '3px 11px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
