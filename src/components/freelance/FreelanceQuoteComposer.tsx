'use client';

import { ArrowRight, FileText, ShieldCheck, Upload, X } from 'lucide-react';
import { FREELANCE_PAYMENT_METHODS, calculateFreelanceQuote } from '@/lib/freelance-shared';
import { PaymentMethodLogo } from '@/components/payments/PaymentMethodLogo';
import BrandLoader from '@/components/ui/BrandLoader';
import type { FreelanceAsset, Listing } from './freelance-types';
import { FreelancerIdentity } from './FreelanceMarketplace';
import { formatMarketMoney } from './marketplace-utils';

type Props = {
  listing: Listing;
  requirements: string;
  setRequirements: (value: string) => void;
  files: FreelanceAsset[];
  setFiles: (files: FreelanceAsset[]) => void;
  rate: string;
  setRate: (value: string) => void;
  hours: string;
  setHours: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  method: 'bkash' | 'visa' | 'mastercard';
  setMethod: (value: 'bkash' | 'visa' | 'mastercard') => void;
  uploading: boolean;
  submitting: boolean;
  onUpload: (files: File[]) => Promise<FreelanceAsset[]>;
  onSubmit: () => void;
  onCancel: () => void;
};
export default function FreelanceQuoteComposer(p: Props) {
  const quote = calculateFreelanceQuote({
    priceType: p.listing.priceType,
    rateBDT: Number(p.rate || p.listing.priceBDT),
    hours: Number(p.hours || 1),
  });
  return (
    <form
      className="market-editor"
      onSubmit={(e) => {
        e.preventDefault();
        p.onSubmit();
      }}
    >
      <div className="market-editor-fields">
        <fieldset>
          <legend>
            <span>01</span>Tell us about your project
          </legend>
          <p>
            Describe the result you want, the deliverables, and anything your freelancer needs to
            know.
          </p>
          <label className="market-field">
            Project requirements
            <textarea
              aria-label="Project requirements"
              rows={6}
              minLength={20}
              maxLength={3000}
              required
              value={p.requirements}
              onChange={(e) => p.setRequirements(e.target.value)}
              placeholder="What are we making? Include your goals, scope, and any requirements."
            />
            <small>At least 20 characters · {p.requirements.length}/3000</small>
          </label>
          <label className="market-upload">
            <Upload size={22} />
            <strong>{p.uploading ? 'Uploading reference files…' : 'Add reference files'}</strong>
            <span>Briefs, examples, and supporting documents · Up to 6 files</span>
            <input
              aria-label="Upload requirement files"
              type="file"
              multiple
              disabled={p.uploading || p.files.length >= 6}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (!files.length) return;
                const uploaded = await p.onUpload(files);
                p.setFiles([...p.files, ...uploaded].slice(0, 6));
              }}
            />
          </label>
          <div className="market-uploaded-files">
            {p.files.map((file, index) => (
              <div key={`${file.url}-${index}`}>
                <FileText size={17} />
                <span>{file.name || 'Reference file'}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name || 'reference file'}`}
                  onClick={() => p.setFiles(p.files.filter((_, i) => i !== index))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <span>02</span>Propose your terms
          </legend>
          <p>The freelancer can accept your offer or suggest a different quote.</p>
          <div className="market-form-grid">
            <label className="market-field">
              {p.listing.priceType === 'hourly' ? 'Hourly rate (BDT)' : 'Project price (BDT)'}
              <input
                aria-label="Proposed rate in BDT"
                type="number"
                min="1"
                max="500000"
                step="1"
                value={p.rate}
                onChange={(e) => p.setRate(e.target.value)}
                placeholder={String(p.listing.priceBDT)}
              />
            </label>
            {p.listing.priceType === 'hourly' && (
              <label className="market-field">
                Estimated hours
                <input
                  aria-label="Estimated hours"
                  type="number"
                  min="1"
                  max="400"
                  step="1"
                  required
                  value={p.hours}
                  onChange={(e) => p.setHours(e.target.value)}
                />
              </label>
            )}
          </div>
          <label className="market-field">
            Note to the freelancer <small>Optional</small>
            <textarea
              aria-label="Proposal note"
              rows={3}
              maxLength={1000}
              value={p.note}
              onChange={(e) => p.setNote(e.target.value)}
              placeholder="Any questions or context about your offer?"
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>
            <span>03</span>Choose how you’ll fund the order
          </legend>
          <p>You will only be asked to pay after the quote is accepted.</p>
          <div className="market-payment-options">
            {FREELANCE_PAYMENT_METHODS.map((method) => (
              <label key={method.id} className={p.method === method.id ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="quotePaymentMethod"
                  checked={p.method === method.id}
                  onChange={() => p.setMethod(method.id)}
                />
                <PaymentMethodLogo method={method.id} height={20} />
                {method.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <aside className="market-editor-preview">
        <p className="market-kicker">YOUR QUOTE REQUEST</p>
        <FreelancerIdentity listing={p.listing} />
        <h4>{p.listing.title}</h4>
        <dl className="market-profile-facts">
          <div>
            <dt>Listed rate</dt>
            <dd>
              {formatMarketMoney(p.listing.priceBDT)}
              {p.listing.priceType === 'hourly' ? ' / hr' : ''}
            </dd>
          </div>
          <div>
            <dt>Standard delivery</dt>
            <dd>{p.listing.deliveryDays} days</dd>
          </div>
          {p.listing.priceType === 'hourly' && (
            <div>
              <dt>Your estimate</dt>
              <dd>{p.hours || 1} hours</dd>
            </div>
          )}
        </dl>
        <small>Proposed total</small>
        <strong>{formatMarketMoney(quote.totalBDT)}</strong>
        <p>No payment is collected when you send this request.</p>
        <div className="market-editor-tip">
          <ShieldCheck size={22} />
          <strong>What happens next?</strong>
          <p>
            Your freelancer reviews the quote. After acceptance, you can message each other and fund
            the order through Nextern escrow.
          </p>
        </div>
      </aside>
      <footer className="market-form-footer">
        <p>Agree on the scope first. Fund the work after acceptance.</p>
        <button
          className="market-button-secondary"
          type="button"
          onClick={p.onCancel}
          disabled={p.submitting}
        >
          Cancel
        </button>
        <button className="market-button" disabled={p.submitting || p.uploading} type="submit">
          {p.submitting ? (
            <BrandLoader variant="inline" label="Sending request" />
          ) : (
            <>
              Send quote request
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </footer>
    </form>
  );
}
