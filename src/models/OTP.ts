// src/models/OTP.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string; // bcrypt-hashed 6-digit code — never store plain
  type: 'email_verify' | 'password_reset';
  expiresAt: Date; // TTL index deletes document automatically
  attempts: number; // max 3 attempts before OTP is invalidated
}

const OTPSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ['email_verify', 'password_reset'], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, max: 3 },
  },
  { timestamps: true }
);

// Compound index — one active OTP per email per type
OTPSchema.index({ email: 1, type: 1 });

// TTL index — MongoDB deletes document automatically when expiresAt is reached
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
