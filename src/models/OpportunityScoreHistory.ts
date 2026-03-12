import mongoose, { Schema, Document } from 'mongoose';

export type ScoreEventType =
  | 'profile_completed'
  | 'university_verified'
  | 'skill_added'
  | 'resume_uploaded'
  | 'job_applied'
  | 'skill_gap_closed'
  | 'webinar_attended'
  | 'review_written'
  | 'employer_feedback_positive'
  | 'mentor_session_completed'
  | 'freelance_order_completed'
  | 'badge_earned'
  | 'certification_added';

export interface IOpportunityScoreHistory extends Document {
  userId: mongoose.Types.ObjectId;
  scoreAfter: number; // score snapshot after this event
  delta: number; // change (+ve or -ve)
  eventType: ScoreEventType;
  reason: string; // 'Closed React skill gap'
  meta?: Record<string, unknown>;
}

const OpportunityScoreHistorySchema = new Schema<IOpportunityScoreHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scoreAfter: { type: Number, required: true, min: 0, max: 100 },
    delta: { type: Number, required: true },
    eventType: { type: String, required: true },
    reason: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

OpportunityScoreHistorySchema.index({ userId: 1, createdAt: -1 });

export const OpportunityScoreHistory =
  mongoose.models.OpportunityScoreHistory ||
  mongoose.model<IOpportunityScoreHistory>(
    'OpportunityScoreHistory',
    OpportunityScoreHistorySchema
  );
