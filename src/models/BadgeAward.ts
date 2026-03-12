// src/models/BadgeAward.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBadgeAward extends Document {
  userId: mongoose.Types.ObjectId;
  badgeSlug: string; // denormalized for fast profile display
  badgeName: string; // denormalized
  badgeIcon: string; // denormalized
  awardedAt: Date;
  evidenceData: Record<string, unknown>; // {jobId, count, skillName} etc. // {jobId, count, skillName} etc.
  isDisplayed: boolean; // student can hide badges
}

const BadgeAwardSchema = new Schema<IBadgeAward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    badgeSlug: { type: String, required: true },
    badgeName: { type: String, required: true },
    badgeIcon: { type: String, required: true },
    awardedAt: { type: Date, default: Date.now },
    evidenceData: { type: Schema.Types.Mixed, default: {} },
    isDisplayed: { type: Boolean, default: true },
  },
  { timestamps: false }
);

BadgeAwardSchema.index({ userId: 1 });
BadgeAwardSchema.index({ userId: 1, badgeSlug: 1 }, { unique: true });

export const BadgeAward =
  mongoose.models.BadgeAward || mongoose.model<IBadgeAward>('BadgeAward', BadgeAwardSchema);
