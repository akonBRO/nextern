import Link from 'next/link';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Mic,
  Target,
} from 'lucide-react';
import type { DashboardData } from '@/lib/student-dashboard';
import { ProgressBar } from '@/components/dashboard/DashboardContent';
import './career-overview.css';

export default function CareerOverview({
  data,
  browseHref,
  applicationsHref,
  preview = false,
}: {
  data: DashboardData;
  browseHref: string;
  applicationsHref: string;
  preview?: boolean;
}) {
  const completeness = Math.max(0, Math.min(100, data.profile.profileCompleteness));
  return (
    <>
      <header className="career-welcome">
        <div>
          <p className="workspace-eyebrow">
            {preview ? 'Student career overview' : 'Your career workspace'}
          </p>
          <h1>
            {preview ? data.profile.name : `Welcome back, ${data.profile.name.split(' ')[0]}.`}
          </h1>
          <p>
            {[
              data.profile.university,
              data.profile.department,
              data.profile.isGraduated
                ? 'Graduate'
                : data.profile.yearOfStudy
                  ? `Year ${data.profile.yearOfStudy}`
                  : '',
            ]
              .filter(Boolean)
              .join(' · ') || 'A little progress today. More possibilities tomorrow.'}
          </p>
        </div>
        <Link href={browseHref} className="btn-primary">
          <BriefcaseBusiness size={17} /> Explore opportunities <ArrowUpRight size={17} />
        </Link>
      </header>
      <div className="career-overview-grid">
        <section className="career-next-step">
          <div className="career-next-copy">
            <p className="workspace-eyebrow">Keep moving forward</p>
            <h2>
              {completeness < 80
                ? 'Let your potential speak.'
                : 'You’ve got the foundation. Take the next step.'}
            </h2>
            <p>
              {completeness < 80
                ? 'A complete profile helps employers understand what you bring. Add your skills, projects, and experience.'
                : 'Put your preparation into practice. Explore an opportunity, sharpen a skill, or prepare for your next interview.'}
            </p>
            <Link
              href={
                preview ? applicationsHref : completeness < 80 ? '/student/profile' : browseHref
              }
            >
              {preview
                ? 'View student activity'
                : completeness < 80
                  ? 'Complete my profile'
                  : 'Find my next opportunity'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="career-progress">
            <div
              className="career-progress-ring"
              style={{ background: `conic-gradient(#a9d8b7 ${completeness}%, #ffffff24 0)` }}
            >
              <div>
                <strong>
                  {completeness}
                  <small>%</small>
                </strong>
                <span>PROFILE COMPLETE</span>
              </div>
            </div>
            <span>
              <GraduationCap size={15} /> Your foundation for what’s next
            </span>
          </div>
        </section>
        <section className="career-readiness">
          <div className="career-readiness-title">
            <Target size={19} />
            <h2>Career readiness</h2>
          </div>
          <div className="career-score">
            <strong>
              {data.profile.opportunityScore}
              <small>/100</small>
            </strong>
            {data.stats.leaderboardRank !== null && (
              <span>
                University rank <b>#{data.stats.leaderboardRank}</b>
              </span>
            )}
          </div>
          <ProgressBar label="Opportunity score" value={data.profile.opportunityScore} />
          <p>Your score reflects your profile and platform activity.</p>
          <a href="#score">
            See your progress <ArrowUpRight size={15} />
          </a>
        </section>
      </div>
      {!preview && (
        <nav className="career-shortcuts" aria-label="Career quick actions">
          {[
            { icon: FileText, label: 'Build your resume', href: '/student/resume' },
            { icon: Mic, label: 'Practice an interview', href: '/student/mock-interview' },
            { icon: Target, label: 'Develop your skills', href: '/student/skills' },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href}>
              <Icon size={19} />
              <span>{label}</span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
