// src/lib/otp.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { OTP } from '@/models/OTP';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 10;

/**
 * Generates a 6-digit OTP, hashes it, stores in DB, returns plain OTP for email.
 * Deletes any existing OTP for same email+type before creating a new one.
 */
export async function generateOTP(
  email: string,
  type: 'email_verify' | 'password_reset'
): Promise<string> {
  await connectDB();

  // Delete any existing OTP for this email+type
  await OTP.deleteMany({ email: email.toLowerCase(), type });

  // Generate cryptographically secure 6-digit OTP
  const plain = crypto.randomInt(100000, 999999).toString();

  // Hash before storing — even OTPs should not be stored plain
  const hashed = await bcrypt.hash(plain, BCRYPT_ROUNDS);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OTP.create({
    email: email.toLowerCase(),
    otp: hashed,
    type,
    expiresAt,
  });

  return plain; // Return plain OTP — send this in email, never store it
}

/**
 * Verifies OTP. Returns { valid: true } or { valid: false, reason: string }.
 * Increments attempt counter on wrong OTP.
 * Deletes OTP document on successful verification.
 */
export async function verifyOTP(
  email: string,
  plainOTP: string,
  type: 'email_verify' | 'password_reset'
): Promise<{ valid: boolean; reason?: string }> {
  await connectDB();

  const record = await OTP.findOne({
    email: email.toLowerCase(),
    type,
  });

  if (!record) {
    return { valid: false, reason: 'No OTP found. Please request a new code.' };
  }

  if (new Date() > record.expiresAt) {
    await OTP.deleteOne({ _id: record._id });
    return { valid: false, reason: 'OTP has expired. Please request a new code.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: record._id });
    return { valid: false, reason: 'Too many failed attempts. Please request a new code.' };
  }

  const isMatch = await bcrypt.compare(plainOTP, record.otp);

  if (!isMatch) {
    await OTP.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
    const remaining = MAX_ATTEMPTS - record.attempts - 1;
    return { valid: false, reason: `Incorrect code. ${remaining} attempt(s) remaining.` };
  }

  // Valid — delete OTP so it cannot be reused
  await OTP.deleteOne({ _id: record._id });
  return { valid: true };
}
