export type WorkspaceRole = 'student' | 'employer';
export type WorkspaceTab = 'board' | 'services' | 'clientOrders' | 'freelancerOrders' | 'finance';

export type FreelanceAsset = {
  url: string;
  name: string;
  type: string;
};

export type Listing = {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  priceType: 'fixed' | 'hourly';
  priceBDT: number;
  deliveryDays: number;
  sampleFiles: FreelanceAsset[];
  averageRating: number;
  totalOrdersCompleted: number;
  isActive: boolean;
  createdAt: string | null;
  canEdit: boolean;
  canOrder: boolean;
  freelancer: {
    _id: string;
    name: string;
    image: string | null;
    university: string | null;
    department: string | null;
    skills: string[];
    opportunityScore: number;
    hasVerifiedFreelancerBadge: boolean;
  };
};

export type OrderSummary = {
  _id: string;
  status: string;
  escrowStatus: string;
  priceType: 'fixed' | 'hourly';
  listedPriceBDT: number;
  quotedRateBDT: number;
  quotedHours: number | null;
  proposalStatus: 'requested' | 'countered' | 'accepted' | 'rejected';
  latestOfferBy: 'client' | 'freelancer';
  proposalNote: string;
  messageThreadId: string;
  agreedPriceBDT: number;
  nexternCutBDT: number;
  freelancerPayoutBDT: number;
  paymentMethod: 'bkash' | 'visa' | 'mastercard' | null;
  requirements: string;
  requirementsFiles: FreelanceAsset[];
  adminNote: string;
  deliveryFiles: FreelanceAsset[];
  deliveryNote: string;
  clientNote: string;
  revisionCount: number;
  dueDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  clientConfirmedAt: string | null;
  disputedAt?: string | null;
  createdAt: string | null;
  clientReviewSubmitted: boolean;
  freelancerReviewSubmitted: boolean;
  negotiationHistory: {
    by: 'client' | 'freelancer';
    action: 'request' | 'counter' | 'accept' | 'reject';
    rateBDT: number;
    hours: number | null;
    totalBDT: number;
    note: string;
    createdAt: string | null;
  }[];
  listing: {
    _id: string;
    title: string;
    category: string;
    skills: string[];
    deliveryDays: number | null;
    priceType: 'fixed' | 'hourly' | null;
    priceBDT: number;
  };
  client: {
    _id: string;
    name: string;
    role: string | null;
    image: string | null;
    companyName: string | null;
  };
  freelancer: {
    _id: string;
    name: string;
    image: string | null;
    university: string | null;
    department: string | null;
  };
};

export type Review = {
  _id: string;
  reviewType: 'client_to_student' | 'student_to_client';
  overallRating: number | null;
  communicationRating: number | null;
  requirementsClarityRating: number | null;
  paymentPromptnessRating: number | null;
  professionalismRating: number | null;
  punctualityRating: number | null;
  skillPerformanceRating: number | null;
  workQualityRating: number | null;
  isRecommended: boolean;
  recommendationText: string;
  comment: string;
  createdAt: string | null;
  reviewer: {
    _id: string;
    name: string;
    image: string | null;
    role: string | null;
    companyName: string | null;
  } | null;
};

export type FreelanceInvoice = {
  id: string;
  invoiceNumber: string;
  perspective: 'client' | 'freelancer';
  orderId: string;
  status: string;
  listingTitle: string;
  category: string;
  counterpartyName: string;
  counterpartyRole: string;
  issuedAt: string | null;
  dueDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  paymentMethod: 'bkash' | 'visa' | 'mastercard' | null;
  priceType: 'fixed' | 'hourly';
  rateBDT: number;
  hours: number | null;
  grossAmountBDT: number;
  platformFeeRate: number | null;
  platformFeeBDT: number | null;
  clientTotalBDT: number;
  freelancerNetBDT: number | null;
  escrowStatus: string;
  orderStatus: string;
  lineItems: { label: string; amountBDT: number }[];
  notes: string;
};

export type FreelanceWithdrawal = {
  _id: string;
  amountBDT: number;
  status: 'requested' | 'processed' | 'rejected';
  note: string;
  adminNote: string;
  accountBalanceBeforeBDT: number;
  accountBalanceAfterBDT: number;
  createdAt: string | null;
  processedAt: string | null;
  rejectedAt: string | null;
};

export type FreelanceFinanceSummary = {
  accountBalanceBDT: number;
  totalEarningsBDT: number;
  totalSpendingsBDT: number;
  totalWithdrawnBDT: number;
  totalPlatformFeesBDT: number;
  pendingWithdrawalsBDT: number;
  clientInvoiceCount: number;
  freelancerInvoiceCount: number;
};

export type FreelanceFinancePayload = {
  summary: FreelanceFinanceSummary;
  clientInvoices: FreelanceInvoice[];
  freelancerInvoices: FreelanceInvoice[];
  withdrawals: FreelanceWithdrawal[];
};

export type ListingFormState = {
  title: string;
  description: string;
  category: string;
  skillsText: string;
  priceType: 'fixed' | 'hourly';
  priceBDT: string;
  deliveryDays: string;
  sampleFiles: FreelanceAsset[];
  isActive: boolean;
};

export type ReviewDraftState = {
  overallRating: number;
  communicationRating: number;
  requirementsClarityRating: number;
  paymentPromptnessRating: number;
  professionalismRating: number;
  punctualityRating: number;
  skillPerformanceRating: number;
  workQualityRating: number;
  isRecommended: boolean;
  recommendationText: string;
  comment: string;
};
