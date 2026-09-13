'use client';
import PremiumPresentation from '@/components/payments/PremiumPresentation';

import { useState } from 'react';

import { PLANS } from '@/lib/subscription-plans';
import StripeCheckoutModal from '@/components/payments/StripeCheckoutModal';
import type { PaymentMethodId } from '@/components/payments/PaymentMethodLogo';

const plan = PLANS.employer_premium;
type PayMethod = PaymentMethodId;

type EmployerPremiumUsage = {
  counts: {
    aiApplicantShortlist: number;
    jobPosting: number;
  };
  limits: {
    aiApplicantShortlist: number | null;
    jobPosting: number | null;
  };
  remaining: {
    aiApplicantShortlist: number | null;
    jobPosting: number | null;
  };
};

function usageText(remaining?: number | null) {
  if (remaining === null) return 'Unlimited';
  if (typeof remaining === 'number') return `${remaining} left this month`;
  return 'Usage loading';
}

export default function EmployerPremiumClient({
  isPremium,
  usage,
}: {
  isPremium: boolean;
  usage?: EmployerPremiumUsage;
}) {
  const [method, setMethod] = useState<PayMethod>('bkash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);

  async function handlePay() {
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
          setError(data.details ?? data.error ?? 'Failed to initiate payment.');
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
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PremiumPresentation
      role="employer"
      method={method}
      onMethodChange={setMethod}
      onPay={handlePay}
      loading={loading}
      isPremium={isPremium}
      error={error}
    >
      <div className="premium-current-usage">
        <span>Applicant shortlists: {usageText(usage?.remaining.aiApplicantShortlist)}</span>
        <span>Job postings: {usageText(usage?.remaining.jobPosting)}</span>
      </div>
      <StripeCheckoutModal
        open={showCardModal}
        role="employer"
        planId={plan.id}
        planName={plan.name}
        amount={plan.price}
        method={method === 'mastercard' ? 'mastercard' : 'visa'}
        onClose={() => setShowCardModal(false)}
      />
    </PremiumPresentation>
  );
}
