// src/app/student/jobs/page.tsx
// Student personalized job feed — uses DashboardShell + DashboardContent

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  HeroCard,
  ActionLink,
  Panel,
} from '@/components/dashboard/DashboardContent';
import JobFeedClient from './JobFeedClient';

const navItems = [
  { label: 'Dashboard', href: '/student/dashboard', icon: 'dashboard' as const },
  { label: 'Jobs', href: '/student/jobs', icon: 'briefcase' as const },
  {
    label: 'Track',
    icon: 'file' as const,
    items: [
      {
        label: 'My Applications',
        href: '/student/applications',
        description: 'Track your submitted applications and their status.',
        icon: 'file' as const,
      },
    ],
  },
];

async function getJobFeedData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [student, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select(
        'name email image university department yearOfStudy skills cgpa opportunityScore profileCompleteness'
      )
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!student) return null;

  // Build personalized query
  const query: Record<string, unknown> = {
    isActive: true,
    applicationDeadline: { $gte: new Date() },
  };
  if (student.university) {
    query.$or = [{ targetUniversities: { $size: 0 } }, { targetUniversities: student.university }];
  }
  if (student.department) {
    query.$and = [
      ...((query.$and as Record<string, unknown>[]) ?? []),
      {
        $or: [{ targetDepartments: { $size: 0 } }, { targetDepartments: student.department }],
      },
    ];
  }

  const [jobs, appliedJobIds] = await Promise.all([
    Job.find(query).sort({ isPremiumListing: -1, createdAt: -1 }).limit(30).lean(),
    Application.find({ studentId: oid, isWithdrawn: { $ne: true } })
      .select('jobId')
      .lean()
      .then((apps) => new Set(apps.map((a) => a.jobId.toString()))),
  ]);

  // Compute simple fit score for each job
  const userSkills = new Set((student.skills ?? []).map((s: string) => s.toLowerCase()));

  const enrichedJobs = jobs.map((job) => {
    const matched = (job.requiredSkills ?? []).filter((s: string) =>
      userSkills.has(s.toLowerCase())
    ).length;
    const total = (job.requiredSkills ?? []).length;
    const fitScore = total > 0 ? Math.round((matched / total) * 100) : null;
    return {
      _id: job._id.toString(),
      title: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      type: job.type,
      locationType: job.locationType,
      city: job.city,
      stipendBDT: job.stipendBDT,
      isStipendNegotiable: job.isStipendNegotiable,
      applicationDeadline: job.applicationDeadline?.toISOString(),
      requiredSkills: (job.requiredSkills ?? []).slice(0, 5),
      applicationCount: job.applicationCount ?? 0,
      isBatchHiring: job.isBatchHiring,
      isPremiumListing: job.isPremiumListing,
      fitScore,
      hasApplied: appliedJobIds.has(job._id.toString()),
    };
  });

  return {
    student,
    jobs: enrichedJobs,
    totalJobs: jobs.length,
    appliedCount: appliedJobIds.size,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function StudentJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const data = await getJobFeedData(session.user.id);
  if (!data) redirect('/login');

  const { student, jobs, totalJobs, appliedCount, chrome } = data;

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={navItems}
      user={{
        name: student.name,
        email: student.email,
        image: student.image,
        subtitle:
          [student.university, student.department].filter(Boolean).join(' | ') ||
          'Student workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Job & internship feed"
          title="Your personalized opportunities"
          description="Jobs below are matched to your university and department. Each card shows your skill fit score so you know where you stand before applying."
          actions={
            <>
              <ActionLink href="/student/applications" label="My applications" />
              <ActionLink href="/student/dashboard" label="Back to dashboard" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Your readiness"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Listings', value: totalJobs, color: '#F8FAFC' },
                  { label: 'Applied', value: appliedCount, color: '#22D3EE' },
                  { label: 'Opp. Score', value: student.opportunityScore ?? 0, color: '#10B981' },
                  {
                    label: 'Profile',
                    value: `${student.profileCompleteness ?? 0}%`,
                    color: '#F59E0B',
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: s.color,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ color: '#9FB4D0', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          }
        />

        <JobFeedClient jobs={jobs} />
      </DashboardPage>
    </DashboardShell>
  );
}
