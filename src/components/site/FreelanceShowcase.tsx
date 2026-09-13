import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';
import { CategoryIcon, MarketplaceIdentity } from '@/components/freelance/MarketplaceIdentity';
import './freelance-showcase.css';

export default function FreelanceShowcase() {
  return (
    <section
      className="freelance-showcase"
      id="freelancing"
      aria-labelledby="freelance-showcase-title"
    >
      <div className="public-container">
        <div className="freelance-showcase-heading">
          <MarketplaceIdentity />
          <span>A NEW WAY TO PUT YOUR SKILLS TO WORK</span>
        </div>
        <div className="freelance-showcase-grid">
          <div>
            <h2 id="freelance-showcase-title">
              Big ideas.
              <br />
              <em>Independent minds.</em>
              <br />
              Good work, together.
            </h2>
            <p>
              Meet Nextern’s freelance marketplace. Discover student talent for your next project,
              or turn your own skills into services people can hire.
            </p>
            <div className="freelance-showcase-actions">
              <Link href="/freelance?view=board">
                Explore Freelancing
                <ArrowUpRight size={18} />
              </Link>
              <Link href="/freelance?view=services">
                Offer your skills
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <small>Real projects. Professional experience. A stronger career story.</small>
          </div>
          <div className="freelance-showcase-categories" aria-label="Explore freelance categories">
            {[
              {
                id: 'graphic-design',
                label: 'Design & identity',
                title: 'Make your brand stand out.',
              },
              { id: 'web-dev', label: 'Web development', title: 'Bring your next idea to life.' },
              {
                id: 'content-writing',
                label: 'Writing & content',
                title: 'Find the words that connect.',
              },
            ].map((item) => (
              <Link key={item.id} href={`/freelance?view=board&category=${item.id}`}>
                <span className="freelance-category-icon">
                  <CategoryIcon category={item.id} size={30} />
                </span>
                <div>
                  <span>{item.label}</span>
                  <h3>{item.title}</h3>
                </div>
                <ArrowUpRight size={21} />
              </Link>
            ))}
          </div>
        </div>
        <div className="freelance-showcase-process">
          {[
            {
              Icon: MessageSquare,
              title: 'Start with a clear quote',
              copy: 'Discuss the scope and agree on the terms.',
            },
            {
              Icon: ShieldCheck,
              title: 'Fund through Nextern',
              copy: 'Use escrow for your agreed project payment.',
            },
            {
              Icon: CheckCircle2,
              title: 'Build a record of good work',
              copy: 'Completed projects and reviews support your career.',
            },
          ].map(({ Icon, title, copy }) => (
            <div key={title}>
              <Icon size={23} />
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
