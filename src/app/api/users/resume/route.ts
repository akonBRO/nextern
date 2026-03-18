import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'PDF only' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'Max 10MB' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `resume_${session.user.id}_${Date.now()}.pdf`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
  const filepath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });

  await writeFile(filepath, buffer);
  const resumeUrl = `/uploads/resumes/${filename}`;

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { resumeUrl });

  return NextResponse.json({ resumeUrl });
}
