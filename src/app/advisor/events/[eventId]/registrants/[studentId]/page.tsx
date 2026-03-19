// src/app/advisor/events/[eventId]/registrants/[studentId]/page.tsx
// Advisor view of a specific student's full application + profile

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import mongoose from 'mongoose';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Calendar,
  Briefcase,
  Award,
  ExternalLink,
  Github,
  Globe,
  Phone,
  Link2,
  Code2,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' as const },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'My Events',
        href: '/advisor/events',
        description: 'View and manage your posted events.',
        icon: 'file' as const,
      },
      {
        label: 'Post Event',
        href: '/advisor/events/new',
        description: 'Publish a webinar or workshop.',
        icon: 'calendar' as const,
      },
    ],
  },
];

const STATUS_CFG: Record<
  string,
  { bg: string; color: string; border: string; dot: string; label: string }
> = {
  applied: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', dot: '#2563EB', label: 'Applied' },
  under_review: {
    bg: '#FFFBEB',
    color: '#92400E',
    border: '#FDE68A',
    dot: '#F59E0B',
    label: 'Under Review',
  },
  shortlisted: {
    bg: '#ECFDF5',
    color: '#065F46',
    border: '#A7F3D0',
    dot: '#10B981',
    label: 'Shortlisted',
  },
  assessment_sent: {
    bg: '#F0F9FF',
    color: '#0369A1',
    border: '#BAE6FD',
    dot: '#0284C7',
    label: 'Assessment Sent',
  },
  interview_scheduled: {
    bg: '#EDE9FE',
    color: '#7C3AED',
    border: '#DDD6FE',
    dot: '#7C3AED',
    label: 'Interview Scheduled',
  },
  hired: { bg: '#DCFCE7', color: '#065F46', border: '#BBF7D0', dot: '#22C55E', label: 'Hired' },
  rejected: {
    bg: '#FEF2F2',
    color: '#991B1B',
    border: '#FECACA',
    dot: '#EF4444',
    label: 'Not Selected',
  },
  withdrawn: {
    bg: '#F8FAFC',
    color: '#64748B',
    border: '#E2E8F0',
    dot: '#94A3B8',
    label: 'Withdrawn',
  },
};

