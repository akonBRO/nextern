// src/app/api/calendar/disconnect/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    await User.findByIdAndUpdate(session.user.id, {
      $unset: { googleRefreshToken: '' },
      googleCalendarConnected: false,
    });

    return NextResponse.json({ message: 'Calendar disconnected' });
  } catch (err) {
    console.error('[CALENDAR DISCONNECT ERROR]', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
