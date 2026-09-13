import { FREELANCE_CATEGORIES } from '@/lib/freelance-shared';

export type MarketplaceFilters = {
  search: string;
  category: string;
  skill: string;
  minBudget: string;
  maxBudget: string;
  priceType: string;
  maxDeliveryDays: string;
  sort: string;
};
export const EMPTY_MARKETPLACE_FILTERS: MarketplaceFilters = {
  search: '',
  category: '',
  skill: '',
  minBudget: '',
  maxBudget: '',
  priceType: '',
  maxDeliveryDays: '',
  sort: '',
};
export const formatMarketMoney = (value: number) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value || 0);
export const categoryLabel = (id: string) =>
  FREELANCE_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';
