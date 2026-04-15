export const FREELANCE_CATEGORIES = [
  { id: 'web-dev', label: 'Web Development' },
  { id: 'graphic-design', label: 'Graphic Design' },
  { id: 'content-writing', label: 'Content Writing' },
  { id: 'data-analysis', label: 'Data Analysis' },
  { id: 'video-editing', label: 'Video Editing' },
  { id: 'other', label: 'Other' },
] as const;

export const FREELANCE_PAYMENT_METHODS = [
  { id: 'bkash', label: 'bKash' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
] as const;

export const FREELANCE_OPPORTUNITY_SCORE_DELTA = 5;
export const VERIFIED_FREELANCER_MIN_COMPLETED_ORDERS = 3;
export const VERIFIED_FREELANCER_MIN_AVG_RATING = 4.5;
export const VERIFIED_FREELANCER_BADGE_SLUG = 'verified-freelancer';
export const FREELANCE_PLATFORM_FEE_RATE = 0.15;

export type FreelancePriceType = 'fixed' | 'hourly';
export type FreelanceProposalStatus = 'requested' | 'countered' | 'accepted' | 'rejected';
export type FreelanceOfferActor = 'client' | 'freelancer';

export function getFreelanceWorkspaceHref(role?: string | null) {
  return role === 'employer' ? '/employer/freelance' : '/student/freelance';
}

export function calculateFreelanceQuote(params: {
  priceType: FreelancePriceType;
  rateBDT: number;
  hours?: number | null;
}) {
  const rateBDT = Math.max(1, Math.round(params.rateBDT || 0));

  if (params.priceType === 'hourly') {
    const hours = Math.max(1, Math.round(params.hours || 0));

    return {
      rateBDT,
      hours,
      totalBDT: rateBDT * hours,
    };
  }

  return {
    rateBDT,
    hours: undefined,
    totalBDT: rateBDT,
  };
}

export function calculateFreelancePayout(amountBDT: number) {
  const amount = Math.max(0, Math.round(amountBDT));
  const nexternCutBDT = Math.max(0, Math.round(amount * FREELANCE_PLATFORM_FEE_RATE));
  const freelancerPayoutBDT = Math.max(0, amount - nexternCutBDT);

  return {
    agreedPriceBDT: amount,
    nexternCutBDT,
    freelancerPayoutBDT,
  };
}

export function inferFreelanceProposalStatus(params: {
  proposalStatus?: string | null;
  status?: string | null;
}) {
  if (
    params.proposalStatus === 'requested' ||
    params.proposalStatus === 'countered' ||
    params.proposalStatus === 'accepted' ||
    params.proposalStatus === 'rejected'
  ) {
    return params.proposalStatus;
  }

  if (params.status === 'cancelled') {
    return 'rejected';
  }

  return 'accepted';
}

export function getFreelanceOrderThreadId(orderId: string) {
  return `freelance-order-${orderId}`;
}

export function getFreelanceInvoiceNumber(orderId: string) {
  return `NXT-FR-${orderId.slice(-8).toUpperCase()}`;
}
