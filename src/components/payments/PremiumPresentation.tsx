import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, Check, CreditCard, Crown, ShieldCheck } from 'lucide-react';
import { PLANS, PREMIUM_LIMITS } from '@/lib/subscription-plans';
import { PaymentMethodLogo, type PaymentMethodId } from './PaymentMethodLogo';
import './premium-presentation.css';

type Props = {
  role: 'student' | 'employer';
  method: PaymentMethodId;
  onMethodChange: (method: PaymentMethodId) => void;
  onPay: () => void;
  loading: boolean;
  isPremium: boolean;
  error: string;
  statusLoaded?: boolean;
  children?: ReactNode;
};
export default function PremiumPresentation({
  role,
  method,
  onMethodChange,
  onPay,
  loading,
  isPremium,
  error,
  statusLoaded = true,
  children,
}: Props) {
  const plan = PLANS[role === 'student' ? 'student_premium' : 'employer_premium'];
  const limits = PREMIUM_LIMITS.free;
  const rows =
    role === 'student'
      ? [
          {
            feature: 'Skill gap analysis',
            free: `${limits.skillGapAnalysisPerMonth}/month`,
            premium: 'Unlimited',
          },
          {
            feature: 'Mock interviews',
            free: `${limits.mockInterviewsPerMonth}/month`,
            premium: 'Unlimited',
          },
          {
            feature: 'Mentorship requests',
            free: `${limits.mentorshipRequestsPerMonth}/month`,
            premium: 'Unlimited',
          },
          {
            feature: 'Smart recommendations',
            free: `${limits.smartJobRecommendationsPerMonth}/month`,
            premium: 'Unlimited',
          },
          { feature: 'Internship fit score', free: 'Basic', premium: 'Full analysis' },
          { feature: 'Training paths & resume review', free: '—', premium: 'Included' },
          { feature: 'Graduation report PDF', free: '—', premium: 'Included' },
        ]
      : [
          {
            feature: 'Job postings',
            free: `${limits.jobPostingsPerMonth}/month`,
            premium: 'Unlimited',
          },
          {
            feature: 'Applicant shortlists',
            free: `${limits.aiApplicantShortlistsPerMonth}/month`,
            premium: 'Unlimited',
          },
          { feature: 'Pipeline analytics', free: 'Basic', premium: 'Advanced' },
          { feature: 'Priority listings', free: '—', premium: 'Included' },
        ];
  const Heading = role === 'student' ? 'h1' : 'h2';
  return (
    <div className="premium-workspace">
      <header className="premium-intro">
        <div>
          <p className="workspace-eyebrow">
            <Crown size={16} /> Nextern Premium
          </p>
          <Heading>
            {role === 'student'
              ? 'Invest in your next chapter.'
              : 'Make room for your next great hire.'}
          </Heading>
          <p>
            {role === 'student'
              ? 'More practice. Deeper insights. A clearer path from preparation to opportunity.'
              : 'More room to hire, understand your pipeline, and connect with university talent.'}
          </p>
        </div>
        <div className="premium-price">
          <span>{plan.name}</span>
          <strong>
            ৳{plan.price.toLocaleString('en-BD')}
            <small>/month</small>
          </strong>
          <span>{plan.durationDays} days of access</span>
        </div>
      </header>
      {error && (
        <p className="premium-alert" role="alert">
          {error}
        </p>
      )}
      {isPremium && (
        <div className="premium-active" role="status">
          <Check size={20} />
          <div>
            <strong>Your Premium plan is active</strong>
            <p>Your upgraded features are ready to use.</p>
          </div>
          <Link href={`/${role}/subscription`}>
            Manage subscription <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      <div className="premium-layout">
        <div className="premium-benefits">
          <section className="premium-feature-panel">
            <p className="workspace-eyebrow">Included in your plan</p>
            <h2>
              {role === 'student'
                ? 'The tools to take your next step.'
                : 'A more complete hiring workspace.'}
            </h2>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={17} />
                  <span>
                    {feature.replace(
                      /\(vs 2\/month free\)/,
                      `(vs ${limits.mentorshipRequestsPerMonth}/month free)`
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="premium-comparison">
            <h2>Choose what works for you</h2>
            <div className="v2-table-scroll">
              <table>
                <caption className="sr-only">Free and Premium plan comparison</caption>
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col">Free</th>
                    <th scope="col">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row">{row.feature}</th>
                      <td>{row.free}</td>
                      <td>{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="premium-checkout">
          <div className="premium-checkout-title">
            <CreditCard size={21} />
            <h2>{isPremium ? 'Your subscription' : 'Make it your next step'}</h2>
          </div>
          <p>Choose a payment method to activate your plan.</p>
          <dl>
            <div>
              <dt>{plan.name}</dt>
              <dd>৳{plan.price.toLocaleString('en-BD')}</dd>
            </div>
            <div>
              <dt>Total for {plan.durationDays} days</dt>
              <dd>৳{plan.price.toLocaleString('en-BD')}</dd>
            </div>
          </dl>
          <fieldset disabled={loading || isPremium}>
            <legend>Payment method</legend>
            {(
              [
                { id: 'bkash', label: 'bKash', hint: 'Pay with your mobile wallet' },
                { id: 'visa', label: 'Visa', hint: 'Secure card checkout' },
                { id: 'mastercard', label: 'Mastercard', hint: 'Secure card checkout' },
              ] as const
            ).map((item) => (
              <label
                className={
                  method === item.id ? 'payment-choice payment-choice-active' : 'payment-choice'
                }
                key={item.id}
              >
                <input
                  type="radio"
                  name={`${role}-payment`}
                  value={item.id}
                  checked={method === item.id}
                  onChange={() => onMethodChange(item.id)}
                />
                <PaymentMethodLogo method={item.id} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <button
            className="btn-primary"
            type="button"
            onClick={onPay}
            disabled={loading || isPremium || !statusLoaded}
          >
            {!statusLoaded
              ? 'Checking subscription…'
              : isPremium
                ? 'Premium is active'
                : loading
                  ? 'Processing…'
                  : `Pay ৳${plan.price.toLocaleString('en-BD')} with ${method === 'bkash' ? 'bKash' : method === 'visa' ? 'Visa' : 'Mastercard'}`}
          </button>
          <div className="premium-payment-note">
            <ShieldCheck size={16} />
            <p>
              {method === 'bkash'
                ? 'Continue to bKash to complete payment.'
                : 'Your card details are entered in the secure Stripe checkout.'}
            </p>
          </div>
          <p className="premium-cancel-note">
            Cancel anytime. Access continues until your billing period ends.
          </p>
        </aside>
      </div>
      {children}
    </div>
  );
}
