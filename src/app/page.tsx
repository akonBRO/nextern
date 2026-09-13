import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  FileText,
  GraduationCap,
  Laptop,
  Mic,
  School,
  Target,
  Users,
  Check,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { getDefaultAuthenticatedRoute } from '@/lib/role-routing';
import PublicHeader from '@/components/site/PublicHeader';
import OpportunitySearch from '@/components/site/OpportunitySearch';
import CareerEcosystem from '@/components/site/CareerEcosystem';
import FreelanceShowcase from '@/components/site/FreelanceShowcase';
import LandingMotion from '@/components/site/LandingMotion';
import LandingOpportunities, {
  OpportunityPreviewLoading,
} from '@/components/site/LandingOpportunities';
import './public-v2.css';
import './public-redesign.css';
import '@/components/site/landing-refinement.css';

const destination = (path: string) => `/login?callbackUrl=${encodeURIComponent(path)}`;
export default async function LandingPage() {
  const session = await auth();
  if (session?.user)
    redirect(
      getDefaultAuthenticatedRoute({
        role: session.user.role,
        verificationStatus: session.user.verificationStatus,
        mustChangePassword: session.user.mustChangePassword,
      })
    );
  return (
    <div className="public-v2 next-public">
      <LandingMotion />
      <PublicHeader />
      <main id="main-content">
        <section className="chapter-hero" id="opportunities">
          <div className="public-container chapter-hero-grid">
            <div className="chapter-copy">
              <p className="public-eyebrow">From campus to what comes next</p>
              <h1>
                Your next chapter
                <br />
                starts <span>here.</span>
              </h1>
              <p className="chapter-intro">
                Big ambitions deserve a place to begin. Discover internships, build real skills, and
                connect with the people who can help you move forward.
              </p>
              <div className="chapter-audience">
                <GraduationCap size={19} /> Built for university talent in Bangladesh
              </div>
            </div>
            <CareerEcosystem />
            <div className="chapter-search">
              <OpportunitySearch />
            </div>
          </div>
        </section>
        <Suspense fallback={<OpportunityPreviewLoading />}>
          <LandingOpportunities />
        </Suspense>
        <section className="public-container discovery-section" aria-labelledby="discover-title">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">Make your first move</p>
              <h2 id="discover-title">An opportunity for every ambition.</h2>
            </div>
            <Link href={destination('/student/jobs')} className="public-text-link">
              Explore opportunities <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="discovery-grid">
            {[
              {
                icon: BriefcaseBusiness,
                title: 'Internships',
                label: 'Learn by doing',
                desc: 'Take your classroom knowledge into a real workplace.',
                href: '/student/jobs?type=internship',
                tone: 'sage',
              },
              {
                icon: Laptop,
                title: 'Early career jobs',
                label: 'Find your place',
                desc: 'Discover full-time and part-time roles for your next step.',
                href: '/student/jobs',
                tone: 'sand',
              },
              {
                icon: Code2,
                title: 'Freelance projects',
                label: 'Work on your terms',
                desc: 'Put your skills to work. Offer services and build a portfolio.',
                href: '/freelance?view=board',
                tone: 'blue',
              },
              {
                icon: School,
                title: 'Campus experiences',
                label: 'Stay connected',
                desc: 'Find workshops, webinars, and recruitment on campus.',
                href: '/student/jobs?type=campus-drive',
                tone: 'rose',
              },
            ].map(({ icon: Icon, title, label, desc, href, tone }) => (
              <Link
                key={title}
                href={href.startsWith('/freelance') ? href : destination(href)}
                className={`discovery-card discovery-${tone}`}
              >
                <div className="discovery-card-top">
                  <Icon size={25} strokeWidth={1.6} />
                  <ArrowUpRight size={20} />
                </div>
                <span>{label}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <div className="discovery-card-action">
                  Explore <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <FreelanceShowcase />
        <section className="career-studio" id="career-tools">
          <div className="public-container studio-grid">
            <div className="studio-heading">
              <p className="public-eyebrow">Your career, a work in progress</p>
              <h2>
                Don’t just find
                <br />
                the opportunity.
                <br />
                <span>Be ready for it.</span>
              </h2>
              <p>
                Build the confidence behind your next application. Your profile, practice, and
                progress belong in one place.
              </p>
              <Link className="public-button" href="/register">
                Build your career <ArrowRight size={18} />
              </Link>
              <div className="studio-note">
                <Check size={16} /> Start with a free student account
              </div>
            </div>
            <div className="studio-tools">
              {[
                {
                  number: '01',
                  icon: FileText,
                  title: 'Tell your story',
                  desc: 'Bring your education, projects, and experience together in a resume.',
                  href: '/student/resume',
                  link: 'Create your resume',
                },
                {
                  number: '02',
                  icon: Mic,
                  title: 'Walk in with confidence',
                  desc: 'Practice interview questions and learn from personalized feedback.',
                  href: '/student/mock-interview',
                  link: 'Practice an interview',
                },
                {
                  number: '03',
                  icon: Target,
                  title: 'Know what to work on',
                  desc: 'Explore skill gaps and a learning path that supports your goals.',
                  href: '/student/skills',
                  link: 'Explore career tools',
                },
                {
                  number: '04',
                  icon: Users,
                  title: 'Learn from someone who’s been there',
                  desc: 'Connect with alumni mentors for a conversation about your next step.',
                  href: '/student/mentorship',
                  link: 'Find a mentor',
                },
              ].map(({ number, icon: Icon, title, desc, href, link }) => (
                <Link className="studio-tool" key={number} href={destination(href)}>
                  <span className="studio-number">{number}</span>
                  <div>
                    <Icon size={22} strokeWidth={1.7} />
                    <h3>{title}</h3>
                    <p>{desc}</p>
                    <span className="studio-tool-link">
                      {link} <ArrowUpRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="public-container ecosystem-section" id="for-employers">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">Better, together</p>
              <h2>Potential meets possibility.</h2>
            </div>
            <p>
              A shared space for the people
              <br />
              who make early careers happen.
            </p>
          </div>
          <div className="ecosystem-panels">
            <article className="employer-chapter">
              <BriefcaseBusiness size={30} strokeWidth={1.5} />
              <p className="public-eyebrow">For employers</p>
              <h3>
                Your next great hire
                <br />
                is getting started.
              </h3>
              <p>
                Reach university talent, manage your candidate pipeline, and move from applications
                to interviews in one workspace.
              </p>
              <Link href="/register?role=employer" className="public-button">
                Start hiring <ArrowRight size={17} />
              </Link>
              <small>Employer accounts are reviewed before posting.</small>
            </article>
            <article className="university-chapter">
              <School size={30} strokeWidth={1.5} />
              <p className="public-eyebrow">For universities</p>
              <h3>
                Support the journey
                <br />
                beyond the classroom.
              </h3>
              <p>
                See student progress, share campus opportunities, and connect academic
                recommendations with career decisions.
              </p>
              <div className="university-capabilities">
                <span>
                  <Check size={16} /> Student readiness
                </span>
                <span>
                  <Check size={16} /> Academic recommendations
                </span>
                <span>
                  <Check size={16} /> Campus events
                </span>
              </div>
              <Link href="/login" className="public-text-link">
                Open your academic workspace <ArrowUpRight size={17} />
              </Link>
              <small>Contact your university administrator for access.</small>
            </article>
          </div>
        </section>
        <section className="chapter-closing">
          <div className="public-container">
            <span>YOUR FUTURE IS TAKING SHAPE</span>
            <h2>
              Let’s make your next move
              <br />a meaningful one.
            </h2>
            <Link href="/register" className="public-button">
              Join Nextern <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
