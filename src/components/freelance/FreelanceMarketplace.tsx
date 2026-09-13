'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { FREELANCE_CATEGORIES } from '@/lib/freelance-shared';
import BrandLoader from '@/components/ui/BrandLoader';
import PaginationControls from '@/components/ui/PaginationControls';
import type { Listing } from './freelance-types';
import { CategoryIcon } from './MarketplaceIdentity';
import {
  categoryLabel,
  EMPTY_MARKETPLACE_FILTERS,
  formatMarketMoney,
  type MarketplaceFilters,
} from './marketplace-utils';

export function FreelancerIdentity({
  listing,
  large = false,
}: {
  listing: Listing;
  large?: boolean;
}) {
  const person = listing.freelancer;
  return (
    <div className={`market-person ${large ? 'market-person-large' : ''}`}>
      {person.image ? (
        <Image width={48} height={48} unoptimized src={person.image} alt="" loading="lazy" />
      ) : (
        <span className="market-avatar" aria-hidden="true">
          {person.name
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')}
        </span>
      )}
      <div>
        <strong>
          {person.name}
          {person.hasVerifiedFreelancerBadge && (
            <BadgeCheck size={16} aria-label="Verified Freelancer" />
          )}
        </strong>
        <span>
          {person.university || 'Student freelancer'}
          {large && person.department ? ` · ${person.department}` : ''}
        </span>
      </div>
    </div>
  );
}

export function ServiceCard({ listing, onOpen }: { listing: Listing; onOpen: () => void }) {
  const cover = listing.sampleFiles.find(
    (file) => file.type.startsWith('image/') || /\.(png|jpe?g|webp)(\?|$)/i.test(file.url)
  );
  return (
    <article className="market-service">
      <button
        className={`market-service-cover market-tone-${listing.category}`}
        onClick={onOpen}
        aria-label={`View ${listing.title}`}
      >
        {cover ? (
          <Image
            width={640}
            height={360}
            unoptimized
            src={cover.url}
            alt={`Sample work for ${listing.title}`}
            loading="lazy"
          />
        ) : (
          <>
            <CategoryIcon category={listing.category} size={42} />
            <span>{categoryLabel(listing.category)}</span>
          </>
        )}
        {listing.canEdit && <small>Your service</small>}
      </button>
      <div className="market-service-body">
        <FreelancerIdentity listing={listing} />
        <h3>
          <button onClick={onOpen}>{listing.title}</button>
        </h3>
        <p>{listing.description}</p>
        <div className="market-card-skills">
          {listing.skills.slice(0, 3).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
          {listing.skills.length > 3 && <span>+{listing.skills.length - 3}</span>}
        </div>
        <div className="market-card-proof">
          <span>
            <Star size={14} />
            {listing.averageRating ? (
              <>
                <strong>{listing.averageRating.toFixed(1)}</strong> rating
              </>
            ) : (
              'New service'
            )}
          </span>
          <span>
            <Clock3 size={14} />
            {listing.deliveryDays} day{listing.deliveryDays === 1 ? '' : 's'}
          </span>
        </div>
        <footer>
          <div>
            <small>{listing.priceType === 'hourly' ? 'Hourly rate' : 'Fixed price'}</small>
            <strong>
              {formatMarketMoney(listing.priceBDT)}
              {listing.priceType === 'hourly' && <small> / hr</small>}
            </strong>
          </div>
          <button onClick={onOpen} aria-label={`View service: ${listing.title}`}>
            <ArrowRight size={19} />
          </button>
        </footer>
      </div>
    </article>
  );
}

type Props = {
  listings: Listing[];
  total: number;
  loading: boolean;
  filters: MarketplaceFilters;
  onApply: (filters: MarketplaceFilters) => void;
  onOpen: (listing: Listing) => void;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
};

export default function FreelanceMarketplace({
  listings,
  total,
  loading,
  filters,
  onApply,
  onOpen,
  page,
  pageSize,
  onPage,
  onPageSize,
}: Props) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  useEffect(() => {
    setFiltersOpen(!window.matchMedia('(max-width: 900px)').matches);
  }, []);
  useEffect(() => {
    setDraft(filters);
  }, [filters]);
  const update = (key: keyof MarketplaceFilters, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const apply = (next = draft) => {
    if (next.minBudget && next.maxBudget && Number(next.minBudget) > Number(next.maxBudget)) {
      setError('The maximum price must be at least the minimum price.');
      return;
    }
    setError('');
    onApply(next);
  };
  const active = Object.entries(filters).filter(([key, value]) => value && key !== 'sort') as [
    keyof MarketplaceFilters,
    string,
  ][];
  const chipLabel = (key: keyof MarketplaceFilters, value: string) => {
    if (key === 'category') return categoryLabel(value);
    if (key === 'minBudget') return `From ${formatMarketMoney(Number(value))}`;
    if (key === 'maxBudget') return `Up to ${formatMarketMoney(Number(value))}`;
    if (key === 'maxDeliveryDays') return `Within ${value} days`;
    if (key === 'priceType') return value === 'fixed' ? 'Fixed price' : 'Hourly';
    return value;
  };
  return (
    <section className="market-discovery" aria-label="Discover freelance services">
      <form
        className="market-search"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
        role="search"
      >
        <Search size={22} />
        <input
          aria-label="Search services"
          placeholder="What would you like to get done?"
          value={draft.search}
          onChange={(e) => update('search', e.target.value)}
        />
        <button className="market-button" type="submit">
          Search <ArrowRight size={17} />
        </button>
      </form>
      <div className="market-category-nav" aria-label="Service categories">
        {[{ id: '', label: 'All services' }, ...FREELANCE_CATEGORIES].map((category) => (
          <button
            key={category.id}
            aria-pressed={filters.category === category.id}
            onClick={() => apply({ ...draft, category: category.id })}
          >
            <CategoryIcon category={category.id} />
            <span>{category.label}</span>
          </button>
        ))}
      </div>
      <div className="market-discovery-layout">
        <aside className="market-refine">
          <details
            open={filtersOpen}
            onToggle={(e) => setFiltersOpen(e.currentTarget.open)}
            className="market-filter-panel"
          >
            <summary>
              <SlidersHorizontal size={17} />
              Refine your search<span>{active.length || ''}</span>
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                apply();
              }}
            >
              <fieldset>
                <legend>Price in BDT</legend>
                <div className="market-price-range">
                  <label>
                    Minimum
                    <input
                      type="number"
                      min="0"
                      value={draft.minBudget}
                      onChange={(e) => update('minBudget', e.target.value)}
                      placeholder="Any"
                    />
                  </label>
                  <label>
                    Maximum
                    <input
                      type="number"
                      min="0"
                      value={draft.maxBudget}
                      onChange={(e) => update('maxBudget', e.target.value)}
                      placeholder="Any"
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Pricing model</legend>
                {[
                  ['', 'Any pricing'],
                  ['fixed', 'Fixed price'],
                  ['hourly', 'Hourly rate'],
                ].map(([value, label]) => (
                  <label className="market-radio" key={value}>
                    <input
                      type="radio"
                      name="priceType"
                      value={value}
                      checked={draft.priceType === value}
                      onChange={() => update('priceType', value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label className="market-field">
                Delivery time
                <select
                  value={draft.maxDeliveryDays}
                  onChange={(e) => update('maxDeliveryDays', e.target.value)}
                >
                  <option value="">Any timeframe</option>
                  <option value="3">Within 3 days</option>
                  <option value="7">Within 7 days</option>
                  <option value="14">Within 14 days</option>
                  <option value="30">Within 30 days</option>
                </select>
              </label>
              <label className="market-field">
                Specific skill
                <input
                  value={draft.skill}
                  onChange={(e) => update('skill', e.target.value)}
                  placeholder="e.g. Figma or React"
                />
              </label>
              <p className="market-filter-note">
                Prices are per package or per hour, depending on the service.
              </p>
              {error && (
                <p role="alert" className="market-error">
                  {error}
                </p>
              )}
              <button className="market-button" type="submit">
                Apply filters <Check size={16} />
              </button>
              {active.length > 0 && (
                <button
                  className="market-text-button"
                  type="button"
                  onClick={() => apply({ ...EMPTY_MARKETPLACE_FILTERS })}
                >
                  Clear all filters
                </button>
              )}
            </form>
          </details>
          <div className="market-trust-note">
            <BadgeCheck size={23} />
            <strong>Look beyond the listing.</strong>
            <p>Explore sample work, university backgrounds, and reviews from completed orders.</p>
          </div>
        </aside>
        <div className="market-results" aria-busy={loading}>
          <div className="market-results-heading">
            <div>
              <p className="market-kicker">MAKE SOMETHING HAPPEN</p>
              <h2>
                {filters.category
                  ? categoryLabel(filters.category)
                  : 'Discover your next collaborator'}
              </h2>
              <span role="status">
                {loading
                  ? 'Finding services…'
                  : `${total} service${total === 1 ? '' : 's'}${active.length ? ' match your search' : ' to explore'}`}
              </span>
            </div>
            <label>
              Sort by
              <select
                aria-label="Sort services"
                value={filters.sort}
                onChange={(e) => apply({ ...filters, sort: e.target.value })}
              >
                <option value="">Recommended</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="delivery">Delivery time</option>
                <option value="rating">Highest rated</option>
              </select>
            </label>
          </div>
          {active.length > 0 && (
            <div className="market-active-filters">
              {active.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => apply({ ...filters, [key]: '' })}
                  aria-label={`Remove ${chipLabel(key, value)} filter`}
                >
                  {chipLabel(key, value)}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
          {loading ? (
            <BrandLoader label="Finding your next collaborator" />
          ) : listings.length ? (
            <div className="market-service-grid">
              {listings.map((listing) => (
                <ServiceCard key={listing._id} listing={listing} onOpen={() => onOpen(listing)} />
              ))}
            </div>
          ) : (
            <div className="market-empty">
              <Search size={30} />
              <h3>{active.length ? 'Let’s open up the search.' : 'Good work is on its way.'}</h3>
              <p>
                {active.length
                  ? 'Try a broader skill, another category, or a wider price range.'
                  : 'There are no services to explore yet. Check back as student freelancers publish their work.'}
              </p>
              {active.length > 0 && (
                <button
                  className="market-button"
                  onClick={() => apply({ ...EMPTY_MARKETPLACE_FILTERS })}
                >
                  Explore all services <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
          {!loading && total > 0 && (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={total}
              itemLabel="services"
              onPageChange={onPage}
              onPageSizeChange={onPageSize}
            />
          )}
        </div>
      </div>
    </section>
  );
}
