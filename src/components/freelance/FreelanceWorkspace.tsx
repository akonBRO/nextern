'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import FreelanceFinance from './FreelanceFinance';
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  LoaderCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Upload,
  Wallet,
  ReceiptText,
  X,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  calculateFreelanceQuote,
  FREELANCE_CATEGORIES,
  FREELANCE_PLATFORM_FEE_RATE,
} from '@/lib/freelance-shared';
import { PaymentMethodLogo } from '@/components/payments/PaymentMethodLogo';
import BrandLoader from '@/components/ui/BrandLoader';
import FreelanceMarketplace from './FreelanceMarketplace';
import FreelanceServiceDetail from './FreelanceServiceDetail';
import FreelanceServiceEditor from './FreelanceServiceEditor';
import FreelanceQuoteComposer from './FreelanceQuoteComposer';
import FreelanceOrders, { OrderProgress } from './FreelanceOrders';
import { MarketplaceIdentity } from './MarketplaceIdentity';
import { EMPTY_MARKETPLACE_FILTERS, type MarketplaceFilters } from './marketplace-utils';
import FreelanceStripeCheckoutModal from './FreelanceStripeCheckoutModal';
import useDialog from '@/components/ui/useDialog';
import './freelance-workspace.css';
import './marketplace.css';

import type {
  WorkspaceRole,
  WorkspaceTab,
  FreelanceAsset,
  Listing,
  OrderSummary,
  Review,
  FreelanceInvoice,
  FreelanceFinancePayload,
  ListingFormState,
  ReviewDraftState,
} from './freelance-types';

const C = {
  blue: '#285741',
  blueLight: '#eef7f5',
  blueBorder: '#c8e3dc',
  teal: '#087f72',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
  amberBg: '#FFFBEB',
  amberBorder: '#FDE68A',
  green: '#10B981',
  greenBg: '#ECFDF5',
  greenBorder: '#A7F3D0',
  bg: '#f6f8f9',
  card: '#FFFFFF',
  border: '#d8e2d1',
  text: '#234638',
  textMuted: '#60717d',
  textLight: '#6e7f89',
  danger: '#E11D48',
  dangerBg: '#FFF1F2',
  dangerBorder: '#FECDD3',
};

const EMPTY_LISTING_FORM: ListingFormState = {
  title: '',
  description: '',
  category: FREELANCE_CATEGORIES[0].id,
  skillsText: '',
  priceType: 'fixed',
  priceBDT: '',
  deliveryDays: '7',
  sampleFiles: [],
  isActive: true,
};

const EMPTY_CLIENT_REVIEW: ReviewDraftState = {
  overallRating: 0,
  communicationRating: 0,
  requirementsClarityRating: 0,
  paymentPromptnessRating: 0,
  professionalismRating: 5,
  punctualityRating: 5,
  skillPerformanceRating: 5,
  workQualityRating: 5,
  isRecommended: true,
  recommendationText: '',
  comment: '',
};

