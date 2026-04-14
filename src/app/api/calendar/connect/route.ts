// src/app/api/calendar/connect/route.ts
// Starts Google OAuth through NextAuth so the callback receives the
// expected auth state cookies while still requesting calendar scope.

import { NextRequest, NextResponse } from 'next/server';
import { auth, signIn } from '@/lib/auth';

const DEFAULT_CALLBACK_URL = '/student/dashboard?calendar=connected#calendar';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
  const redirectTo =
    callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : DEFAULT_CALLBACK_URL;

  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('callbackUrl', redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  const redirectUrl = await signIn(
    'google',
    {
      redirect: false,
      redirectTo,
    },
    {
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
      scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'].join(' '),
    }
  );

  if (typeof redirectUrl === 'string') {
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(redirectTo, baseUrl));
}
