// src/app/api/badges/route.ts
// GET /api/badges             — Returns user's earned badges
// GET /api/badges/definitions — Returns all available badge definitions

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getBadgeDefinitions } from '@/lib/badge-definitions';
import { BadgeAward } from '@/models/BadgeAward';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { pathname } = new URL(req.url);

    // GET /api/badges/definitions (Public or authenticated)
    if (pathname.endsWith('/definitions')) {
      return NextResponse.json({ definitions: getBadgeDefinitions() });
    }

    // GET /api/badges (Authenticated user only)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const badges = await BadgeAward.find({ userId: session.user.id })
      .sort({ awardedAt: -1 })
      .lean();

    return NextResponse.json({ badges });
  } catch (error) {
    console.error('[GET BADGES ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
