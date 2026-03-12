import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId; // must have status = 'hired'
  reviewType: 'student_to_employer' | 'employer_to_student';

  // student → employer ratings
  overallRating?: number; // 1–5
  workEnvironmentRating?: number; // 1–5
  learningOpportunityRating?: number; // 1–5
  mentorshipQualityRating?: number; // 1–5
  comment?: string;

  // employer → student ratings
  professionalismRating?: number; // 1–5
  punctualityRating?: number; // 1–5
  skillPerformanceRating?: number; // 1–5
  workQualityRating?: number; // 1–5
  isRecommended?: boolean;
  recommendationText?: string; // shown permanently on student profile

  isPublic: boolean;
  isVerified: boolean; // true when application.status === hired
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    reviewType: {
      type: String,
      enum: ['student_to_employer', 'employer_to_student'],
      required: true,
    },
    overallRating: { type: Number, min: 1, max: 5 },
    workEnvironmentRating: { type: Number, min: 1, max: 5 },
    learningOpportunityRating: { type: Number, min: 1, max: 5 },
    mentorshipQualityRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 1500 },
    professionalismRating: { type: Number, min: 1, max: 5 },
    punctualityRating: { type: Number, min: 1, max: 5 },
    skillPerformanceRating: { type: Number, min: 1, max: 5 },
    workQualityRating: { type: Number, min: 1, max: 5 },
    isRecommended: { type: Boolean },
    recommendationText: { type: String, maxlength: 3000 },
    isPublic: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ revieweeId: 1, reviewType: 1 });
ReviewSchema.index({ applicationId: 1, reviewType: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
