// src/app/api/ger/preview/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildGERData } from '@/lib/ger-data';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gerData, meta } = await buildGERData(session.user.id);

    return NextResponse.json({ gerData, ...meta });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load GER data';
    console.error('[GER PREVIEW ERROR]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
