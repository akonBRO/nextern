import mongoose, { Schema, Document } from 'mongoose';

export interface IBadgeDefinition extends Document {
  badgeSlug: string; // 'top-applicant', 'skill-champion', etc.
  name: string;
  description: string;
  icon: string; // emoji or Uploadthing URL
  category: 'student' | 'employer' | 'advisor' | 'dept_head';
  criteria: string; // human-readable requirement
  triggerEvent: string; // maps to lib/events.ts function name
  thresholdValue: number; // how many times event must fire
  aiWeightBoost: number; // bonus in recommendation ranking
  opportunityScorePoints: number; // points added to Opportunity Score
  marksReward: number; // GER totalScore points (students) or profile value points
}

const BadgeDefinitionSchema = new Schema<IBadgeDefinition>(
  {
    badgeSlug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: { type: String, enum: ['student', 'employer', 'advisor', 'dept_head'], required: true },
    criteria: { type: String, required: true },
    triggerEvent: { type: String, required: true },
    thresholdValue: { type: Number, default: 1 },
    aiWeightBoost: { type: Number, default: 0 },
    opportunityScorePoints: { type: Number, default: 5 },
    marksReward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BadgeDefinition =
  mongoose.models.BadgeDefinition ||
  mongoose.model<IBadgeDefinition>('BadgeDefinition', BadgeDefinitionSchema);
