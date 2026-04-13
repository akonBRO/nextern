// src/app/api/users/profile/route.ts
// GET  /api/users/profile  — returns authenticated user's full profile
// PATCH /api/users/profile — updates profile based on role

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import {
  UpdateStudentProfileSchema,
  UpdateEmployerProfileSchema,
  UpdateAdvisorProfileSchema,
  ChangePasswordSchema,
} from '@/lib/validations';
import { z } from 'zod';
import { onProfileVerified } from '@/lib/events';

// ── GET /api/users/profile ────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[GET PROFILE ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// ── PATCH /api/users/profile ──────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await connectDB();
    const user = await User.findById(session.user.id).select('+password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ── Change password ───────────────────────────────────────────────────
    if (action === 'change_password') {
      const parsed = ChangePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { error: 'This account uses Google sign-in. Password cannot be changed here.' },
          { status: 400 }
        );
      }
      const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
      if (!matches) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }
      const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
      await User.findByIdAndUpdate(user._id, { password: hashed });
      return NextResponse.json({ message: 'Password updated successfully.' });
    }

    // ── Profile update — pick schema by role ──────────────────────────────
    let schema;
    if (user.role === 'student') schema = UpdateStudentProfileSchema;
    else if (user.role === 'employer') schema = UpdateEmployerProfileSchema;
    else schema = UpdateAdvisorProfileSchema; // advisor + dept_head

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { ...parsed.data };
    if ('isGraduated' in parsed.data) {
      updates.isGraduated = parsed.data.isGraduated;
    }

    // Recalculate profile completeness for students
    if (user.role === 'student') {
      const updatedUser = { ...user.toObject(), ...parsed.data };
      updates.profileCompleteness = calculateStudentCompleteness(updatedUser);
    }

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    // Trigger badge evaluation
    if (user.role === 'student' && updated?.cgpa >= 3.5) {
      await onProfileVerified(user._id.toString()).catch(console.error);
    }

    return NextResponse.json({ message: 'Profile updated successfully.', user: updated });
  } catch (error) {
    console.error('[UPDATE PROFILE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// ── Student profile completeness ──────────────────────────────────────────
function calculateStudentCompleteness(user: Record<string, unknown>): number {
  const checks = [
    { field: 'name', weight: 10 },
    { field: 'phone', weight: 5 },
    { field: 'bio', weight: 10 },
    { field: 'university', weight: 10 },
    { field: 'department', weight: 10 },
    { field: 'cgpa', weight: 10 },
    { field: 'resumeUrl', weight: 10 },
    { field: 'generatedResumeUrl', weight: 5 },
    { field: 'skills', weight: 10, isArray: true },
    { field: 'completedCourses', weight: 5, isArray: true },
    { field: 'projects', weight: 5, isArray: true },
    { field: 'linkedinUrl', weight: 5 },
    { field: 'image', weight: 5 },
  ];
  let total = 0;
  for (const check of checks) {
    const val = user[check.field];
    if (check.isArray) {
      if (Array.isArray(val) && val.length > 0) total += check.weight;
    } else {
      if (val) total += check.weight;
    }
  }
  return Math.min(total, 100);
}
