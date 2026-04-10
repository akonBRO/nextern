// src/app/api/resume/generate/route.ts
// GET /api/resume/generate
// Generates a professional PDF resume from the student's profile + platform activity

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { generateResumePDF, type ResumeData } from '@/lib/resume-pdf';
import mongoose from 'mongoose';

type ProjectDoc = {
  title?: string;
  description?: string;
  techStack?: string[];
  projectUrl?: string;
  repoUrl?: string;
};

type CertDoc = {
  name?: string;
  issuedBy?: string;
  issueDate?: Date;
  credentialUrl?: string;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('-password').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Resume generation is only available for students.' },
        { status: 403 }
      );
    }

    const oid = new mongoose.Types.ObjectId(session.user.id);

    // ── Fetch platform activity ──────────────────────────────────────────
    const applications = await Application.find({ studentId: oid })
      .populate('jobId', 'title type companyName city locationType stipendBDT durationMonths')
      .sort({ appliedAt: -1 })
      .lean();

    const jobApplications = applications
      .filter((a) => !a.isEventRegistration)
      .map((a) => {
        const job = a.jobId as Record<string, unknown> | null;
        return {
          status: a.status,
          appliedAt: a.appliedAt ? (a.appliedAt as Date).toISOString() : null,
          fitScore: (a.fitScore as number) ?? null,
          job: job
            ? {
                title: job.title as string,
                type: job.type as string,
                companyName: job.companyName as string,
                city: (job.city as string) ?? null,
                locationType: job.locationType as string,
                stipendBDT: (job.stipendBDT as number) ?? null,
                durationMonths: (job.durationMonths as number) ?? null,
              }
            : null,
        };
      });

    const eventRegistrations = applications
      .filter((a) => a.isEventRegistration)
      .map((a) => {
        const job = a.jobId as Record<string, unknown> | null;
        return {
          status: a.status,
          appliedAt: a.appliedAt ? (a.appliedAt as Date).toISOString() : null,
          job: job
            ? {
                title: job.title as string,
                type: job.type as string,
                companyName: job.companyName as string,
              }
            : null,
        };
      });

    // ── Build ResumeData ─────────────────────────────────────────────────
    const resumeData: ResumeData = {
      name: user.name ?? 'Student',
      email: user.email ?? '',
      phone: user.phone ?? undefined,
      city: user.city ?? undefined,
      bio: user.bio ?? undefined,
      image: user.image ?? undefined,
      university: user.university ?? undefined,
      department: user.department ?? undefined,
      yearOfStudy: user.yearOfStudy ?? undefined,
      currentSemester: user.currentSemester ?? undefined,
      cgpa: user.cgpa ?? undefined,
      studentId: user.studentId ?? undefined,
      linkedinUrl: user.linkedinUrl ?? undefined,
      githubUrl: user.githubUrl ?? undefined,
      portfolioUrl: user.portfolioUrl ?? undefined,
      opportunityScore: user.opportunityScore ?? 0,
      skills: user.skills ?? [],
      completedCourses: user.completedCourses ?? [],

      projects: (user.projects ?? []).map((p: ProjectDoc) => ({
        title: p.title ?? '',
        description: p.description ?? '',
        techStack: p.techStack ?? [],
        projectUrl: p.projectUrl ?? undefined,
        repoUrl: p.repoUrl ?? undefined,
      })),

      certifications: (user.certifications ?? []).map((c: CertDoc) => ({
        name: c.name ?? '',
        issuedBy: c.issuedBy ?? '',
        issueDate: c.issueDate ? new Date(c.issueDate).toISOString() : undefined,
        credentialUrl: c.credentialUrl ?? undefined,
      })),

      jobApplications,
      eventRegistrations,
    };

    const pdfBuffer = await generateResumePDF(resumeData);
    const safeName = (user.name ?? 'Resume').replace(/\s+/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_Resume.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[RESUME GENERATE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate resume. Please try again.' },
      { status: 500 }
    );
  }
}
