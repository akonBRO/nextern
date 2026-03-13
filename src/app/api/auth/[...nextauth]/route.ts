// src/app/api/auth/[...nextauth]/route.ts
// NextAuth v5 route handler. This single file handles all NextAuth endpoints:
// GET  /api/auth/session
// GET  /api/auth/providers
// GET  /api/auth/csrf
// GET  /api/auth/callback/google
// POST /api/auth/callback/credentials
// POST /api/auth/signout

export { handlers as GET, handlers as POST } from '@/lib/auth';
import { handlers } from '@/lib/auth';