const EMPTY_FREELANCER_REVIEW: ReviewDraftState = {
  overallRating: 5,
  communicationRating: 5,
  requirementsClarityRating: 5,
  paymentPromptnessRating: 5,
  professionalismRating: 0,
  punctualityRating: 0,
  skillPerformanceRating: 0,
  workQualityRating: 0,
  isRecommended: true,
  recommendationText: '',
  comment: '',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function formatStatus(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function quoteLabel(
  order: Pick<OrderSummary, 'priceType' | 'quotedRateBDT' | 'quotedHours' | 'agreedPriceBDT'>
) {
  if (order.priceType === 'hourly') {
    return `${formatMoney(order.quotedRateBDT)}/hr x ${order.quotedHours ?? 1}h`;
  }

  return formatMoney(order.agreedPriceBDT);
}

function proposalWaitingFor(
  order: Pick<OrderSummary, 'proposalStatus' | 'latestOfferBy'>,
  perspective: 'client' | 'freelancer' | null
) {
  if (!perspective || !['requested', 'countered'].includes(order.proposalStatus)) {
    return false;
  }

  return (
    (order.latestOfferBy === 'client' && perspective === 'freelancer') ||
    (order.latestOfferBy === 'freelancer' && perspective === 'client')
  );
}

function assetLabel(asset: FreelanceAsset) {
  if (asset.name) return asset.name;
  try {
    const url = new URL(asset.url);
    return url.pathname.split('/').pop() || 'File';
  } catch {
    return 'File';
  }
}

function toSkillList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function getReviewAverage(review: Review) {
  if (review.reviewType === 'client_to_student') {
    const values = [
      review.professionalismRating,
      review.punctualityRating,
      review.skillPerformanceRating,
      review.workQualityRating,
    ].filter((value): value is number => typeof value === 'number' && value > 0);
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const values = [
    review.overallRating,
    review.communicationRating,
    review.requirementsClarityRating,
    review.paymentPromptnessRating,
  ].filter((value): value is number => typeof value === 'number' && value > 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toneForStatus(status: string) {
  if (['completed', 'released', 'active', 'success', 'accepted'].includes(status)) {
    return { bg: C.greenBg, border: C.greenBorder, color: '#047857' };
  }
  if (
    [
      'pending',
      'pending_payment',
      'delivered',
      'initiated',
      'paused',
      'requested',
      'countered',
      'held_in_escrow',
      'awaiting_payment',
      'quote_pending',
      'processed',
    ].includes(status)
  ) {
    return { bg: C.amberBg, border: C.amberBorder, color: '#B45309' };
  }
  if (['disputed', 'cancelled', 'refunded', 'failed', 'inactive', 'rejected'].includes(status)) {
    return { bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
  }
  return { bg: '#f6f8f9', border: C.border, color: C.textMuted };
}

function getDefaultTab(): WorkspaceTab {
  return 'board';
}

function isWorkspaceTab(role: WorkspaceRole, value: string | null): value is WorkspaceTab {
  if (!value) return false;
  if (value === 'board' || value === 'clientOrders' || value === 'finance') return true;
  if (role === 'student' && (value === 'services' || value === 'freelancerOrders')) return true;
  return false;
}

function getWorkspaceHref(role: WorkspaceRole, view: WorkspaceTab) {
  return `/${role}/freelance?view=${view}`;
}

function withViewLabel(view: WorkspaceTab) {
  switch (view) {
    case 'board':
      return 'Marketplace';
    case 'services':
      return 'My services';
    case 'clientOrders':
      return 'Projects you’ve commissioned';
    case 'freelancerOrders':
      return 'Your client projects';
    case 'finance':
      return 'Earnings & Invoices';
    default:
      return 'Workspace';
  }
}

function shortenText(value: string, maxLength = 180) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function StatusPill({ value }: { value: string }) {
  const tone = toneForStatus(value);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 6,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {formatStatus(value)}
    </span>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="market-section">
      <header>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </header>
      {children}
    </section>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="market-empty" role="status">
      <FolderOpen size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function AssetList({
  assets,
  tone = 'neutral',
  removable = false,
  onRemove,
}: {
  assets: FreelanceAsset[];
  tone?: 'neutral' | 'teal' | 'blue';
  removable?: boolean;
  onRemove?: (index: number) => void;
}) {
  const palette =
    tone === 'teal'
      ? { bg: C.tealBg, border: C.tealBorder, color: C.teal }
      : tone === 'blue'
        ? { bg: C.blueLight, border: C.blueBorder, color: C.blue }
        : { bg: '#f6f8f9', border: C.border, color: C.textMuted };

  if (!assets.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {assets.map((asset, index) => (
        <div
          key={`${asset.url}:${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: palette.bg,
            border: `1px solid ${palette.border}`,
          }}
        >
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: palette.color,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <FolderOpen size={14} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {assetLabel(asset)}
            </span>
          </a>
          {removable ? (
            <button
              type="button"
              onClick={() => onRemove?.(index)}
              style={{
                border: 'none',
                background: 'transparent',
                color: C.danger,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type ApiFieldErrors = Record<string, string[] | undefined>;

function formatValidationFieldLabel(field: string) {
  const normalized = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();

  if (!normalized) return 'Field';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatApiErrorMessage(error?: string, details?: ApiFieldErrors) {
  const fieldMessages = Object.entries(details ?? {})
    .flatMap(([field, messages]) =>
      (messages ?? []).map((message) => `${formatValidationFieldLabel(field)}: ${message}`)
    )
    .filter(Boolean);

  if (fieldMessages.length > 0) {
    return error && error !== 'Validation failed'
      ? `${error}: ${fieldMessages.join('; ')}`
      : fieldMessages.join('; ');
  }

  return error ?? 'Request failed';
}

export default function FreelanceWorkspace({ role }: { role: WorkspaceRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const defaultTab = getDefaultTab();
  const currentView = isWorkspaceTab(role, requestedView) ? requestedView : defaultTab;

  const { startUpload: uploadSamples, isUploading: sampleUploading } =
    useUploadThing('freelanceSampleUploader');
  const { startUpload: uploadRequirements, isUploading: requirementUploading } = useUploadThing(
    'freelanceRequirementUploader'
  );
  const { startUpload: uploadDeliveries, isUploading: deliveryUploading } = useUploadThing(
    'freelanceDeliveryUploader'
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(currentView);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingPage, setListingPage] = useState(1);
  const [listingPageSize, setListingPageSize] = useState(24);
  const [listingTotal, setListingTotal] = useState(0);
  const [serviceListings, setServiceListings] = useState<Listing[]>([]);
  const [clientOrders, setClientOrders] = useState<OrderSummary[]>([]);
  const [freelancerOrders, setFreelancerOrders] = useState<OrderSummary[]>([]);
  const [financeData, setFinanceData] = useState<FreelanceFinancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [financeSubmitting, setFinanceSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [filters, setFilters] = useState<MarketplaceFilters>(() => ({
    ...EMPTY_MARKETPLACE_FILTERS,
    ...Object.fromEntries(
      Object.keys(EMPTY_MARKETPLACE_FILTERS).map((key) => [key, searchParams.get(key) ?? ''])
    ),
  }));
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [orderPanel, setOrderPanel] = useState('brief');
  const listingsRequestId = useRef(0);

  const [listingEditorOpen, setListingEditorOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [listingForm, setListingForm] = useState<ListingFormState>(EMPTY_LISTING_FORM);

  const [orderComposerListing, setOrderComposerListing] = useState<Listing | null>(null);
  const [requirementsText, setRequirementsText] = useState('');
  const [requirementFiles, setRequirementFiles] = useState<FreelanceAsset[]>([]);
  const [orderQuotedRate, setOrderQuotedRate] = useState('');
  const [orderQuotedHours, setOrderQuotedHours] = useState('1');
  const [orderProposalNote, setOrderProposalNote] = useState('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'bkash' | 'visa' | 'mastercard'>(
    'bkash'
  );

  const [pendingCardCheckout, setPendingCardCheckout] = useState<{
    orderId: string;
    title: string;
    amount: number;
    method: 'visa' | 'mastercard';
  } | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [selectedOrderPerspective, setSelectedOrderPerspective] = useState<
    'client' | 'freelancer' | null
  >(null);
  const [selectedOrderReviews, setSelectedOrderReviews] = useState<Review[]>([]);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState<FreelanceAsset[]>([]);
  const [revisionNote, setRevisionNote] = useState('');
  const [disputeNote, setDisputeNote] = useState('');
  const [proposalResponseRate, setProposalResponseRate] = useState('');
  const [proposalResponseHours, setProposalResponseHours] = useState('1');
  const [proposalResponseNote, setProposalResponseNote] = useState('');
  const [clientReviewDraft, setClientReviewDraft] = useState<ReviewDraftState>(EMPTY_CLIENT_REVIEW);
  const [freelancerReviewDraft, setFreelancerReviewDraft] =
    useState<ReviewDraftState>(EMPTY_FREELANCER_REVIEW);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<FreelanceInvoice | null>(null);

  const paymentVerificationRef = useRef<string | null>(null);

  const myListings = useMemo(
    () => serviceListings.filter((listing) => listing.canEdit),
    [serviceListings]
  );

  const requestJson = useCallback(async <T,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      error?: string;
      details?: ApiFieldErrors;
    };
    if (!response.ok) {
      throw new Error(formatApiErrorMessage(data.error, data.details));
    }

    return data;
  }, []);

  const switchTab = useCallback(
    (nextTab: WorkspaceTab) => {
      setActiveTab(nextTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', nextTab);
      params.delete('payment');
      params.delete('payment_intent');
      params.delete('order');
      router.replace(`/${role}/freelance?${params.toString()}`);
    },
    [role, router, searchParams]
  );

  const loadListings = useCallback(
    async (nextPage = listingPage, nextPageSize = listingPageSize, queryFilters = filters) => {
      const requestId = ++listingsRequestId.current;
      setBoardLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(nextPageSize),
        });
        for (const [key, value] of Object.entries(queryFilters)) {
          if (value.trim()) params.set(key, value.trim());
        }

        const boardRequest = requestJson<{
          listings: Listing[];
          pagination?: { total?: number };
        }>(`/api/freelance/listings?${params.toString()}`);

        if (role === 'student') {
          const mineRequest = requestJson<{ listings: Listing[] }>(
            '/api/freelance/listings?mine=true'
          );
          const [boardData, mineData] = await Promise.all([boardRequest, mineRequest]);
          if (requestId !== listingsRequestId.current) return;
          setListings(boardData.listings ?? []);
          setListingTotal(boardData.pagination?.total ?? boardData.listings?.length ?? 0);
          setServiceListings(mineData.listings ?? []);
        } else {
          const data = await boardRequest;
          if (requestId !== listingsRequestId.current) return;
          setListings(data.listings ?? []);
          setListingTotal(data.pagination?.total ?? data.listings?.length ?? 0);
          setServiceListings([]);
        }
      } catch (error) {
        if (requestId !== listingsRequestId.current) return;
        setFlash({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Failed to load the freelance board.',
        });
      } finally {
        if (requestId === listingsRequestId.current) setBoardLoading(false);
      }
    },
    [filters, listingPage, listingPageSize, requestJson, role]
  );

  function applyMarketplaceFilters(next: MarketplaceFilters) {
    setFilters(next);
    setListingPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', 'board');
    for (const [key, value] of Object.entries(next)) {
      if (value.trim()) params.set(key, value.trim());
      else params.delete(key);
    }
    router.replace('/' + role + '/freelance?' + params.toString(), { scroll: false });
    void loadListings(1, listingPageSize, next);
  }

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true);
    try {
      const data = await requestJson<FreelanceFinancePayload>('/api/freelance/finance');
      setFinanceData(data);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load freelance finance data.',
      });
    } finally {
      setFinanceLoading(false);
    }
  }, [requestJson]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await requestJson<{
        clientOrders: OrderSummary[];
        freelancerOrders: OrderSummary[];
      }>('/api/freelance/orders');
      setClientOrders(data.clientOrders ?? []);
      setFreelancerOrders(data.freelancerOrders ?? []);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load freelance orders.',
      });
    } finally {
      setOrdersLoading(false);
    }
  }, [requestJson]);

  async function uploadAssets(kind: 'sample' | 'requirements' | 'delivery', files: File[]) {
    if (!files.length) return [];

    const uploader =
      kind === 'sample'
        ? uploadSamples
        : kind === 'requirements'
          ? uploadRequirements
          : uploadDeliveries;

    const uploaded = await uploader(files);

    return (uploaded ?? [])
      .map((item, index) =>
        item?.ufsUrl
          ? {
              url: item.ufsUrl,
              name: item.name ?? files[index]?.name ?? `file-${index + 1}`,
              type: item.type ?? files[index]?.type ?? 'application/octet-stream',
            }
          : null
      )
      .filter((item): item is FreelanceAsset => Boolean(item));
  }

  function openCreateListingModal() {
    setEditingListing(null);
    setListingForm(EMPTY_LISTING_FORM);
    setListingEditorOpen(true);
  }

  function openEditListingModal(listing: Listing) {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      skillsText: listing.skills.join(', '),
      priceType: listing.priceType,
      priceBDT: String(listing.priceBDT),
      deliveryDays: String(listing.deliveryDays),
      sampleFiles: listing.sampleFiles ?? [],
      isActive: listing.isActive,
    });
    setListingEditorOpen(true);
  }

  async function submitListing() {
    setSubmitting(true);
    try {
      const payload = {
        title: listingForm.title.trim(),
        description: listingForm.description.trim(),
        category: listingForm.category,
        skills: toSkillList(listingForm.skillsText),
        priceType: listingForm.priceType,
        priceBDT: Number(listingForm.priceBDT),
        deliveryDays: Number(listingForm.deliveryDays),
        sampleFiles: listingForm.sampleFiles,
        isActive: listingForm.isActive,
      };

      if (editingListing) {
        await requestJson(`/api/freelance/listings/${editingListing._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFlash({ tone: 'success', text: 'Freelance service updated successfully.' });
      } else {
        await requestJson('/api/freelance/listings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFlash({
          tone: 'success',
          text: 'Freelance service published. Clients can now place funded orders.',
        });
      }

      setListingEditorOpen(false);
      setEditingListing(null);
      await loadListings();
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to save freelance listing.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleListingActive(listing: Listing) {
    setSubmitting(true);
    try {
      await requestJson(`/api/freelance/listings/${listing._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !listing.isActive }),
      });
      setFlash({
        tone: 'success',
        text: listing.isActive
          ? 'Listing paused. It is hidden from new buyers now.'
          : 'Listing reactivated on the freelance board.',
      });
      await loadListings();
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update listing visibility.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startOrderComposer(listing: Listing) {
    setOrderComposerListing(listing);
    setRequirementsText('');
    setRequirementFiles([]);
    setOrderQuotedRate(String(listing.priceBDT));
    setOrderQuotedHours('1');
    setOrderProposalNote('');
    setOrderPaymentMethod('bkash');
  }

  async function startBkashPayment(orderId: string) {
    try {
      const data = await requestJson<{ bkashURL: string }>('/api/freelance/payment/bkash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      if (!data.bkashURL) {
        throw new Error('bKash checkout URL was not returned.');
      }
      window.location.assign(data.bkashURL);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to launch bKash checkout.',
      });
    }
  }

  async function submitOrder() {
    if (!orderComposerListing) return;

    const requirements = requirementsText.trim();
    const proposalNote = orderProposalNote.trim();
    const quotedRateInput = orderQuotedRate.trim();
    const quotedRateBDT = quotedRateInput ? Number(quotedRateInput) : orderComposerListing.priceBDT;

    if (requirements.length < 20) {
      setFlash({
        tone: 'error',
        text: 'Project requirements must be at least 20 characters so the freelancer has enough detail.',
      });
      return;
    }

    if (!Number.isInteger(quotedRateBDT) || quotedRateBDT < 1 || quotedRateBDT > 500000) {
      setFlash({
        tone: 'error',
        text: 'Quote amount must be a whole number between 1 and 500000 BDT.',
      });
      return;
    }

    let quotedHours: number | undefined;
    if (orderComposerListing.priceType === 'hourly') {
      const parsedQuotedHours = Number(orderQuotedHours.trim() || '1');

      if (
        !Number.isInteger(parsedQuotedHours) ||
        parsedQuotedHours < 1 ||
        parsedQuotedHours > 400
      ) {
        setFlash({
          tone: 'error',
          text: 'Estimated hours must be a whole number between 1 and 400.',
        });
        return;
      }

      quotedHours = parsedQuotedHours;
    }

    setSubmitting(true);
    try {
      await requestJson('/api/freelance/orders', {
        method: 'POST',
        body: JSON.stringify({
          listingId: orderComposerListing._id,
          requirements,
          requirementsFiles: requirementFiles,
          quotedRateBDT,
          quotedHours,
          proposalNote,
          paymentMethod: orderPaymentMethod,
        }),
      });

      setFlash({
        tone: 'success',
        text: 'Order request sent. The freelancer can now accept, counter, or reject your quote before payment.',
      });
      setOrderComposerListing(null);
      await Promise.all([loadOrders(), loadFinance()]);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to create freelance order.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function startCardPayment(order: OrderSummary) {
    setPendingCardCheckout({
      orderId: order._id,
      title: order.listing.title,
      amount: order.agreedPriceBDT,
      method: order.paymentMethod === 'mastercard' ? 'mastercard' : 'visa',
    });
  }

  function openFreelanceChat(orderId: string) {
    router.push(`/${role}/messages?order=${encodeURIComponent(orderId)}`);
  }

  const openOrderWorkspace = useCallback(
    async (orderId: string, perspective?: 'client' | 'freelancer') => {
      setOrderModalOpen(true);
      setOrderDetailLoading(true);
      try {
        const data = await requestJson<{ order: OrderSummary; reviews: Review[] }>(
          `/api/freelance/orders/${orderId}`
        );
        setSelectedOrder(data.order);
        setSelectedOrderReviews(data.reviews ?? []);
        setDeliveryNote(data.order.deliveryNote ?? '');
        setDeliveryFiles(data.order.deliveryFiles ?? []);
        setRevisionNote(data.order.clientNote ?? '');
        setDisputeNote(data.order.clientNote ?? '');
        setProposalResponseRate(String(data.order.quotedRateBDT));
        setProposalResponseHours(String(data.order.quotedHours ?? 1));
        setProposalResponseNote(data.order.proposalNote ?? '');
        setSelectedOrderPerspective(
          perspective ??
            (freelancerOrders.some((order) => order._id === orderId) ? 'freelancer' : 'client')
        );
        setClientReviewDraft(EMPTY_CLIENT_REVIEW);
        setFreelancerReviewDraft(EMPTY_FREELANCER_REVIEW);
      } catch (error) {
        setFlash({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Failed to load order workspace.',
        });
        setOrderModalOpen(false);
      } finally {
        setOrderDetailLoading(false);
      }
    },
    [freelancerOrders, requestJson]
  );

  const refreshSelectedOrder = useCallback(
    async (orderId?: string) => {
      const targetId = orderId ?? selectedOrder?._id;
      if (!targetId) return;
      await Promise.all([loadListings(), loadOrders(), loadFinance()]);
      await openOrderWorkspace(targetId);
    },
    [loadFinance, loadListings, loadOrders, openOrderWorkspace, selectedOrder?._id]
  );

  async function submitOrderAction(
    action:
      | 'accept_proposal'
      | 'counter_proposal'
      | 'reject_proposal'
      | 'deliver'
      | 'request_revision'
      | 'confirm_completion'
      | 'cancel'
      | 'mark_disputed'
  ) {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await requestJson(`/api/freelance/orders/${selectedOrder._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          quotedRateBDT:
            action === 'counter_proposal' ? Number(proposalResponseRate || '0') : undefined,
          quotedHours:
            action === 'counter_proposal' && selectedOrder.priceType === 'hourly'
              ? Number(proposalResponseHours || '0')
              : undefined,
          proposalNote:
            action === 'accept_proposal' ||
            action === 'counter_proposal' ||
            action === 'reject_proposal'
              ? proposalResponseNote
              : undefined,
          deliveryNote,
          deliveryFiles,
          clientNote:
            action === 'request_revision'
              ? revisionNote
              : action === 'mark_disputed'
                ? disputeNote
                : undefined,
        }),
      });

      const messages: Record<string, string> = {
        accept_proposal:
          'Proposal accepted. The quote is now locked, freelance chat is open, and the client can fund escrow.',
        counter_proposal: 'Counter proposal sent.',
        reject_proposal: 'Proposal rejected and the request was closed.',
        deliver: 'Delivery submitted. The client can now review the work.',
        request_revision: 'Revision requested and sent back to the freelancer.',
        confirm_completion:
          'Completion confirmed. Nextern escrow has released the payout and the verified sample was synced.',
        cancel: 'Unpaid order cancelled.',
        mark_disputed: 'Dispute opened. Nextern can now review the escrow and order trail.',
      };

      setFlash({ tone: 'success', text: messages[action] });
      await refreshSelectedOrder(selectedOrder._id);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update the order.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReview(reviewType: 'client_to_student' | 'student_to_client') {
    if (!selectedOrder) return;

    const draft = reviewType === 'client_to_student' ? clientReviewDraft : freelancerReviewDraft;
    setSubmitting(true);
    try {
      await requestJson('/api/freelance/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder._id,
          reviewType,
          overallRating: draft.overallRating || undefined,
          communicationRating: draft.communicationRating || undefined,
          requirementsClarityRating: draft.requirementsClarityRating || undefined,
          paymentPromptnessRating: draft.paymentPromptnessRating || undefined,
          professionalismRating: draft.professionalismRating || undefined,
          punctualityRating: draft.punctualityRating || undefined,
          skillPerformanceRating: draft.skillPerformanceRating || undefined,
          workQualityRating: draft.workQualityRating || undefined,
          isRecommended: draft.isRecommended,
          recommendationText: draft.recommendationText,
          comment: draft.comment,
        }),
      });

      setFlash({
        tone: 'success',
        text:
          reviewType === 'client_to_student'
            ? 'Verified freelancer review submitted. The student work history is now stronger.'
            : 'Verified client review submitted successfully.',
      });

      await refreshSelectedOrder(selectedOrder._id);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit the verified review.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWithdrawal() {
    const amountBDT = Number(withdrawAmount || '0');
    if (!amountBDT) {
      setFlash({ tone: 'error', text: 'Enter a withdrawal amount first.' });
      return;
    }

    setFinanceSubmitting(true);
    try {
      await requestJson('/api/freelance/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          amountBDT,
          note: withdrawNote.trim(),
        }),
      });

      setWithdrawAmount('');
      setWithdrawNote('');
      setFlash({
        tone: 'success',
        text: 'Withdrawal request submitted. The amount moved out of available balance and is now waiting for superadmin review.',
      });
      await loadFinance();
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to request withdrawal.',
      });
    } finally {
      setFinanceSubmitting(false);
    }
  }

  useEffect(() => {
    setActiveTab(currentView);
  }, [currentView]);

  useEffect(() => {
    if (!loading) return;
    void Promise.all([loadListings(), loadOrders(), loadFinance()]).finally(() =>
      setLoading(false)
    );
  }, [loading, loadFinance, loadListings, loadOrders]);

  useEffect(() => {
    const paymentState = searchParams.get('payment');
    const paymentIntentId = searchParams.get('payment_intent');
    const orderId = searchParams.get('order');
    const currentPath = getWorkspaceHref(role, paymentState ? 'clientOrders' : currentView);

    async function verifyCardPayment(intentId: string) {
      if (paymentVerificationRef.current === intentId) return;
      paymentVerificationRef.current = intentId;

      try {
        const response = await fetch(
          `/api/freelance/payment/stripe/verify?paymentIntentId=${encodeURIComponent(intentId)}`,
          { cache: 'no-store' }
        );
        const data = await response.json();

        if (!response.ok || data.status !== 'succeeded') {
          setFlash({
            tone: 'error',
            text: data.error ?? data.message ?? 'Card payment verification is still pending.',
          });
          return;
        }

        setFlash({
          tone: 'success',
          text: 'Card payment confirmed. Nextern escrow is now holding the order funds.',
        });
        await Promise.all([loadListings(), loadOrders(), loadFinance()]);
        if (data.order?._id) {
          await openOrderWorkspace(data.order._id);
        }
      } catch {
        setFlash({
          tone: 'error',
          text: 'We could not verify the card payment. Please refresh and try again.',
        });
      } finally {
        router.replace(currentPath);
      }
    }

    if (paymentState === 'processing' && paymentIntentId) {
      void verifyCardPayment(paymentIntentId);
      return;
    }

    if (paymentState === 'success') {
      setFlash({
        tone: 'success',
        text: 'Escrow funded successfully. The freelancer can now start working.',
      });
      void Promise.all([loadListings(), loadOrders(), loadFinance()]).then(async () => {
        if (orderId) await openOrderWorkspace(orderId);
      });
      router.replace(currentPath);
      return;
    }

    if (paymentState === 'cancelled') {
      setFlash({
        tone: 'error',
        text: 'Payment was cancelled before escrow funding completed.',
      });
      router.replace(currentPath);
      return;
    }

    if (paymentState === 'failed' || paymentState === 'error') {
      setFlash({
        tone: 'error',
        text: 'Payment could not be completed. You can retry from the pending order card.',
      });
      router.replace(currentPath);
    }
  }, [
    currentView,
    loadFinance,
    loadListings,
    loadOrders,
    openOrderWorkspace,
    role,
    router,
    searchParams,
  ]);

  const selectedOrderCounterQuote = useMemo(() => {
    if (!selectedOrder) return null;

    return calculateFreelanceQuote({
      priceType: selectedOrder.priceType,
      rateBDT: Number(
        proposalResponseRate || selectedOrder.quotedRateBDT || selectedOrder.agreedPriceBDT
      ),
      hours:
        selectedOrder.priceType === 'hourly' ? Number(proposalResponseHours || '0') : undefined,
    });
  }, [proposalResponseHours, proposalResponseRate, selectedOrder]);

  if (loading) return <BrandLoader variant="page" label="Opening Nextern Freelancing" />;

  return (
    <div className="freelance-workspace market-product" style={{ paddingBottom: 48 }}>
      <div className="market-product-bar">
        <MarketplaceIdentity />
        <span className="market-product-tagline">Independent work. Shared ambition.</span>
        <button
          type="button"
          className="market-button-secondary"
          onClick={role === 'student' ? openCreateListingModal : () => switchTab('clientOrders')}
        >
          {role === 'student' ? (
            <>
              <Plus size={16} />
              Publish a service
            </>
          ) : (
            <>
              <FolderOpen size={16} />
              My projects
            </>
          )}
        </button>
      </div>
      <nav className="market-product-nav" aria-label="Freelancing navigation">
        {[
          { id: 'board', label: 'Explore services' },
          ...(role === 'student'
            ? [
                { id: 'services', label: 'My services' },
                { id: 'freelancerOrders', label: 'Client projects' },
              ]
            : []),
          {
            id: 'clientOrders',
            label: role === 'student' ? 'Projects I hired for' : 'My projects',
          },
          {
            id: 'finance',
            label: role === 'student' ? 'Earnings & invoices' : 'Payments & invoices',
          },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => switchTab(tab.id as WorkspaceTab)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === 'board' ? (
        <header className="market-intro">
          <div>
            <p className="market-kicker">THE NEXTERN FREELANCE MARKETPLACE</p>
            <h1>
              Fresh perspectives.
              <br />
              <em>Work that moves you forward.</em>
            </h1>
            <p>
              Find student talent for the things you want to build, design, and share. Start with a
              service. Make it your next project.
            </p>
          </div>
          <aside>
            <span className="market-intro-icon">
              <ShieldCheck size={26} />
            </span>
            <h2>
              From a good idea
              <br />
              to work you’re proud of.
            </h2>
            <p>Agree on the scope. Fund your order. Collaborate through delivery.</p>
            <a href="#freelance-how-it-works">
              How it works <ArrowRight size={16} />
            </a>
          </aside>
        </header>
      ) : (
        <header className="market-work-header">
          <div>
            <p className="market-kicker">YOUR FREELANCE WORKSPACE</p>
            <h1>
              {activeTab === 'finance' && role === 'employer'
                ? 'Payments & invoices'
                : withViewLabel(activeTab)}
            </h1>
            <p>
              {activeTab === 'services'
                ? 'Turn what you do well into a service clients can discover.'
                : activeTab === 'finance'
                  ? 'A clear view of your balance, payments, and project records.'
                  : 'Keep every conversation, agreement, and delivery moving forward.'}
            </p>
          </div>
          <button className="market-button-secondary" onClick={() => switchTab('board')}>
            <Search size={16} />
            Explore services
          </button>
        </header>
      )}
      {flash ? (
        <div
          role={flash.tone === 'error' ? 'alert' : 'status'}
          style={{
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: flash.tone === 'success' ? C.greenBg : C.dangerBg,
            border: `1px solid ${flash.tone === 'success' ? C.greenBorder : C.dangerBorder}`,
            borderRadius: 12,
            padding: '14px 16px',
            color: flash.tone === 'success' ? '#065F46' : '#991B1B',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {flash.tone === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{flash.text}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {activeTab === 'board' && (
        <FreelanceMarketplace
          listings={listings}
          total={listingTotal}
          loading={boardLoading}
          filters={filters}
          onApply={applyMarketplaceFilters}
          onOpen={(listing) => {
            setFlash(null);
            setDetailListing(listing);
          }}
          page={listingPage}
          pageSize={listingPageSize}
          onPage={(page) => {
            setListingPage(page);
            void loadListings(page, listingPageSize);
          }}
          onPageSize={(size) => {
            setListingPageSize(size);
            setListingPage(1);
            void loadListings(1, size);
          }}
        />
      )}
      {activeTab === 'services' && role === 'student' && (
        <SectionCard
          title="Your services"
          description="Keep your scope clear, your samples current, and your availability up to date."
          action={
            <button className="market-button" onClick={openCreateListingModal}>
              <Plus size={16} />
              New service
            </button>
          }
        >
          {myListings.length ? (
            <div className="market-project-list">
              {myListings.map((listing) => (
                <article className="market-project-card" key={listing._id}>
                  <div>
                    <StatusPill value={listing.isActive ? 'active' : 'paused'} />
                    <h3>{listing.title}</h3>
                    <p>{shortenText(listing.description, 180)}</p>
                    <div className="market-project-meta">
                      <span>
                        {formatMoney(listing.priceBDT)}
                        {listing.priceType === 'hourly' ? ' / hr' : ' / project'}
                      </span>
                      <span>{listing.deliveryDays} days delivery</span>
                      <span>{listing.totalOrdersCompleted} completed orders</span>
                      {listing.averageRating > 0 && (
                        <span>{listing.averageRating.toFixed(1)} rating</span>
                      )}
                    </div>
                  </div>
                  <aside>
                    <button
                      className="market-button-secondary"
                      onClick={() => {
                        setFlash(null);
                        openEditListingModal(listing);
                      }}
                    >
                      <PencilLine size={15} />
                      Edit service
                    </button>
                    <button
                      className="market-text-button"
                      onClick={() => setDetailListing(listing)}
                    >
                      Preview service
                    </button>
                    <button
                      className="market-text-button"
                      disabled={submitting}
                      onClick={() => void toggleListingActive(listing)}
                    >
                      {listing.isActive ? 'Pause service' : 'Reactivate service'}
                    </button>
                  </aside>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Make your skills your next opportunity."
              description="Publish a service with a clear outcome, your price, and examples of your work. Clients can then discover you and request a quote."
              action={
                <button className="market-button" onClick={openCreateListingModal}>
                  Create your first service
                  <ArrowRight size={16} />
                </button>
              }
            />
          )}
        </SectionCard>
      )}

      {(activeTab === 'clientOrders' ||
        (activeTab === 'freelancerOrders' && role === 'student')) && (
        <SectionCard
          title={
            activeTab === 'clientOrders'
              ? 'Projects you’ve commissioned'
              : 'Projects you’re delivering'
          }
          description="From the first quote to the final handover, keep the next step in sight."
        >
          {ordersLoading ? (
            <BrandLoader label="Loading your projects" />
          ) : (
            <FreelanceOrders
              orders={activeTab === 'clientOrders' ? clientOrders : freelancerOrders}
              mode={activeTab === 'clientOrders' ? 'client' : 'freelancer'}
              onExplore={() => switchTab(activeTab === 'clientOrders' ? 'board' : 'services')}
              renderOrder={(order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  role={role}
                  mode={activeTab === 'clientOrders' ? 'client' : 'freelancer'}
                  onOpen={() => {
                    setOrderPanel('brief');
                    void openOrderWorkspace(
                      order._id,
                      activeTab === 'clientOrders' ? 'client' : 'freelancer'
                    );
                  }}
                  onPayNow={
                    activeTab === 'clientOrders'
                      ? () =>
                          order.paymentMethod === 'bkash'
                            ? void startBkashPayment(order._id)
                            : void startCardPayment(order)
                      : undefined
                  }
                />
              )}
            />
          )}
        </SectionCard>
      )}

      {activeTab === 'finance' &&
        (financeLoading && !financeData ? (
          <BrandLoader label="Loading your finances" />
        ) : (
          <FreelanceFinance
            data={financeData}
            role={role}
            escrowHeld={clientOrders
              .filter((order) => order.escrowStatus === 'held')
              .reduce((sum, order) => sum + order.agreedPriceBDT, 0)}
            amount={withdrawAmount}
            setAmount={setWithdrawAmount}
            note={withdrawNote}
            setNote={setWithdrawNote}
            submitting={financeSubmitting}
            onWithdraw={() => void submitWithdrawal()}
            onInvoice={setSelectedInvoice}
            onRefresh={() => void loadFinance()}
          />
        ))}

      <details className="freelance-how-it-works" id="freelance-how-it-works">
        <summary>
          <ShieldCheck size={17} />
          How projects and payment protection work
        </summary>
        <div>
          <p>
            <strong>Payment protection.</strong> Client payments are held in escrow and released
            after satisfactory delivery is confirmed.
          </p>
          <p>
            <strong>Verified work history.</strong> Both sides can leave a review after completion.
          </p>
          <p>
            <strong>Portfolio progress.</strong> Completed work contributes to the student
            portfolio, Opportunity Score, and graduation report.
          </p>
        </div>
      </details>
      <ModalFrame
        open={Boolean(detailListing)}
        onClose={() => setDetailListing(null)}
        title={detailListing?.title || 'Service details'}
        subtitle="Find the right fit for your project."
        width={1080}
      >
        {detailListing && (
          <FreelanceServiceDetail
            listing={detailListing}
            onEdit={() => {
              openEditListingModal(detailListing);
              setDetailListing(null);
            }}
            onQuote={() => {
              setFlash(null);
              startOrderComposer(detailListing);
              setDetailListing(null);
            }}
          />
        )}
      </ModalFrame>
      <ModalFrame
        open={listingEditorOpen}
        onClose={() => {
          if (!submitting) setListingEditorOpen(false);
        }}
        title={editingListing ? 'Refine your service' : 'Create your next opportunity'}
        subtitle="A clear offer is the beginning of a great collaboration."
        width={1040}
        notice={flash}
      >
        <FreelanceServiceEditor
          form={listingForm}
          setForm={setListingForm}
          editing={Boolean(editingListing)}
          submitting={submitting}
          uploading={sampleUploading}
          onUpload={(files) => uploadAssets('sample', files)}
          onSubmit={() => void submitListing()}
          onCancel={() => setListingEditorOpen(false)}
        />
      </ModalFrame>
      <ModalFrame
        open={Boolean(orderComposerListing)}
        onClose={() => {
          if (!submitting) setOrderComposerListing(null);
        }}
        title="Start with a quote"
        subtitle={orderComposerListing?.title}
        width={1040}
        notice={flash}
      >
        {orderComposerListing && (
          <FreelanceQuoteComposer
            listing={orderComposerListing}
            requirements={requirementsText}
            setRequirements={setRequirementsText}
            files={requirementFiles}
            setFiles={setRequirementFiles}
            rate={orderQuotedRate}
            setRate={setOrderQuotedRate}
            hours={orderQuotedHours}
            setHours={setOrderQuotedHours}
            note={orderProposalNote}
            setNote={setOrderProposalNote}
            method={orderPaymentMethod}
            setMethod={setOrderPaymentMethod}
            uploading={requirementUploading}
            submitting={submitting}
            onUpload={(files) => uploadAssets('requirements', files)}
            onSubmit={() => void submitOrder()}
            onCancel={() => setOrderComposerListing(null)}
          />
        )}
      </ModalFrame>
      <ModalFrame
        open={orderModalOpen}
        width={860}
        onClose={() => {
          setOrderModalOpen(false);
          setSelectedOrder(null);
          setSelectedOrderPerspective(null);
          setSelectedOrderReviews([]);
        }}
        notice={flash}
        title={selectedOrder ? selectedOrder.listing.title : 'Order Workspace'}
        subtitle="Review requirements, delivery files, verified reviews, and escrow status in one place."
      >
        {orderDetailLoading || !selectedOrder ? (
          <BrandLoader variant="section" label="Loading order workspace" />
        ) : (
          <>
            <OrderProgress order={selectedOrder} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 12,
                marginBottom: 18,
              }}
              className="freelance-modal-grid"
            >
              <OrderMetric
                label="Order status"
                value={<StatusPill value={selectedOrder.status} />}
              />
              <OrderMetric
                label="Quote status"
                value={<StatusPill value={selectedOrder.proposalStatus} />}
              />
              <OrderMetric
                label="Escrow"
                value={<StatusPill value={selectedOrder.escrowStatus} />}
              />
              <OrderMetric
                label="Quote total"
                value={<span>{formatMoney(selectedOrder.agreedPriceBDT)}</span>}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: 16,
              }}
              className="freelance-order-layout"
            >
              <div>
                <div className="market-segments market-order-tabs" aria-label="Project information">
                  {[
                    ['brief', 'Project brief'],
                    ['delivery', 'Delivery files'],
                    ['reviews', 'Reviews'],
                  ].map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      aria-pressed={orderPanel === key}
                      onClick={() => setOrderPanel(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {orderPanel === 'brief' && (
                  <div style={orderBlockStyle}>
                    <div style={orderBlockHeaderStyle}>
                      <div>
                        <div style={orderBlockTitleStyle}>Requirements</div>
                        <div style={orderBlockCopyStyle}>
                          Buyer notes, scope, and reference files shared before the order started.
                        </div>
                      </div>
                    </div>
                    <p style={orderParagraphStyle}>{selectedOrder.requirements}</p>
                    <AssetList assets={selectedOrder.requirementsFiles} tone="neutral" />
                  </div>
                )}
                {orderPanel === 'delivery' && (
                  <div style={orderBlockStyle}>
                    <div style={orderBlockHeaderStyle}>
                      <div>
                        <div style={orderBlockTitleStyle}>Delivery</div>
                        <div style={orderBlockCopyStyle}>
                          Final work, revision submissions, or the current delivery package.
                        </div>
                      </div>
                    </div>
                    {selectedOrder.deliveryNote ? (
                      <p style={orderParagraphStyle}>{selectedOrder.deliveryNote}</p>
                    ) : (
                      <div style={{ color: C.textLight, fontSize: 13 }}>
                        No delivery note uploaded yet.
                      </div>
                    )}
                    <AssetList assets={selectedOrder.deliveryFiles} tone="blue" />
                  </div>
                )}
                {orderPanel === 'reviews' && (
                  <div style={orderBlockStyle}>
                    <div style={orderBlockHeaderStyle}>
                      <div>
                        <div style={orderBlockTitleStyle}>Verified Reviews</div>
                        <div style={orderBlockCopyStyle}>
                          Reviews are unlocked after escrow release and permanently linked to this
                          order.
                        </div>
                      </div>
                    </div>
                    {selectedOrderReviews.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {selectedOrderReviews.map((review) => (
                          <div
                            key={review._id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: 12,
                              background: '#f6f8f9',
                              border: `1px solid ${C.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                flexWrap: 'wrap',
                                marginBottom: 8,
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                  {review.reviewer?.companyName ||
                                    review.reviewer?.name ||
                                    'Verified user'}
                                </div>
                                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                                  {review.reviewType === 'client_to_student'
                                    ? 'Client to freelancer review'
                                    : 'Freelancer to client review'}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  background: C.amberBg,
                                  border: `1px solid ${C.amberBorder}`,
                                  color: '#D97706',
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                <Star size={14} fill="#F59E0B" />
                                {getReviewAverage(review).toFixed(1)}
                              </div>
                            </div>
                            {review.comment ? (
                              <p
                                style={{
                                  margin: '0 0 8px',
                                  color: C.textMuted,
                                  fontSize: 13,
                                  lineHeight: 1.7,
                                }}
                              >
                                {review.comment}
                              </p>
                            ) : null}
                            {review.recommendationText ? (
                              <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>
                                <strong>Recommendation:</strong> {review.recommendationText}
                              </div>
                            ) : null}
                            <div style={{ fontSize: 11, color: C.textLight, marginTop: 8 }}>
                              Added {formatDate(review.createdAt, true)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: C.textLight, fontSize: 13 }}>
                        Verified reviews will appear here after both sides submit them.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={orderBlockStyle}>
                  <div style={orderBlockTitleStyle}>Order Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                    <OrderSummaryRow
                      label="Freelancer"
                      value={selectedOrder.freelancer.name}
                      sublabel={
                        [selectedOrder.freelancer.university, selectedOrder.freelancer.department]
                          .filter(Boolean)
                          .join(' • ') || undefined
                      }
                    />
                    <OrderSummaryRow
                      label="Client"
                      value={selectedOrder.client.companyName || selectedOrder.client.name}
                    />
                    <OrderSummaryRow
                      label={selectedOrder.priceType === 'hourly' ? 'Agreed quote' : 'Quoted price'}
                      value={quoteLabel(selectedOrder)}
                      sublabel={
                        selectedOrder.priceType === 'hourly'
                          ? `Total ${formatMoney(selectedOrder.agreedPriceBDT)}`
                          : 'Freelancer can counter before acceptance'
                      }
                    />
                    <OrderSummaryRow label="Due date" value={formatDate(selectedOrder.dueDate)} />
                    <OrderSummaryRow
                      label="Payment method"
                      value={
                        selectedOrder.paymentMethod
                          ? formatStatus(selectedOrder.paymentMethod)
                          : 'Not set'
                      }
                    />
                    <OrderSummaryRow
                      label="Client total"
                      value={formatMoney(selectedOrder.agreedPriceBDT)}
                      sublabel="Amount funded into Nextern escrow"
                    />
                    <OrderSummaryRow
                      label="Platform fee"
                      value={formatMoney(selectedOrder.nexternCutBDT)}
                      sublabel={`${Math.round(FREELANCE_PLATFORM_FEE_RATE * 100)}% retained before freelancer payout`}
                    />
                    <OrderSummaryRow
                      label="Escrow payout"
                      value={formatMoney(selectedOrder.freelancerPayoutBDT)}
                      sublabel="Released after approval"
                    />
                    <OrderSummaryRow
                      label="Latest offer from"
                      value={formatStatus(selectedOrder.latestOfferBy)}
                    />
                    <OrderSummaryRow
                      label="Revision count"
                      value={String(selectedOrder.revisionCount)}
                    />
                    {selectedOrder.proposalNote ? (
                      <OrderSummaryRow
                        label="Quote note"
                        value={selectedOrder.proposalNote}
                        sublabel="Latest negotiation note"
                      />
                    ) : null}
                    {selectedOrder.adminNote ? (
                      <OrderSummaryRow
                        label="Nextern note"
                        value={selectedOrder.adminNote}
                        sublabel="Visible to both client and freelancer"
                      />
                    ) : null}
                  </div>
                  {selectedOrder.negotiationHistory.length ? (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ ...orderBlockTitleStyle, fontSize: 14 }}>Quote history</div>
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}
                      >
                        {selectedOrder.negotiationHistory
                          .slice()
                          .reverse()
                          .map((entry, index) => (
                            <div
                              key={`${entry.createdAt ?? 'history'}-${index}`}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: '#f6f8f9',
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  flexWrap: 'wrap',
                                  marginBottom: 6,
                                }}
                              >
                                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                                  {formatStatus(entry.by)} · {formatStatus(entry.action)}
                                </span>
                                <span style={{ fontSize: 11, color: C.textLight }}>
                                  {formatDate(entry.createdAt, true)}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                                {selectedOrder.priceType === 'hourly'
                                  ? `${formatMoney(entry.rateBDT)}/hr x ${entry.hours ?? 1}h = ${formatMoney(entry.totalBDT)}`
                                  : formatMoney(entry.totalBDT)}
                              </div>
                              {entry.note ? (
                                <div
                                  style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    color: C.textMuted,
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {entry.note}
                                </div>
                              ) : null}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {proposalWaitingFor(selectedOrder, selectedOrderPerspective) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>
                      {selectedOrder.latestOfferBy === 'client'
                        ? 'Review Client Quote Request'
                        : 'Review Freelancer Counter-Offer'}
                    </div>
                    <p style={orderBlockCopyStyle}>
                      Accept the current quote, send a counter, or decline the request. Escrow
                      payment unlocks only after acceptance.
                    </p>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#f6f8f9',
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textMuted,
                      }}
                    >
                      Current quote:{' '}
                      <strong style={{ color: C.text }}>{quoteLabel(selectedOrder)}</strong>
                      {selectedOrder.priceType === 'hourly' ? (
                        <span style={{ color: C.textLight }}>
                          {' '}
                          · Total {formatMoney(selectedOrder.agreedPriceBDT)}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          selectedOrder.priceType === 'hourly'
                            ? 'repeat(3, minmax(0, 1fr))'
                            : 'repeat(2, minmax(0, 1fr))',
                        gap: 10,
                      }}
                      className="freelance-modal-grid"
                    >
                      <div>
                        <label style={fieldLabelStyle}>
                          {selectedOrder.priceType === 'hourly'
                            ? 'Counter hourly rate'
                            : 'Counter total'}
                        </label>
                        <input
                          value={proposalResponseRate}
                          onChange={(event) => setProposalResponseRate(event.target.value)}
                          inputMode="numeric"
                          style={fieldInputStyle}
                        />
                      </div>
                      {selectedOrder.priceType === 'hourly' ? (
                        <div>
                          <label style={fieldLabelStyle}>Counter hours</label>
                          <input
                            value={proposalResponseHours}
                            onChange={(event) => setProposalResponseHours(event.target.value)}
                            inputMode="numeric"
                            style={fieldInputStyle}
                          />
                        </div>
                      ) : null}
                      <div>
                        <label style={fieldLabelStyle}>Counter total</label>
                        <div
                          style={{
                            ...fieldInputStyle,
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 700,
                            background: '#f6f8f9',
                            color: C.text,
                          }}
                        >
                          {selectedOrderCounterQuote
                            ? formatMoney(selectedOrderCounterQuote.totalBDT)
                            : formatMoney(selectedOrder.agreedPriceBDT)}
                        </div>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={proposalResponseNote}
                      onChange={(event) => setProposalResponseNote(event.target.value)}
                      placeholder="Optional: explain your acceptance, counter, or reason for declining."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('accept_proposal')}
                        style={primaryButtonStyle}
                      >
                        <CheckCircle2 size={14} />
                        Accept Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('counter_proposal')}
                        style={ghostButtonStyle}
                      >
                        <RefreshCw size={14} />
                        Send Counter
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('reject_proposal')}
                        style={dangerButtonStyle}
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : null}

                {['requested', 'countered'].includes(selectedOrder.proposalStatus) &&
                !proposalWaitingFor(selectedOrder, selectedOrderPerspective) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Waiting on the other party</div>
                    <p style={orderBlockCopyStyle}>
                      Your latest quote is pending a response. Once it is accepted, the order chat
                      unlocks and the client can fund escrow.
                    </p>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#f6f8f9',
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textMuted,
                      }}
                    >
                      Latest quote:{' '}
                      <strong style={{ color: C.text }}>{quoteLabel(selectedOrder)}</strong>
                    </div>
                    {selectedOrderPerspective === 'client' ? (
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('cancel')}
                        style={dangerButtonStyle}
                      >
                        <X size={14} />
                        Withdraw Request
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {selectedOrder.proposalStatus === 'accepted' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Freelance Chat</div>
                    <p style={orderBlockCopyStyle}>
                      Use the dedicated order chat for scope clarification, file follow-ups, and
                      delivery coordination until the order is closed.
                    </p>
                    <button
                      type="button"
                      onClick={() => openFreelanceChat(selectedOrder._id)}
                      style={ghostButtonStyle}
                    >
                      <ArrowRight size={14} />
                      Open Order Chat
                    </button>
                  </div>
                ) : null}

                {selectedOrderPerspective === 'client' &&
                selectedOrder.proposalStatus === 'accepted' &&
                selectedOrder.status === 'pending' &&
                selectedOrder.escrowStatus === 'pending_payment' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Fund Escrow</div>
                    <p style={orderBlockCopyStyle}>
                      The quote is accepted. Pay now so the freelancer can begin and the money moves
                      into Nextern escrow.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() =>
                          selectedOrder.paymentMethod === 'bkash'
                            ? void startBkashPayment(selectedOrder._id)
                            : void startCardPayment(selectedOrder)
                        }
                        style={primaryButtonStyle}
                      >
                        <Wallet size={14} />
                        Pay Now
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('cancel')}
                        style={dangerButtonStyle}
                      >
                        <X size={14} />
                        Cancel Unpaid Order
                      </button>
                    </div>
                  </div>
                ) : null}

                {(selectedOrder.status === 'in_progress' ||
                  selectedOrder.status === 'revision_requested') &&
                selectedOrderPerspective === 'freelancer' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Submit Delivery</div>
                    <p style={orderBlockCopyStyle}>
                      Upload the finished work package. The client will review it before approving
                      escrow release.
                    </p>
                    <textarea
                      rows={4}
                      value={deliveryNote}
                      onChange={(event) => setDeliveryNote(event.target.value)}
                      placeholder="Summarize what you delivered, mention included files, and explain any implementation notes."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 110 }}
                    />
                    <label style={uploadButtonStyle}>
                      <Upload size={14} />
                      {deliveryUploading ? 'Uploading files...' : 'Upload delivery files'}
                      <input
                        type="file"
                        multiple
                        hidden
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const files = Array.from(input.files ?? []);
                          if (!files.length) return;
                          input.value = '';
                          const uploaded = await uploadAssets('delivery', files);
                          setDeliveryFiles((current) => [...current, ...uploaded].slice(0, 8));
                        }}
                      />
                    </label>
                    <AssetList
                      assets={deliveryFiles}
                      tone="blue"
                      removable
                      onRemove={(index) =>
                        setDeliveryFiles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => void submitOrderAction('deliver')}
                      style={primaryButtonStyle}
                    >
                      <CheckCircle2 size={14} />
                      Submit Delivery
                    </button>
                  </div>
                ) : null}

                {selectedOrderPerspective === 'client' && selectedOrder.status === 'delivered' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Client Review Decision</div>
                    <p style={orderBlockCopyStyle}>
                      Review the delivery and either request a revision or confirm completion to
                      release the escrow payout.
                    </p>
                    <textarea
                      rows={3}
                      value={revisionNote}
                      onChange={(event) => setRevisionNote(event.target.value)}
                      placeholder="Optional note for revision requests or final approval context."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('request_revision')}
                        style={ghostButtonStyle}
                      >
                        <RefreshCw size={14} />
                        Request Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('confirm_completion')}
                        style={primaryButtonStyle}
                      >
                        <ShieldCheck size={14} />
                        Confirm Completion
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedOrder.escrowStatus === 'held' &&
                ['in_progress', 'revision_requested', 'delivered'].includes(
                  selectedOrder.status
                ) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Escrow Dispute</div>
                    <p style={orderBlockCopyStyle}>
                      Open a dispute only when there is a serious delivery or scope conflict.
                      Nextern can review the payment hold, files, and notes.
                    </p>
                    <textarea
                      rows={3}
                      value={disputeNote}
                      onChange={(event) => setDisputeNote(event.target.value)}
                      placeholder="Explain the dispute clearly so Nextern has enough context."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
                    />
                    <button
                      type="button"
                      onClick={() => void submitOrderAction('mark_disputed')}
                      style={dangerButtonStyle}
                    >
                      <AlertCircle size={14} />
                      Mark as Disputed
                    </button>
                  </div>
                ) : null}

                {selectedOrderPerspective === 'client' &&
                selectedOrder.status === 'completed' &&
                selectedOrder.escrowStatus === 'released' &&
                !selectedOrder.clientReviewSubmitted ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Leave Client-to-Freelancer Review</div>
                    <ReviewComposer
                      kind="client_to_student"
                      draft={clientReviewDraft}
                      setDraft={setClientReviewDraft}
                      onSubmit={() => void submitReview('client_to_student')}
                      submitting={submitting}
                    />
                  </div>
                ) : null}

                {selectedOrderPerspective === 'freelancer' &&
                selectedOrder.status === 'completed' &&
                selectedOrder.escrowStatus === 'released' &&
                !selectedOrder.freelancerReviewSubmitted ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Leave Freelancer-to-Client Review</div>
                    <ReviewComposer
                      kind="student_to_client"
                      draft={freelancerReviewDraft}
                      setDraft={setFreelancerReviewDraft}
                      onSubmit={() => void submitReview('student_to_client')}
                      submitting={submitting}
                    />
                  </div>
                ) : null}

                {selectedOrder.status === 'completed' &&
                selectedOrder.escrowStatus === 'released' &&
                selectedOrder.clientReviewSubmitted &&
                (selectedOrderPerspective !== 'freelancer' ||
                  selectedOrder.freelancerReviewSubmitted) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Verified Completion Locked</div>
                    <p style={orderBlockCopyStyle}>
                      This order is fully completed. The delivery is recorded in verified work
                      history, and the student portfolio sample has already been synced.
                    </p>
                    {role === 'student' ? (
                      <Link
                        href="/student/resume"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          color: C.blue,
                          textDecoration: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Open Portfolio Builder
                        <ArrowRight size={14} />
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </ModalFrame>
      <ModalFrame
        open={Boolean(selectedInvoice)}
        width={820}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice'}
        subtitle={
          selectedInvoice?.perspective === 'freelancer'
            ? 'Professional invoice record for freelance delivery, escrow release, and net payout breakdown.'
            : 'Professional invoice record for freelance scope, escrow handling, and client payment confirmation.'
        }
      >
        {selectedInvoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              className="nx-surface"
              style={{
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: '#FFFFFF',
                padding: 22,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: C.blueLight,
                      border: `1px solid ${C.blueBorder}`,
                      color: C.blue,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    <ReceiptText size={13} />
                    Verified freelance invoice
                  </div>
                  <h3
                    style={{
                      margin: '12px 0 0',
                      fontSize: 24,
                      fontWeight: 750,
                      color: C.text,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {selectedInvoice.listingTitle}
                  </h3>
                  <p
                    style={{ margin: '8px 0 0', color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}
                  >
                    {selectedInvoice.counterpartyRole}: {selectedInvoice.counterpartyName}
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
                  <StatusPill value={selectedInvoice.status} />
                  <div
                    style={{
                      fontSize: 28,
                      color: C.text,
                      fontWeight: 750,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {formatMoney(selectedInvoice.clientTotalBDT)}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Invoice total</div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 12,
              }}
              className="freelance-modal-grid"
            >
              <OrderMetric label="Invoice no." value={selectedInvoice.invoiceNumber} />
              <OrderMetric label="Issued" value={formatDate(selectedInvoice.issuedAt)} />
              <OrderMetric
                label="Payment method"
                value={
                  selectedInvoice.paymentMethod
                    ? formatStatus(selectedInvoice.paymentMethod)
                    : 'Pending'
                }
              />
              <OrderMetric
                label="Escrow"
                value={<StatusPill value={selectedInvoice.escrowStatus} />}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: 16,
              }}
              className="freelance-modal-grid"
            >
              <div style={orderBlockStyle}>
                <div style={orderBlockHeaderStyle}>
                  <div>
                    <div style={orderBlockTitleStyle}>Invoice breakdown</div>
                    <div style={orderBlockCopyStyle}>
                      {selectedInvoice.perspective === 'freelancer'
                        ? 'Pricing structure, platform fee deduction, and payout logic stored against this freelance order.'
                        : 'Pricing structure and escrow-covered client payment stored against this freelance order.'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedInvoice.lineItems.map((line) => (
                    <div
                      key={line.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        paddingBottom: 12,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ fontSize: 13, color: C.text }}>{line.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {formatMoney(line.amountBDT)}
                      </div>
                    </div>
                  ))}
                  {selectedInvoice.perspective === 'freelancer' &&
                  selectedInvoice.platformFeeRate !== null &&
                  selectedInvoice.platformFeeBDT !== null ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 13, color: C.textMuted }}>
                        Nextern platform fee ({Math.round(selectedInvoice.platformFeeRate * 100)}%)
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#B45309' }}>
                        {formatMoney(selectedInvoice.platformFeeBDT)}
                      </div>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingTop: 14,
                      borderTop: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      {selectedInvoice.perspective === 'freelancer'
                        ? 'Client total'
                        : 'Escrow amount'}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 750, color: C.text }}>
                      {formatMoney(selectedInvoice.clientTotalBDT)}
                    </div>
                  </div>
                  {selectedInvoice.perspective === 'freelancer' &&
                  selectedInvoice.freelancerNetBDT !== null ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        Freelancer net
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 750, color: C.teal }}>
                        {formatMoney(selectedInvoice.freelancerNetBDT)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={orderBlockStyle}>
                <div style={orderBlockHeaderStyle}>
                  <div>
                    <div style={orderBlockTitleStyle}>Order timeline</div>
                    <div style={orderBlockCopyStyle}>
                      Key moments tied to this invoice and escrow record.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <OrderSummaryRow
                    label="Due date"
                    value={formatDate(selectedInvoice.dueDate)}
                    sublabel="Original delivery promise from the service package"
                  />
                  <OrderSummaryRow
                    label="Delivered"
                    value={formatDate(selectedInvoice.deliveredAt)}
                    sublabel="When the latest delivery package was submitted"
                  />
                  <OrderSummaryRow
                    label="Completed"
                    value={formatDate(selectedInvoice.completedAt)}
                    sublabel="Client confirmation timestamp"
                  />
                  <OrderSummaryRow
                    label="Released"
                    value={formatDate(selectedInvoice.releasedAt)}
                    sublabel="When payout moved out of escrow"
                  />
                </div>
              </div>
            </div>

            <div style={actionPanelStyle}>
              <div style={orderBlockTitleStyle}>Invoice note</div>
              <p style={{ ...orderBlockCopyStyle, marginTop: 8 }}>{selectedInvoice.notes}</p>
            </div>
          </div>
        ) : null}
      </ModalFrame>
      <FreelanceStripeCheckoutModal
        open={Boolean(pendingCardCheckout)}
        role={role}
        orderId={pendingCardCheckout?.orderId ?? ''}
        title={pendingCardCheckout?.title ?? 'Freelance escrow'}
        amount={pendingCardCheckout?.amount ?? 0}
        method={pendingCardCheckout?.method ?? 'visa'}
        onClose={() => setPendingCardCheckout(null)}
      />

      <style>{`
          .freelance-spin {
            animation: freelance-spin 0.9s linear infinite;
          }

          @keyframes freelance-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1100px) {
            .freelance-order-layout {
              grid-template-columns: 1fr !important;
            }

            .freelance-card-grid,
            .freelance-info-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 860px) {
            .freelance-card-grid,
            .freelance-info-grid,
            .freelance-filter-grid,
            .freelance-modal-grid,
            .freelance-method-grid,
            .freelance-service-row {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-label={`${label}: ${score} out of 5`}
            aria-pressed={score === value}
            onClick={() => onChange(score)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: `1px solid ${score <= value ? C.amberBorder : C.border}`,
              background: score <= value ? C.amberBg : '#FFFFFF',
              color: score <= value ? '#D97706' : C.textLight,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={14} fill={score <= value ? '#F59E0B' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ModalFrame({
  open,
  width = 760,
  notice,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  width?: number;
  notice?: { tone: string; text: string } | null;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useDialog(open, onClose);
  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        background: 'rgba(15,23,42,0.64)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="freelance-dialog market-dialog"
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '88vh',
          overflow: 'auto',
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          boxShadow: '0 32px 90px rgba(15,23,42,0.22)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p className="market-dialog-brand">NEXTERN FREELANCING</p>
            <h3
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 750,
                color: C.text,
                fontFamily: 'var(--font-display)',
              }}
            >
              {title}
            </h3>
            {subtitle ? (
              <p style={{ margin: '6px 0 0', color: C.textMuted, fontSize: 13 }}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: '#FFFFFF',
              color: C.textMuted,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="market-dialog-content" style={{ padding: 24 }}>
          {notice?.tone === 'error' && (
            <p role="alert" className="market-error">
              {notice.text}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function OrderCard({
  order,
  role,
  mode,
  onOpen,
  onPayNow,
}: {
  order: OrderSummary;
  role: WorkspaceRole;
  mode: 'client' | 'freelancer';
  onOpen: () => void;
  onPayNow?: () => void;
}) {
  const waiting = proposalWaitingFor(order, mode);
  return (
    <article className="market-project-card">
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusPill
            value={
              ['requested', 'countered'].includes(order.proposalStatus)
                ? order.proposalStatus
                : order.status
            }
          />
          {waiting && <span className="market-response-needed">Your reply is needed</span>}
        </div>
        <h3>{order.listing.title}</h3>
        <p>{shortenText(order.requirements, 160)}</p>
        <div className="market-project-meta">
          <span>
            {mode === 'client'
              ? 'Freelancer: ' + order.freelancer.name
              : 'Client: ' + (order.client.companyName || order.client.name)}
          </span>
          {order.dueDate && <span>Due {formatDate(order.dueDate)}</span>}
          <span>Escrow: {formatStatus(order.escrowStatus)}</span>
          {order.revisionCount > 0 && (
            <span>
              {order.revisionCount} revision{order.revisionCount === 1 ? '' : 's'}
            </span>
          )}
          {role === 'student' && mode === 'freelancer' && order.status === 'completed' && (
            <span>
              <BadgeCheck size={13} />
              Portfolio synced
            </span>
          )}
        </div>
      </div>
      <aside>
        <small>{order.priceType === 'hourly' ? quoteLabel(order) : 'Project total'}</small>
        <strong>{formatMoney(order.agreedPriceBDT)}</strong>
        {order.proposalStatus === 'accepted' &&
          order.status === 'pending' &&
          order.escrowStatus === 'pending_payment' &&
          onPayNow && (
            <button className="market-button" onClick={onPayNow}>
              <Wallet size={15} />
              Fund order
            </button>
          )}
        <button className="market-button-secondary" onClick={onOpen}>
          {waiting ? 'Review proposal' : 'Open project'}
          <ArrowRight size={16} />
        </button>
      </aside>
    </article>
  );
}

function ReviewComposer({
  kind,
  draft,
  setDraft,
  onSubmit,
  submitting,
}: {
  kind: 'client_to_student' | 'student_to_client';
  draft: ReviewDraftState;
  setDraft: Dispatch<SetStateAction<ReviewDraftState>>;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {kind === 'client_to_student' ? (
        <>
          <RatingRow
            label="Professionalism"
            value={draft.professionalismRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, professionalismRating: value }))
            }
          />
          <RatingRow
            label="Punctuality"
            value={draft.punctualityRating}
            onChange={(value) => setDraft((current) => ({ ...current, punctualityRating: value }))}
          />
          <RatingRow
            label="Skill performance"
            value={draft.skillPerformanceRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, skillPerformanceRating: value }))
            }
          />
          <RatingRow
            label="Work quality"
            value={draft.workQualityRating}
            onChange={(value) => setDraft((current) => ({ ...current, workQualityRating: value }))}
          />
        </>
      ) : (
        <>
          <RatingRow
            label="Overall experience"
            value={draft.overallRating}
            onChange={(value) => setDraft((current) => ({ ...current, overallRating: value }))}
          />
          <RatingRow
            label="Communication"
            value={draft.communicationRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, communicationRating: value }))
            }
          />
          <RatingRow
            label="Requirements clarity"
            value={draft.requirementsClarityRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, requirementsClarityRating: value }))
            }
          />
          <RatingRow
            label="Payment promptness"
            value={draft.paymentPromptnessRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, paymentPromptnessRating: value }))
            }
          />
        </>
      )}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
        }}
      >
        <input
          type="checkbox"
          checked={draft.isRecommended}
          onChange={(event) =>
            setDraft((current) => ({ ...current, isRecommended: event.target.checked }))
          }
        />
        I recommend this {kind === 'client_to_student' ? 'freelancer' : 'client'}
      </label>

      <textarea
        rows={3}
        value={draft.comment}
        onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))}
        placeholder="Share the verified experience, strengths, and any delivery highlights."
        style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
      />
      <textarea
        rows={3}
        value={draft.recommendationText}
        onChange={(event) =>
          setDraft((current) => ({ ...current, recommendationText: event.target.value }))
        }
        placeholder="Optional recommendation note that becomes part of the verified work history."
        style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
      />
      <button type="button" onClick={onSubmit} style={primaryButtonStyle} disabled={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="freelance-spin" size={14} />
            Submitting...
          </>
        ) : (
          <>
            <Star size={14} />
            Submit Verified Review
          </>
        )}
      </button>
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: '#f6f8f9',
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, color: C.text, fontSize: 13, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function OrderSummaryRow({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div>
      <div
        style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div style={{ marginTop: 5, color: C.text, fontSize: 13, fontWeight: 700 }}>{value}</div>
      {sublabel ? (
        <div style={{ marginTop: 3, color: C.textMuted, fontSize: 12 }}>{sublabel}</div>
      ) : null}
    </div>
  );
}

const fieldLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  color: C.text,
  fontSize: 13,
  fontWeight: 700,
};

const fieldInputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  fontSize: 13,
  color: C.text,
  fontFamily: 'var(--font-body)',
  background: '#FFFFFF',
};

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 12,
  border: 'none',
  background: C.blue,
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const ghostButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: '#FFFFFF',
  color: C.text,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const dangerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 12,
  border: `1px solid ${C.dangerBorder}`,
  background: C.dangerBg,
  color: C.danger,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const uploadButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 12,
  background: '#FFFFFF',
  border: `1px solid ${C.blueBorder}`,
  color: C.blue,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const orderBlockStyle: CSSProperties = {
  padding: '18px 20px',
  borderRadius: 12,
  background: '#FFFFFF',
  border: `1px solid ${C.border}`,
  boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
};

const actionPanelStyle: CSSProperties = {
  padding: '18px 20px',
  borderRadius: 12,
  background: '#f6f8f9',
  border: `1px solid ${C.border}`,
};

const orderBlockHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
};

const orderBlockTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: C.text,
  fontFamily: 'var(--font-display)',
};

const orderBlockCopyStyle: CSSProperties = {
  fontSize: 12,
  color: C.textMuted,
  lineHeight: 1.65,
  marginTop: 6,
};

const orderParagraphStyle: CSSProperties = {
  margin: '0 0 12px',
  color: C.textMuted,
  fontSize: 13,
  lineHeight: 1.75,
};
