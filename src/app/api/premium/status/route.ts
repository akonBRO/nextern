import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUsageSummary } from '@/lib/premium';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isPremium: false, isActive: false });
    }

    const usage = await getUsageSummary(session.user.id);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('[PREMIUM STATUS ERROR]', error);
    return NextResponse.json({ isPremium: false, isActive: false });
  }
}
