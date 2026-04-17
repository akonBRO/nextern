// src/lib/auth.ts
// NextAuth v5 configuration. This is the single source of truth for authentication.
// Exports: auth (session getter), handlers (GET/POST for route), signIn, signOut

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

const authSecret = (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET)?.trim();

function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function hasGoogleCalendarScope(scope?: string | null): boolean {
  if (typeof scope !== 'string') return false;

  const grantedScopes = new Set(scope.split(/\s+/).filter(Boolean));
  return (
    grantedScopes.has('https://www.googleapis.com/auth/calendar') ||
    grantedScopes.has('https://www.googleapis.com/auth/calendar.events')
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ── Providers ──────────────────────────────────────────────────────────
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        // Find user — explicitly select password (marked select:false in schema)
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase().trim(),
        }).select('+password');

        if (!user) return null;
        if (!user.password) return null; // Google OAuth user — cannot use credentials

        const passwordMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (!passwordMatch) return null;

        // Block unverified emails from logging in
        if (!user.isVerified) {
          // Throwing here sends error to the login page
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isVerified: user.isVerified,
          isEmailVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],

  // ── Session strategy ────────────────────────────────────────────────────
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh token every 24h
  },

  // ── JWT settings ────────────────────────────────────────────────────────
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  // ── Callbacks ───────────────────────────────────────────────────────────
  callbacks: {
    /**
     * JWT callback — runs whenever a JWT is created or updated.
     * This is where we embed role, verification status etc. into the token.
     */
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, `user` is populated
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.isEmailVerified = user.isEmailVerified;
        token.verificationStatus = user.verificationStatus;
        token.mustChangePassword = user.mustChangePassword;
        token.picture = user.image; // ✅ ensure picture is set initially
      }

      // Heal stale or provider-derived tokens that do not carry our MongoDB user id.
      if ((!isValidObjectId(token.id) || !token.role) && token.email) {
        await connectDB();
        const dbUser = await User.findOne({
          email: token.email.toLowerCase().trim(),
        }).select('_id role isVerified verificationStatus image mustChangePassword');

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.isVerified = dbUser.isVerified;
          token.isEmailVerified = dbUser.isVerified;
          token.verificationStatus = dbUser.verificationStatus;
          token.mustChangePassword = dbUser.mustChangePassword;
          token.picture = dbUser.image ?? token.picture; // ✅ keep image synced
        }
      }

      // On session update (e.g. after profile change), refresh from DB
      if (trigger === 'update' && session) {
        await connectDB();
        const freshUser = isValidObjectId(token.id) ? await User.findById(token.id) : null;
        if (freshUser) {
          token.id = freshUser._id.toString();
          token.role = freshUser.role;
          token.isVerified = freshUser.isVerified;
          token.isEmailVerified = freshUser.isVerified;
          token.verificationStatus = freshUser.verificationStatus;
          token.mustChangePassword = freshUser.mustChangePassword;
          token.picture = freshUser.image ?? token.picture; // ← ✅ ADDED LINE
        }
      }

      return token;
    },

    /**
     * Session callback — runs whenever a session is accessed.
     * Exposes token fields to the client via useSession() / auth().
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = token.role as
          | 'student'
          | 'employer'
          | 'advisor'
          | 'dept_head'
          | 'admin';
        session.user.isVerified = token.isVerified as boolean;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
        session.user.verificationStatus = token.verificationStatus as
          | 'pending'
          | 'approved'
          | 'rejected'
          | undefined;
        session.user.mustChangePassword = token.mustChangePassword as boolean | undefined;

        // ✅ ADD THIS LINE (sync image to frontend)
        session.user.image = (token.picture ?? session.user.image) as string | null;
      }
      return session;
    },

    /**
     * SignIn callback — handles Google OAuth user creation/linking.
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB();
        const grantedCalendarAccess = hasGoogleCalendarScope(account.scope);

        const existingUser = await User.findOne({ email: user.email?.toLowerCase() });

        if (existingUser && ['advisor', 'dept_head'].includes(existingUser.role)) {
          return false;
        }

        if (!existingUser) {
          const createdUser = await User.create({
            name: user.name,
            email: user.email?.toLowerCase(),
            image: user.image,
            role: 'student',
            isVerified: true,
            verificationStatus: 'approved',
            // ── Save refresh token if provided ──
            ...(account.refresh_token && grantedCalendarAccess
              ? {
                  googleRefreshToken: account.refresh_token,
                  googleCalendarConnected: true,
                }
              : {}),
          });
          user.id = createdUser._id.toString();
          user.role = createdUser.role;
          user.isVerified = createdUser.isVerified;
          user.verificationStatus = createdUser.verificationStatus;
          user.mustChangePassword = createdUser.mustChangePassword;
        } else {
          if (user.image && !existingUser.image) {
            await User.findByIdAndUpdate(existingUser._id, { image: user.image });
          }
          // ── Update refresh token if a new one was issued ──
          if (account.refresh_token && grantedCalendarAccess) {
            await User.findByIdAndUpdate(existingUser._id, {
              googleRefreshToken: account.refresh_token,
              googleCalendarConnected: true,
            });
          }
          user.id = existingUser._id.toString();
          user.role = existingUser.role;
          user.isVerified = existingUser.isVerified;
          user.verificationStatus = existingUser.verificationStatus;
          user.mustChangePassword = existingUser.mustChangePassword;
        }
      }
      return true;
    },
  },

  // ── Pages ────────────────────────────────────────────────────────────────
  pages: {
    signIn: '/login',
    error: '/login', // errors passed as ?error= query param
  },

  // ── Secret ───────────────────────────────────────────────────────────────
  secret: authSecret,
  trustHost: true,

  // ── Debug (disable in production) ────────────────────────────────────────
  debug: process.env.NODE_ENV === 'development',
});