async function getApplicationDetail(eventId: string, studentId: string, advisorId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(advisorId);
  const eid = new mongoose.Types.ObjectId(eventId);
  const sid = new mongoose.Types.ObjectId(studentId);

  const [advisor, event, application, student, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    Job.findOne({ _id: eid, employerId: oid }).lean(),
    Application.findOne({ jobId: eid, studentId: sid }).lean(),
    User.findById(sid)
      .select(
        'name email image university department yearOfStudy cgpa skills bio linkedinUrl githubUrl portfolioUrl city phone resumeUrl opportunityScore profileCompleteness completedCourses projects certifications studentId currentSemester isGraduated'
      )
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!event || !application || !student) return null;

  return {
    advisor,
    event,
    application,
    student,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

// ── Small reusable sidebar card ──
function SideCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '20px 22px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {icon}
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: 'var(--font-display)',
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SideIconBox({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

export default async function StudentApplicationPage({
  params,
}: {
  params: Promise<{ eventId: string; studentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'advisor' && session.user.role !== 'dept_head')
    redirect('/advisor/dashboard');

  const { eventId, studentId } = await params;
  const data = await getApplicationDetail(eventId, studentId, session.user.id);
  if (!data) redirect(`/advisor/events/${eventId}/registrants`);

  const { advisor, event, application, student, chrome } = data;
  const statusCfg = STATUS_CFG[application.status] ?? STATUS_CFG['applied'];
  const fitScore = application.fitScore ?? 0;
  const fitColor = fitScore >= 70 ? '#10B981' : fitScore >= 40 ? '#F59E0B' : '#EF4444';
  const fitBg = fitScore >= 70 ? '#DCFCE7' : fitScore >= 40 ? '#FFFBEB' : '#FEF2F2';
  const fitBorder = fitScore >= 70 ? '#BBF7D0' : fitScore >= 40 ? '#FDE68A' : '#FECACA';
  const resumeUrl = (student as { resumeUrl?: string }).resumeUrl ?? null;

  const initials = (student.name ?? 'S')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={navItems}
      user={{
        name: advisor?.name ?? 'Advisor',
        email: advisor?.email ?? '',
        image: advisor?.image,
        subtitle:
          [advisor?.designation, advisor?.institutionName].filter(Boolean).join(' · ') ||
          'Advisor workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {/* Back link */}
          <Link
            href={`/advisor/events/${eventId}/registrants`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#64748B',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} /> Back to registrants
          </Link>

          {/* ── Hero ── */}
          <div
            style={{
              background: 'linear-gradient(145deg, #0F172A, #1E293B)',
              borderRadius: 24,
              padding: '28px 32px',
              marginBottom: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 26,
                  fontWeight: 900,
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '3px solid rgba(255,255,255,0.15)',
                }}
              >
                {student.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.image as string}
                    alt=""
                    style={{ width: 72, height: 72, objectFit: 'cover' }}
                  />
                ) : (
                  initials
                )}
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: '#F8FAFC',
                      fontFamily: 'var(--font-display)',
                      margin: 0,
                    }}
                  >
                    {student.name}
                  </h1>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: statusCfg.bg,
                      color: statusCfg.color,
                      border: `1px solid ${statusCfg.border}`,
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: statusCfg.dot,
                        display: 'inline-block',
                      }}
                    />
                    {statusCfg.label}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 14,
                    color: '#94A3B8',
                    fontSize: 13,
                  }}
                >
                  {student.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Mail size={13} /> {student.email}
                    </span>
                  )}
                  {student.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={13} /> {student.phone}
                    </span>
                  )}
                  {student.city && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} /> {student.city}
                    </span>
                  )}
                  {student.university && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GraduationCap size={13} /> {student.university}
                      {student.department && ` · ${student.department}`}
                      {student.yearOfStudy && ` · Year ${student.yearOfStudy}`}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {student.bio && (
                  <p
                    style={{
                      fontSize: 13,
                      color: '#94A3B8',
                      marginTop: 10,
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      maxWidth: 520,
                    }}
                  >
                    {`"${student.bio}"`}
                  </p>
                )}

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
                  {[
                    {
                      label: 'Applied',
                      value: formatShortDate(application.appliedAt?.toISOString()),
                      color: '#F8FAFC',
                    },
                    {
                      label: 'CGPA',
                      value: student.cgpa ? student.cgpa.toFixed(2) : '—',
                      color: '#22D3EE',
                    },
                    {
                      label: 'Fit Score',
                      value: fitScore > 0 ? `${fitScore}%` : '—',
                      color: fitColor,
                    },
                    {
                      label: 'Profile',
                      value: student.profileCompleteness ? `${student.profileCompleteness}%` : '—',
                      color: '#A78BFA',
                    },
                    {
                      label: 'Opp. Score',
                      value: student.opportunityScore ? `${student.opportunityScore}` : '—',
                      color: '#F59E0B',
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: s.color,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: 600 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Two column layout ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 300px',
              gap: 16,
              alignItems: 'start',
            }}
            className="app-detail-grid"
          >
            {/* ── LEFT: Application + Profile details ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Cover Letter */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  padding: '24px 28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563EB',
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#0F172A',
                      fontFamily: 'var(--font-display)',
                      margin: 0,
                    }}
                  >
                    Cover Letter
                  </h2>
                </div>
                {application.coverLetter ? (
                  <p
                    style={{
                      fontSize: 14,
                      color: '#475569',
                      lineHeight: 1.85,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {application.coverLetter}
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
                    No cover letter submitted.
                  </p>
                )}
              </div>

              {/* Projects */}
              {student.projects && student.projects.length > 0 && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 28px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#D97706',
                      }}
                    >
                      <Briefcase size={16} />
                    </div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                      }}
                    >
                      Projects
                    </h2>
                    <span
                      style={{
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        marginLeft: 4,
                      }}
                    >
                      {student.projects.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {student.projects.map(
                      (
                        proj: {
                          title: string;
                          description: string;
                          techStack?: string[];
                          projectUrl?: string;
                          repoUrl?: string;
                        },
                        i: number
                      ) => (
                        <div
                          key={i}
                          style={{
                            background: '#FAFBFC',
                            borderRadius: 14,
                            border: '1px solid #E2E8F0',
                            padding: '16px 18px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 12,
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                              {proj.title}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              {proj.projectUrl && (
                                <a
                                  href={proj.projectUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: '#EFF6FF',
                                    color: '#2563EB',
                                    border: '1px solid #BFDBFE',
                                    padding: '3px 9px',
                                    borderRadius: 7,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Globe size={11} /> Live
                                </a>
                              )}
                              {proj.repoUrl && (
                                <a
                                  href={proj.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #E2E8F0',
                                    padding: '3px 9px',
                                    borderRadius: 7,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Github size={11} /> Repo
                                </a>
                              )}
                            </div>
                          </div>
                          {proj.description && (
                            <p
                              style={{
                                fontSize: 13,
                                color: '#64748B',
                                lineHeight: 1.65,
                                margin: '0 0 10px',
                              }}
                            >
                              {proj.description}
                            </p>
                          )}
                          {proj.techStack && proj.techStack.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {proj.techStack.map((t: string) => (
                                <span
                                  key={t}
                                  style={{
                                    background: '#EDE9FE',
                                    color: '#7C3AED',
                                    border: '1px solid #DDD6FE',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 600,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {student.certifications && student.certifications.length > 0 && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 28px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#ECFDF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10B981',
                      }}
                    >
                      <Award size={16} />
                    </div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                      }}
                    >
                      Certifications
                    </h2>
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        marginLeft: 4,
                      }}
                    >
                      {student.certifications.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {student.certifications.map(
                      (
                        cert: { name: string; issuedBy: string; credentialUrl?: string },
                        i: number
                      ) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            background: '#F0FDF4',
                            borderRadius: 12,
                            border: '1px solid #A7F3D0',
                            padding: '12px 16px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>
                              {cert.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>
                              Issued by {cert.issuedBy}
                            </div>
                          </div>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: '#fff',
                                color: '#16A34A',
                                border: '1px solid #A7F3D0',
                                padding: '5px 11px',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                textDecoration: 'none',
                                flexShrink: 0,
                              }}
                            >
                              <ExternalLink size={11} /> View
                            </a>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* AI Fit Analysis */}
              {fitScore > 0 && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 28px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: fitBg,
                          border: `1px solid ${fitBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: fitColor,
                        }}
                      >
                        <Target size={16} />
                      </div>
                      <h2
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#0F172A',
                          fontFamily: 'var(--font-display)',
                          margin: 0,
                        }}
                      >
                        AI Fit Analysis
                      </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          color: fitColor,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                        }}
                      >
                        {fitScore}%
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                        fit score
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 10,
                      background: '#F1F5F9',
                      borderRadius: 999,
                      overflow: 'hidden',
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: `${fitScore}%`,
                        height: '100%',
                        background: fitColor,
                        borderRadius: 999,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {application.hardGaps?.length > 0 && (
                      <div
                        style={{
                          background: '#FEF2F2',
                          borderRadius: 14,
                          padding: '14px 16px',
                          border: '1px solid #FECACA',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 10,
                          }}
                        >
                          <XCircle size={14} color="#EF4444" />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#991B1B',
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                            }}
                          >
                            Hard Gaps
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {application.hardGaps.map((g: string) => (
                            <span
                              key={g}
                              style={{
                                background: '#fff',
                                color: '#EF4444',
                                border: '1px solid #FECACA',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {application.softGaps?.length > 0 && (
                      <div
                        style={{
                          background: '#FFFBEB',
                          borderRadius: 14,
                          padding: '14px 16px',
                          border: '1px solid #FDE68A',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 10,
                          }}
                        >
                          <AlertTriangle size={14} color="#F59E0B" />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#92400E',
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                            }}
                          >
                            Soft Gaps
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {application.softGaps.map((g: string) => (
                            <span
                              key={g}
                              style={{
                                background: '#fff',
                                color: '#F59E0B',
                                border: '1px solid #FDE68A',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {application.suggestedPath?.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        background: '#F5F3FF',
                        borderRadius: 14,
                        padding: '14px 16px',
                        border: '1px solid #DDD6FE',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}
                      >
                        <Lightbulb size={14} color="#7C3AED" />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#7C3AED',
                            textTransform: 'uppercase',
                            letterSpacing: 0.6,
                          }}
                        >
                          Suggested Prep Path
                        </span>
                      </div>
                      <ol
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {application.suggestedPath.map((step: string, i: number) => (
                          <li key={i} style={{ fontSize: 13, color: '#5B21B6', lineHeight: 1.6 }}>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Assessment */}
              {(application.assessmentScore !== undefined ||
                application.assessmentPassed !== undefined) && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 28px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#ECFDF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10B981',
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                      }}
                    >
                      Assessment Results
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {application.assessmentScore !== undefined && (
                      <div
                        style={{
                          background: '#F8FAFC',
                          borderRadius: 12,
                          padding: '14px 20px',
                          border: '1px solid #E2E8F0',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 900,
                            color: '#0F172A',
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                          }}
                        >
                          {application.assessmentScore}%
                        </div>
                        <div
                          style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 600 }}
                        >
                          Score
                        </div>
                      </div>
                    )}
                    {application.assessmentPassed !== undefined && (
                      <div
                        style={{
                          background: application.assessmentPassed ? '#ECFDF5' : '#FEF2F2',
                          borderRadius: 12,
                          padding: '14px 20px',
                          border: `1px solid ${application.assessmentPassed ? '#A7F3D0' : '#FECACA'}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 22, lineHeight: 1 }}>
                          {application.assessmentPassed ? '✅' : '❌'}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            marginTop: 4,
                            color: application.assessmentPassed ? '#065F46' : '#991B1B',
                          }}
                        >
                          {application.assessmentPassed ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interview */}
              {application.interviewScheduledAt && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 28px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#EDE9FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7C3AED',
                      }}
                    >
                      <Calendar size={16} />
                    </div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                      }}
                    >
                      Interview
                    </h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={14} color="#7C3AED" />
                    <span style={{ fontSize: 14, color: '#5B21B6', fontWeight: 600 }}>
                      Scheduled for{' '}
                      {new Date(application.interviewScheduledAt).toLocaleString('en-BD', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Status history */}
              {application.statusHistory?.length > 0 && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 28px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748B',
                      }}
                    >
                      <Clock size={16} />
                    </div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                      }}
                    >
                      Status History
                    </h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...application.statusHistory]
                      .reverse()
                      .map(
                        (entry: { status: string; changedAt: Date; note?: string }, i: number) => {
                          const cfg = STATUS_CFG[entry.status] ?? STATUS_CFG['applied'];
                          return (
                            <div
                              key={i}
                              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                            >
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: cfg.dot,
                                  flexShrink: 0,
                                  marginTop: 5,
                                }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span
                                    style={{
                                      background: cfg.bg,
                                      color: cfg.color,
                                      border: `1px solid ${cfg.border}`,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {cfg.label}
                                  </span>
                                  <span style={{ fontSize: 12, color: '#94A3B8' }}>
                                    {formatShortDate(entry.changedAt?.toISOString())}
                                  </span>
                                </div>
                                {entry.note && (
                                  <p
                                    style={{
                                      fontSize: 13,
                                      color: '#64748B',
                                      margin: '4px 0 0',
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Resume */}
              {resumeUrl && (
                <SideCard
                  title="Resume"
                  icon={
                    <SideIconBox bg="#ECFDF5" color="#10B981">
                      <FileText size={14} />
                    </SideIconBox>
                  }
                >
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#F0FDF4',
                      border: '1px solid #A7F3D0',
                      borderRadius: 12,
                      padding: '12px 14px',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: '#DCFCE7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16A34A',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                        View Resume
                      </div>
                      <div style={{ fontSize: 11, color: '#16A34A', marginTop: 2 }}>
                        PDF · Opens in new tab
                      </div>
                    </div>
                    <ExternalLink size={14} color="#16A34A" />
                  </a>
                </SideCard>
              )}

              {/* Academic Profile */}
              <SideCard
                title="Academic Profile"
                icon={
                  <SideIconBox bg="#EDE9FE" color="#7C3AED">
                    <GraduationCap size={14} />
                  </SideIconBox>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'STUDENT ID', value: student.studentId },
                    { label: 'UNIVERSITY', value: student.university },
                    { label: 'DEPARTMENT', value: student.department },
                    {
                      label: 'YEAR',
                      value: student.yearOfStudy ? `Year ${student.yearOfStudy}` : undefined,
                    },
                    { label: 'SEMESTER', value: student.currentSemester },
                    { label: 'CGPA', value: student.cgpa ? student.cgpa.toFixed(2) : undefined },
                    {
                      label: 'STATUS',
                      value: student.isGraduated ? '🎓 Graduated' : 'Currently Enrolled',
                    },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div key={item.label}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            marginBottom: 1,
                          }}
                        >
                          {item.label}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                </div>
              </SideCard>

              {/* Skills */}
              {student.skills && student.skills.length > 0 && (
                <SideCard
                  title="Skills"
                  icon={
                    <SideIconBox bg="#EFF6FF" color="#2563EB">
                      <Code2 size={14} />
                    </SideIconBox>
                  }
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {student.skills.map((skill: string) => (
                      <span
                        key={skill}
                        style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </SideCard>
              )}

              {/* Completed Courses */}
              {student.completedCourses && student.completedCourses.length > 0 && (
                <SideCard
                  title="Completed Courses"
                  icon={
                    <SideIconBox bg="#F0F9FF" color="#0284C7">
                      <BookOpen size={14} />
                    </SideIconBox>
                  }
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {student.completedCourses.map((course: string) => (
                      <span
                        key={course}
                        style={{
                          background: '#F0F9FF',
                          color: '#0369A1',
                          border: '1px solid #BAE6FD',
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </SideCard>
              )}

              {/* Links */}
              {(student.linkedinUrl || student.githubUrl || student.portfolioUrl) && (
                <SideCard
                  title="Links"
                  icon={
                    <SideIconBox bg="#F8FAFC" color="#64748B">
                      <Link2 size={14} />
                    </SideIconBox>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {student.linkedinUrl && (
                      <a
                        href={student.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          padding: '7px 12px',
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        🔗 LinkedIn Profile
                      </a>
                    )}
                    {student.githubUrl && (
                      <a
                        href={student.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          background: '#F1F5F9',
                          color: '#0F172A',
                          border: '1px solid #E2E8F0',
                          padding: '7px 12px',
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        💻 GitHub Profile
                      </a>
                    )}
                    {student.portfolioUrl && (
                      <a
                        href={student.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          background: '#F5F3FF',
                          color: '#7C3AED',
                          border: '1px solid #DDD6FE',
                          padding: '7px 12px',
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        🌐 Portfolio
                      </a>
                    )}
                  </div>
                </SideCard>
              )}

              {/* Event info */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  padding: '20px 22px',
                }}
              >
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#94A3B8',
                    fontFamily: 'var(--font-display)',
                    margin: '0 0 10px',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Event
                </h3>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>
                  {event.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {formatStatusLabel(event.type)} · {formatStatusLabel(event.locationType)}
                </div>
                {event.applicationDeadline && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    Deadline: {formatShortDate(event.applicationDeadline?.toISOString())}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 860px) {
            .app-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
