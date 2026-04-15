import mongoose, { Schema, Document } from 'mongoose';

export interface IFreelanceReview extends Document {
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  reviewType: 'client_to_student' | 'student_to_client';
  overallRating?: number;
  communicationRating?: number;
  requirementsClarityRating?: number;
  paymentPromptnessRating?: number;
  professionalismRating?: number;
  punctualityRating?: number;
  skillPerformanceRating?: number;
  workQualityRating?: number;
  isRecommended?: boolean;
  recommendationText?: string;
  comment?: string;
  isPublic: boolean;
  isVerified: boolean;
}

const FreelanceReviewSchema = new Schema<IFreelanceReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'FreelanceOrder', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'FreelanceListing', required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewType: {
      type: String,
      enum: ['client_to_student', 'student_to_client'],
      required: true,
    },
    overallRating: { type: Number, min: 1, max: 5 },
    communicationRating: { type: Number, min: 1, max: 5 },
    requirementsClarityRating: { type: Number, min: 1, max: 5 },
    paymentPromptnessRating: { type: Number, min: 1, max: 5 },
    professionalismRating: { type: Number, min: 1, max: 5 },
    punctualityRating: { type: Number, min: 1, max: 5 },
    skillPerformanceRating: { type: Number, min: 1, max: 5 },
    workQualityRating: { type: Number, min: 1, max: 5 },
    isRecommended: { type: Boolean },
    recommendationText: { type: String, maxlength: 3000 },
    comment: { type: String, maxlength: 1500 },
    isPublic: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FreelanceReviewSchema.index({ orderId: 1, reviewType: 1 }, { unique: true });
FreelanceReviewSchema.index({ freelancerId: 1, reviewType: 1, createdAt: -1 });
FreelanceReviewSchema.index({ clientId: 1, reviewType: 1, createdAt: -1 });
FreelanceReviewSchema.index({ listingId: 1, reviewType: 1, createdAt: -1 });

export const FreelanceReview =
  mongoose.models.FreelanceReview ||
  mongoose.model<IFreelanceReview>('FreelanceReview', FreelanceReviewSchema);
