'use client';

import type { Dispatch, SetStateAction } from 'react';
import { ArrowRight, FileText, Upload, X } from 'lucide-react';
import BrandLoader from '@/components/ui/BrandLoader';
import { FREELANCE_CATEGORIES } from '@/lib/freelance-shared';
import type { FreelanceAsset, ListingFormState } from './freelance-types';
import { categoryLabel, formatMarketMoney } from './marketplace-utils';

type Props = {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  editing: boolean;
  submitting: boolean;
  uploading: boolean;
  onUpload: (files: File[]) => Promise<FreelanceAsset[]>;
  onSubmit: () => void;
  onCancel: () => void;
};
export default function FreelanceServiceEditor({
  form,
  setForm,
  editing,
  submitting,
  uploading,
  onUpload,
  onSubmit,
  onCancel,
}: Props) {
  const update = (key: keyof ListingFormState, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="market-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="market-editor-fields">
        <fieldset>
          <legend>
            <span>01</span>Define your service
          </legend>
          <p>Tell clients what you can deliver and who it is for.</p>
          <label className="market-field">
            Service title
            <input
              aria-label="Service title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. A responsive website for your business"
              minLength={3}
              maxLength={120}
              required
            />
          </label>
          <label className="market-field">
            Category
            <select
              aria-label="Service category"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              {FREELANCE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="market-field">
            Description
            <textarea
              aria-label="Description"
              rows={5}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Outline your deliverables, process, and what you need from the client."
              minLength={20}
              maxLength={2000}
              required
            />
          </label>
          <label className="market-field">
            Skills
            <input
              aria-label="Skills"
              value={form.skillsText}
              onChange={(e) => update('skillsText', e.target.value)}
              placeholder="e.g. React, Figma, copywriting"
            />
            <small>Separate skills with commas.</small>
          </label>
        </fieldset>
        <fieldset>
          <legend>
            <span>02</span>Set the terms
          </legend>
          <p>Give clients a starting point. You can negotiate the final quote.</p>
          <div className="market-form-grid">
            <label className="market-field">
              Pricing model
              <select
                aria-label="Pricing model"
                value={form.priceType}
                onChange={(e) => update('priceType', e.target.value)}
              >
                <option value="fixed">Fixed price</option>
                <option value="hourly">Hourly rate</option>
              </select>
            </label>
            <label className="market-field">
              Rate (BDT)
              <input
                aria-label="Rate in BDT"
                type="number"
                min="1"
                required
                value={form.priceBDT}
                onChange={(e) => update('priceBDT', e.target.value)}
                placeholder="3500"
              />
            </label>
            <label className="market-field">
              Delivery time (days)
              <input
                aria-label="Delivery time in days"
                type="number"
                min="1"
                max="90"
                required
                value={form.deliveryDays}
                onChange={(e) => update('deliveryDays', e.target.value)}
              />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <span>03</span>Show your work
          </legend>
          <p>Add sample deliverables, portfolio images, or case studies.</p>
          <label className="market-upload">
            <Upload size={24} />
            <strong>{uploading ? 'Uploading sample work…' : 'Choose sample files'}</strong>
            <span>Up to 6 files · Use work you have permission to share</span>
            <input
              type="file"
              multiple
              disabled={uploading || form.sampleFiles.length >= 6}
              aria-label="Upload sample files"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (!files.length) return;
                const uploaded = await onUpload(files);
                setForm((current) => ({
                  ...current,
                  sampleFiles: [...current.sampleFiles, ...uploaded].slice(0, 6),
                }));
              }}
            />
          </label>
          <div className="market-uploaded-files">
            {form.sampleFiles.map((file, index) => (
              <div key={`${file.url}-${index}`}>
                <FileText size={17} />
                <span>{file.name || 'Sample file'}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name || 'sample file'}`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      sampleFiles: current.sampleFiles.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </fieldset>
        <label className="market-checkbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update('isActive', e.target.checked)}
          />
          Visible in the marketplace<small>You can pause your service anytime.</small>
        </label>
      </div>
      <aside className="market-editor-preview">
        <p className="market-kicker">YOUR SERVICE, AT A GLANCE</p>
        <span>{categoryLabel(form.category)}</span>
        <h4>{form.title || 'A clear promise to your next client.'}</h4>
        <p>
          {form.description
            ? form.description.slice(0, 180)
            : 'Your service description will appear here as you write.'}
        </p>
        <strong>
          {form.priceBDT ? formatMarketMoney(Number(form.priceBDT)) : 'Set your price'}
          <small>{form.priceType === 'hourly' ? ' / hr' : ' / project'}</small>
        </strong>
        <p>{form.deliveryDays || '—'} days standard delivery</p>
        <div className="market-editor-tip">
          <strong>Make your offer easy to choose.</strong>
          <p>
            Be specific about the outcome. Clear scope, realistic timing, and relevant samples help
            clients decide.
          </p>
        </div>
      </aside>
      <footer className="market-form-footer">
        <p>
          {editing
            ? 'Changes update your existing service.'
            : 'Your service becomes discoverable when published with visibility enabled.'}
        </p>
        <button
          type="button"
          className="market-button-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button className="market-button" type="submit" disabled={submitting || uploading}>
          {submitting ? (
            <BrandLoader variant="inline" label="Saving service" />
          ) : (
            <>
              {editing ? 'Save service' : 'Publish service'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </footer>
    </form>
  );
}
