// src/app/api/auth/register/route.ts
// POST /api/auth/register
// Creates a new user account, sends OTP verification email.
// All roles supported. Employer/Advisor/DeptHead marked pending for admin approval.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateOTP } from '@/lib/otp';
import { sendEmail, otpEmailTemplate, welcomeEmailTemplate } from '@/lib/email';
import { RegisterSchema } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const rl = rateLimit(`register:${ip}`, rateLimits.register);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // ── Parse & validate ─────────────────────────────────────────────────
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await connectDB();

    // ── Duplicate email check ─────────────────────────────────────────────
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // ── Hash password ─────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // ── Build user object based on role ───────────────────────────────────
    const userPayload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isVerified: false, // requires email OTP verification
      verificationStatus: data.role === 'student' ? 'approved' : 'pending',
      // Students are auto-approved; others require admin approval
    };

    if (data.role === 'student') {
      userPayload.university = data.university;
      userPayload.department = data.department;
      userPayload.yearOfStudy = data.yearOfStudy;
      userPayload.studentId = data.studentId;
      userPayload.opportunityScore = 0;
      userPayload.profileCompleteness = 20; // Basic info filled
    }

    if (data.role === 'employer') {
      userPayload.companyName = data.companyName;
      userPayload.industry = data.industry;
      userPayload.tradeLicenseNo = data.tradeLicenseNo;
      userPayload.headquartersCity = data.headquartersCity;
    }

    if (data.role === 'advisor' || data.role === 'dept_head') {
      userPayload.institutionName = data.institutionName;
      userPayload.advisorStaffId = data.advisorStaffId;
      userPayload.designation = data.designation;
      userPayload.advisoryDepartment = data.advisoryDepartment;
    }

    // ── Create user ───────────────────────────────────────────────────────
    const user = await User.create(userPayload);

    // ── Generate & send OTP ───────────────────────────────────────────────
    const otp = await generateOTP(data.email, 'email_verify');

    await sendEmail({
      to: data.email,
      subject: 'Verify your Nextern email address',
      html: otpEmailTemplate(otp, data.name),
    });

    // ── Return (never return password or sensitive fields) ─────────────────
    return NextResponse.json(
      {
        message: 'Account created. Please check your email for the verification code.',
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        requiresEmailVerification: true,
        requiresAdminApproval: data.role !== 'student',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
