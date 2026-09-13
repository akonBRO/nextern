'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Clock3, FileText, ShieldCheck, Star } from 'lucide-react';
import BrandLoader from '@/components/ui/BrandLoader';
import type { Listing, Review } from './freelance-types';
import { FreelancerIdentity } from './FreelanceMarketplace';
import { categoryLabel, formatMarketMoney } from './marketplace-utils';

export default function FreelanceServiceDetail({
  listing,
  onQuote,
  onEdit,
}: {
  listing: Listing;
  onQuote: () => void;
  onEdit: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/freelance/listings/${listing._id}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load service details.');
        return data;
      })
      .then((data) => setReviews(data.reviews ?? []))
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [listing._id]);
  return (
    <div className="market-detail-layout">
      <div className="market-detail-story">
        <p className="market-kicker">{categoryLabel(listing.category)}</p>
        <FreelancerIdentity listing={listing} large />
        <section>
          <h4>About this service</h4>
          <p className="market-preserve-lines">{listing.description}</p>
          <div className="market-card-skills">
            {listing.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>
        <section>
          <h4>Meet your collaborator</h4>
          <dl className="market-profile-facts">
            {listing.freelancer.department && (
              <div>
                <dt>Field of study</dt>
                <dd>{listing.freelancer.department}</dd>
              </div>
            )}
            <div>
              <dt>Completed orders for this service</dt>
              <dd>{listing.totalOrdersCompleted}</dd>
            </div>
            {listing.freelancer.hasVerifiedFreelancerBadge && (
              <div>
                <dt>Recognition</dt>
                <dd>
                  <BadgeCheck size={16} />
                  Verified Freelancer
                </dd>
              </div>
            )}
          </dl>
          {listing.freelancer.skills.length > 0 && (
            <>
              <p>More skills</p>
              <div className="market-card-skills">
                {listing.freelancer.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </>
          )}
        </section>
        <section>
          <h4>Sample work</h4>
          {listing.sampleFiles.length ? (
            <div className="market-samples">
              {listing.sampleFiles.map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.type.startsWith('image/') ? (
                    <Image
                      width={600}
                      height={400}
                      unoptimized
                      src={file.url}
                      alt={file.name || 'Work sample'}
                      loading="lazy"
                    />
                  ) : (
                    <FileText size={28} />
                  )}
                  <span>
                    {file.name || 'View sample'}
                    <ArrowRight size={15} />
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p>
              No sample files have been added to this service. Include any questions about relevant
              experience in your quote request.
            </p>
          )}
        </section>
        <section>
          <h4>
            Client reviews{' '}
            {listing.averageRating > 0 && (
              <span>
                <Star size={16} />
                {listing.averageRating.toFixed(1)}
              </span>
            )}
          </h4>
          {loading ? (
            <BrandLoader variant="inline" label="Loading reviews" />
          ) : error ? (
            <p className="market-error" role="alert">
              {error}
            </p>
          ) : reviews.length ? (
            reviews.map((review) => (
              <article className="market-review" key={review._id}>
                <strong>{review.reviewer?.companyName || review.reviewer?.name || 'Client'}</strong>
                <small>Review from a completed order</small>
                <p>{review.comment || review.recommendationText || 'Client left a rating.'}</p>
              </article>
            ))
          ) : (
            <p>No client reviews yet. Reviews appear after completed, funded orders.</p>
          )}
        </section>
      </div>
      <aside className="market-quote-summary">
        <p className="market-kicker">LET’S GET TO WORK</p>
        <small>{listing.priceType === 'hourly' ? 'Hourly rate' : 'Fixed price'}</small>
        <strong className="market-detail-price">
          {formatMarketMoney(listing.priceBDT)}
          {listing.priceType === 'hourly' && <small> / hr</small>}
        </strong>
        <p>
          <Clock3 size={16} />
          Standard delivery: {listing.deliveryDays} days
        </p>
        <p>Agree on the scope and final quote before funding your order.</p>
        {listing.canEdit ? (
          <button className="market-button" onClick={onEdit}>
            Edit your service
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="market-button"
            disabled={!listing.canOrder || !!error}
            onClick={onQuote}
          >
            Request a quote
            <ArrowRight size={16} />
          </button>
        )}
        <div className="market-quote-trust">
          <ShieldCheck size={22} />
          <div>
            <strong>A clear path from quote to delivery.</strong>
            <p>
              Agree on a quote, fund escrow, then review the delivered work. Order messaging becomes
              available after the quote is accepted.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
