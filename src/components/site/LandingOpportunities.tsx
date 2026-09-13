import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, MapPin } from 'lucide-react';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';

type PreviewJob = {
  _id: { toString(): string };
  title: string;
  companyName: string;
  type: string;
  locationType: string;
  city?: string;
  applicationDeadline: Date;
  targetDepartments?: string[];
};

// Presentation-only grouping; card titles and metadata retain their original values.
function fieldForSelection(job: PreviewJob) {
  const fields: [string, RegExp][] = [
    ['people', /\bhr\b|human resources|recruit|talent/],
    ['finance', /financ|account|audit|banking/],
    ['design', /design|architect|creative/],
    ['marketing', /market|sales|content|media|writer/],
    ['technology', /software|developer|cyber|cloud|\bai\b|support engineer|data/],
    ['operations', /operat|supply|logistic|quality/],
    ['research', /research|environment|laboratory/],
  ];
  return (
    fields.find(([, match]) => match.test(job.title.toLowerCase()))?.[0] ??
    job.targetDepartments?.[0] ??
    'general'
  );
}

async function readPreview() {
  try {
    await connectDB();
    // Read-only summaries of broadly advertised roles, excluding targeted campus/batch hiring.
    // The protected jobs API, eligibility rules, and application flow remain unchanged.
    const jobs = await Job.find({
      isActive: true,
      applicationDeadline: { $gte: new Date() },
      type: { $in: ['internship', 'full-time', 'part-time'] },
      targetUniversities: { $size: 0 },
      isBatchHiring: { $ne: true },
    })
      .select('title companyName type locationType city applicationDeadline targetDepartments')
      .sort({ createdAt: -1, _id: -1 })
      .limit(80)
      .maxTimeMS(5000)
      .lean<PreviewJob[]>();
    const selected: PreviewJob[] = [];
    const fields = new Set<string>();
    const companies = new Set<string>();
    for (const job of jobs) {
      const field = fieldForSelection(job);
      if (fields.has(field) || companies.has(job.companyName)) continue;
      selected.push(job);
      fields.add(field);
      companies.add(job.companyName);
      if (selected.length === 4) break;
    }
    for (const job of jobs) {
      if (selected.length === 4) break;
      if (!selected.includes(job)) selected.push(job);
    }
    return { jobs: selected, unavailable: false };
  } catch {
    return { jobs: [], unavailable: true };
  }
}

const browseHref = '/login?callbackUrl=%2Fstudent%2Fjobs';

export function OpportunityPreviewLoading() {
  return (
    <section
      className="public-container live-opportunities"
      aria-label="Loading opportunities"
      aria-busy="true"
    >
      <p className="public-eyebrow">Explore your next chapter</p>
      <h2>Finding current opportunities…</h2>
      <div className="opportunity-preview-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div className="opportunity-preview-skeleton" key={item} />
        ))}
      </div>
    </section>
  );
}

export default async function LandingOpportunities() {
  const { jobs, unavailable } = await readPreview();
  return (
    <section
      className="public-container live-opportunities"
      id="available-opportunities"
      aria-labelledby="available-title"
    >
      <div className="public-section-heading">
        <div>
          <p className="public-eyebrow">Open doors, different directions</p>
          <h2 id="available-title">Your next opportunity is out there.</h2>
          <p className="opportunity-preview-intro">
            A few current roles to get you started. Find the one that fits your ambitions.
          </p>
        </div>
        <Link href={browseHref} className="public-text-link">
          Explore all roles <ArrowUpRight size={18} />
        </Link>
      </div>
      {jobs.length ? (
        <div className="opportunity-preview-grid">
          {jobs.map((job) => (
            <article
              className="opportunity-preview"
              key={job._id.toString()}
              data-opportunity-id={job._id.toString()}
            >
              <div className="opportunity-preview-top">
                <span className="opportunity-company-mark" aria-hidden="true">
                  <BriefcaseBusiness size={21} strokeWidth={1.6} />
                </span>
                <span className="opportunity-kind">{job.type.replace('-', ' ')}</span>
              </div>
              <p className="opportunity-company">{job.companyName}</p>
              <h3>{job.title}</h3>
              <div className="opportunity-preview-meta">
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {job.locationType === 'remote'
                    ? 'Remote'
                    : [job.city, job.locationType === 'hybrid' ? 'Hybrid' : 'On-site']
                        .filter(Boolean)
                        .join(' · ')}
                </span>
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  Apply by{' '}
                  {new Intl.DateTimeFormat('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Asia/Dhaka',
                  }).format(job.applicationDeadline)}
                </span>
              </div>
              <Link
                className="opportunity-preview-link"
                href={`/login?callbackUrl=${encodeURIComponent(`/student/jobs/${job._id}`)}`}
                aria-label={`View ${job.title} at ${job.companyName}`}
              >
                View opportunity <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="opportunity-preview-empty">
          <BriefcaseBusiness size={26} aria-hidden="true" />
          <div>
            <h3>
              {unavailable
                ? 'The opportunity preview is taking a break.'
                : 'New opportunities are on their way.'}
            </h3>
            <p>
              {unavailable
                ? 'You can still sign in to explore roles in your workspace.'
                : 'Sign in to explore your personalized opportunities and career tools.'}
            </p>
          </div>
          <Link href={browseHref} className="public-text-link">
            Explore your workspace <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
      {jobs.length > 0 && (
        <p className="opportunity-preview-note">
          See something for you? Sign in to view the full role and apply.
        </p>
      )}
    </section>
  );
}
