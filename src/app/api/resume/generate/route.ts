// src/app/api/resume/generate/route.ts
// GET /api/resume/generate

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateResumePDF, type ResumeData } from '@/lib/resume-pdf';

type Project = {
  title?: string;
  description?: string;
  techStack?: string[];
  projectUrl?: string;
  repoUrl?: string;
};

type Certification = {
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

    const resumeData: ResumeData = {
      name: user.name ?? 'Student',
      email: user.email ?? '',
      phone: user.phone ?? undefined,
      city: user.city ?? undefined,
      bio: user.bio ?? undefined,
      image: user.image ?? undefined, // ← profile photo for PDF
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

      projects: (user.projects ?? []).map((p: Project) => ({
        title: p.title ?? '',
        description: p.description ?? '',
        techStack: p.techStack ?? [],
        projectUrl: p.projectUrl ?? undefined,
        repoUrl: p.repoUrl ?? undefined,
      })),

      certifications: (user.certifications ?? []).map((c: Certification) => ({
        name: c.name ?? '',
        issuedBy: c.issuedBy ?? '',
        issueDate: c.issueDate ? new Date(c.issueDate).toISOString() : undefined,
        credentialUrl: c.credentialUrl ?? undefined,
      })),
    };

    // generateResumePDF is now async — fetches profile image internally
    const pdfBuffer = await generateResumePDF(resumeData);
    const uint8Array = new Uint8Array(pdfBuffer);
    const safeName = (user.name ?? 'Resume').replace(/\s+/g, '_');

    return new NextResponse(uint8Array, {
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
