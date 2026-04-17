import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicReview extends Document {
  studentId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  reviewerRole: 'advisor' | 'dept_head';
  university: string;
  department: string;
  headline: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  readinessLevel: 'priority_support' | 'developing' | 'ready';
  profileScore?: number;
  status: 'active' | 'archived';
}

const AcademicReviewSchema = new Schema<IAcademicReview>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerRole: {
      type: String,
      enum: ['advisor', 'dept_head'],
      required: true,
    },
    university: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    headline: { type: String, required: true, maxlength: 160, trim: true },
    summary: { type: String, required: true, maxlength: 2400 },
    strengths: [{ type: String }],
    growthAreas: [{ type: String }],
    readinessLevel: {
      type: String,
      enum: ['priority_support', 'developing', 'ready'],
      default: 'developing',
    },
    profileScore: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

AcademicReviewSchema.index({ studentId: 1, status: 1, createdAt: -1 });
AcademicReviewSchema.index({ reviewerId: 1, status: 1, createdAt: -1 });

export const AcademicReview =
  mongoose.models.AcademicReview ||
  mongoose.model<IAcademicReview>('AcademicReview', AcademicReviewSchema);
