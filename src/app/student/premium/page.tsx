'use client';
import PremiumPresentation from '@/components/payments/PremiumPresentation';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { PLANS } from '@/lib/subscription-plans';
import StripeCheckoutModal from '@/components/payments/StripeCheckoutModal';

import type { PaymentMethodId } from '@/components/payments/PaymentMethodLogo';

const plan = PLANS.student_premium;

type PayMethod = PaymentMethodId;

export default function StudentPremiumPage() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [method, setMethod] = useState<PayMethod>('bkash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  useEffect(() => {
    if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled. Please try again.');
    }
    if (paymentStatus === 'failed') {
      setError('Payment failed. Please try another method.');
    }
    if (paymentStatus === 'error') {
      setError('Something went wrong. Please contact support.');
    }
  }, [paymentStatus]);

  useEffect(() => {
    let cancelled = false;

    async function loadPremiumStatus() {
      try {
        const res = await fetch('/api/premium/status', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as { isPremium?: boolean };
        if (!cancelled) {
          setIsPremium(Boolean(data.isPremium));
        }
      } catch {
        // Keep the checkout screen usable even if the status endpoint is unavailable.
      } finally {
        if (!cancelled) {
          setPremiumLoaded(true);
        }
      }
    }

    loadPremiumStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePay() {
    if (isPremium) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (method === 'bkash') {
        const res = await fetch('/api/payment/bkash/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan.id }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.details ?? data.error ?? 'Failed to initiate bKash payment.');
          return;
        }

        if (typeof data.bkashURL !== 'string' || !data.bkashURL.startsWith('http')) {
          setError('bKash did not return a valid checkout URL.');
          return;
        }

        window.location.assign(data.bkashURL);
        return;
      }

      setShowCardModal(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PremiumPresentation
      role="student"
      method={method}
      onMethodChange={setMethod}
      onPay={handlePay}
      loading={loading}
      isPremium={isPremium}
      error={error}
      statusLoaded={premiumLoaded}
    >
      <StripeCheckoutModal
        open={showCardModal}
        role="student"
        planId={plan.id}
        planName={plan.name}
        amount={plan.price}
        method={method === 'mastercard' ? 'mastercard' : 'visa'}
        onClose={() => setShowCardModal(false)}
      />
    </PremiumPresentation>
  );
}
