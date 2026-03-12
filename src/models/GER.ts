import mongoose, { Schema, Document } from 'mongoose';

interface IGERCategory {
  score: number; // 0–100 for this category
  weight: number; // % contribution to total (all weights sum to 100)
  breakdown: Record<string, unknown>;
}

export interface IGER extends Document {
  studentId: mongoose.Types.ObjectId;
  isLocked: boolean;
  totalScore: number;
  graduationYear?: string; // 'Spring 2026'

  // 8 weighted categories
  academicPerformance: IGERCategory; // weight: 20
  skillGrowth: IGERCategory; // weight: 15
  platformEngagement: IGERCategory; // weight: 10
  mentorshipActivity: IGERCategory; // weight: 10
  freelanceExperience: IGERCategory; // weight: 15
  peerRecognition: IGERCategory; // weight: 10
  employerEndorsements: IGERCategory; // weight: 10
  opportunityScoreTrajectory: IGERCategory; // weight: 10 — defaults 0 until M3

  resumeUrl?: string;
  pdfUrl?: string;
  shareableToken: string; // unique token for public share link
}

const CategorySchema = new Schema(
  { score: Number, weight: Number, breakdown: Schema.Types.Mixed },
  { _id: false }
);

const GERSchema = new Schema<IGER>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isLocked: { type: Boolean, default: false },
    totalScore: { type: Number, default: 0, min: 0, max: 100 },
    graduationYear: { type: String },
    academicPerformance: { type: CategorySchema, default: { score: 0, weight: 20, breakdown: {} } },
    skillGrowth: { type: CategorySchema, default: { score: 0, weight: 15, breakdown: {} } },
    platformEngagement: { type: CategorySchema, default: { score: 0, weight: 10, breakdown: {} } },
    mentorshipActivity: { type: CategorySchema, default: { score: 0, weight: 10, breakdown: {} } },
    freelanceExperience: { type: CategorySchema, default: { score: 0, weight: 15, breakdown: {} } },
    peerRecognition: { type: CategorySchema, default: { score: 0, weight: 10, breakdown: {} } },
    employerEndorsements: {
      type: CategorySchema,
      default: { score: 0, weight: 10, breakdown: {} },
    },
    opportunityScoreTrajectory: {
      type: CategorySchema,
      default: { score: 0, weight: 10, breakdown: {} },
    },
    resumeUrl: { type: String },
    pdfUrl: { type: String },
    shareableToken: { type: String, unique: true },
  },
  { timestamps: true }
);

export const GER = mongoose.models.GER || mongoose.model<IGER>('GER', GERSchema);
