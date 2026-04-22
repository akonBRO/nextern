// src/types/next-auth.d.ts
// Augments NextAuth session and JWT types to include Nextern-specific fields.
// Without this file, TypeScript will error when accessing session.user.role etc.

import { DefaultSession, DefaultJWT } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'student' | 'employer' | 'advisor' | 'dept_head' | 'admin' | 'alumni';
      isVerified: boolean;
      isEmailVerified: boolean;
      verificationStatus?: 'pending' | 'approved' | 'rejected';
      mustChangePassword?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'student' | 'employer' | 'advisor' | 'dept_head' | 'admin' | 'alumni';
    isVerified: boolean;
    isEmailVerified: boolean;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    mustChangePassword?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: 'student' | 'employer' | 'advisor' | 'dept_head' | 'admin' | 'alumni';
    isVerified: boolean;
    isEmailVerified: boolean;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    mustChangePassword?: boolean;
  }
}
