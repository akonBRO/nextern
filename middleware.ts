// src/middleware.ts
// Next.js Edge Middleware runs before every request.
// Handles: auth guards, role-based redirects, email verification check.

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-email', '/api/auth'];

// Routes accessible only while NOT authenticated (redirect logged-in users away)
const AUTH_ONLY_ROUTES = ['/login', '/register', '/verify-email'];

// Role to dashboard route mapping
const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  employer: '/employer/dashboard',
  advisor: '/advisor/dashboard',
  dept_head: '/dept/dashboard',
  admin: '/admin/dashboard',
} as const;

type UserRole = keyof typeof ROLE_DASHBOARDS;
type VerificationStatus = 'pending' | 'approved' | 'rejected';

type MiddlewareToken = {
  sub?: string;
  email?: string | null;
  role?: UserRole;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
};

// Protected route prefixes and their allowed roles
const ROLE_ROUTES: { prefix: string; roles: UserRole[] }[] = [
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

  const token = (await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })) as MiddlewareToken | null;

  const isAuthenticated = !!token?.sub;

  // Redirect logged-in users away from auth pages
  if (isAuthenticated && AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    const dashboard = token?.role ? ROLE_DASHBOARDS[token.role] : '/';
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  // Public routes are always accessible
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Require authentication for everything else
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Require email verification
  if (!token?.isVerified) {
    const verifyUrl = new URL('/verify-email', req.url);
    verifyUrl.searchParams.set('email', token?.email ?? '');
    return NextResponse.redirect(verifyUrl);
  }

  // Employer requires admin approval before accessing employer routes
  if (
    token.role === 'employer' &&
    token.verificationStatus !== 'approved' &&
    pathname.startsWith('/employer')
  ) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }

  // Advisor and dept head require admin approval
  if (
    (token.role === 'advisor' || token.role === 'dept_head') &&
    token.verificationStatus !== 'approved' &&
    (pathname.startsWith('/advisor') || pathname.startsWith('/dept'))
  ) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }

  // Enforce role-based route access
  for (const { prefix, roles } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix) && (!token?.role || !roles.includes(token.role))) {
      const correctDashboard = token?.role ? ROLE_DASHBOARDS[token.role] : '/';
      return NextResponse.redirect(new URL(correctDashboard, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
