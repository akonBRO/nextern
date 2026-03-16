import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureUsage extends Document {
  userId: mongoose.Types.ObjectId;
  feature:
    | 'skill_gap_analysis'
    | 'mock_interview'
    | 'training_path'
    | 'career_advice'
    | 'job_posting'
    | 'mentorship_request';
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureUsageSchema = new Schema<IFeatureUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    feature: {
      type: String,
      enum: [
        'skill_gap_analysis',
        'mock_interview',
        'training_path',
        'career_advice',
        'job_posting',
        'mentorship_request',
      ],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

FeatureUsageSchema.index({ userId: 1, feature: 1, createdAt: -1 });

export const FeatureUsage =
  mongoose.models.FeatureUsage || mongoose.model<IFeatureUsage>('FeatureUsage', FeatureUsageSchema);
