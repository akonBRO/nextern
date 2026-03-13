// src/middleware.ts
// Next.js Edge Middleware — runs before every request.
// Handles: auth guards, role-based redirects, email verification check.
// This file is the single gatekeeper for all protected routes.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-email', '/api/auth'];

// Routes accessible only while NOT authenticated (redirect logged-in users away)
const AUTH_ONLY_ROUTES = ['/login', '/register', '/verify-email'];

// Role → dashboard route mapping
const ROLE_DASHBOARDS: Record<string, string> = {
  student: '/student/dashboard',
  employer: '/employer/dashboard',
  advisor: '/advisor/dashboard',
  dept_head: '/dept/dashboard',
  admin: '/admin/dashboard',
};

// Protected route prefixes and their allowed roles
const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/student', roles: ['student'] },
  { prefix: '/employer', roles: ['employer'] },
  { prefix: '/advisor', roles: ['advisor'] },
  { prefix: '/dept', roles: ['dept_head'] },
  { prefix: '/admin', roles: ['admin'] },
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets and NextAuth internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthenticated = !!session?.user;

  // ── Redirect logged-in users away from auth pages ──────────────────────
  if (isAuthenticated && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    const dashboard = ROLE_DASHBOARDS[session.user.role] ?? '/';
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  // ── Public routes — allow through ──────────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // ── Require authentication ─────────────────────────────────────────────
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Require email verification ─────────────────────────────────────────
  if (!session.user.isVerified) {
    const verifyUrl = new URL('/verify-email', req.url);
    verifyUrl.searchParams.set('email', session.user.email ?? '');
    return NextResponse.redirect(verifyUrl);
  }

  // ── Employer: require admin approval before accessing employer routes ───
  if (
    session.user.role === 'employer' &&
    session.user.verificationStatus !== 'approved' &&
    pathname.startsWith('/employer')
  ) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }

  // ── Advisor / DeptHead: require admin approval ─────────────────────────
  if (
    (session.user.role === 'advisor' || session.user.role === 'dept_head') &&
    session.user.verificationStatus !== 'approved' &&
    (pathname.startsWith('/advisor') || pathname.startsWith('/dept'))
  ) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }

  // ── Role-based route access control ───────────────────────────────────
  for (const { prefix, roles } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix)) {
      if (!roles.includes(session.user.role)) {
        // Wrong role — redirect to their own dashboard
        const correctDashboard = ROLE_DASHBOARDS[session.user.role] ?? '/';
        return NextResponse.redirect(new URL(correctDashboard, req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
