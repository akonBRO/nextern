// src/app/api/ger/generate/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateGERPDF } from '@/lib/ger-pdf';
import { buildGERData } from '@/lib/ger-data';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check graduation status before doing heavy work
    await connectDB();
    const user = await User.findById(session.user.id).select('isGraduated role name').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'GER is only available for students' }, { status: 403 });
    }
    if (!user.isGraduated) {
      return NextResponse.json(
        { error: 'GER is only available after marking graduation on your profile.' },
        { status: 403 }
      );
    }

    const { gerData } = await buildGERData(session.user.id);
    const pdfBuffer = await generateGERPDF(gerData);

    const safeName = (user.name ?? 'Student').replace(/\s+/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_GER.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate GER';
    console.error('[GER GENERATE ERROR]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
