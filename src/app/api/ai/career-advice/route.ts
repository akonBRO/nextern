import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { generateCareerAdvice } from '@/lib/gemini';
import { User } from '@/models/User';
import { FeatureUsage } from '@/models/FeatureUsage';

const Schema = z.object({
  question: z.string().min(8).max(400),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can use this feature.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid question.' }, { status: 400 });
    }

    await connectDB();

    const student = await User.findById(session.user.id)
      .select('university department yearOfStudy cgpa skills')
      .lean();

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const result = await generateCareerAdvice({
      question: parsed.data.question,
      studentProfile: {
        university: student.university ?? 'Not set',
        department: student.department ?? 'Not set',
        yearOfStudy: student.yearOfStudy ?? 1,
        cgpa: student.cgpa ?? 0,
        skills: student.skills ?? [],
      },
    });

    await FeatureUsage.create({
      userId: session.user.id,
      feature: 'career_advice',
      metadata: {
        question: parsed.data.question.slice(0, 120),
      },
    });

    return NextResponse.json({ answer: result.data, meta: result.meta });
  } catch (error) {
    console.error('[AI CAREER ADVICE ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate career advice.' }, { status: 500 });
  }
}
