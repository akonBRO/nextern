import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorSession extends Document {
  mentorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled';
  sessionType: 'resume_review' | 'career_advice' | 'mock_interview' | 'general';
  studentNotes: string; // what student wants help with
  scheduledAt?: Date;
  agoraChannelId?: string;
  durationMinutes?: number;
  mentorFeedback?: string;
  studentRating?: number; // 1–5
  studentReview?: string;
  completedAt?: Date;
  opportunityScoreAwarded: boolean; // prevents double-scoring
}

const MentorSessionSchema = new Schema<IMentorSession>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
    },
    sessionType: {
      type: String,
      enum: ['resume_review', 'career_advice', 'mock_interview', 'general'],
      required: true,
    },
    studentNotes: { type: String, maxlength: 500, required: true },
    scheduledAt: { type: Date },
    agoraChannelId: { type: String },
    durationMinutes: { type: Number },
    mentorFeedback: { type: String },
    studentRating: { type: Number, min: 1, max: 5 },
    studentReview: { type: String, maxlength: 500 },
    completedAt: { type: Date },
    opportunityScoreAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MentorSessionSchema.index({ studentId: 1, status: 1 });
MentorSessionSchema.index({ mentorId: 1, status: 1 });

export const MentorSession =
  mongoose.models.MentorSession ||
  mongoose.model<IMentorSession>('MentorSession', MentorSessionSchema);
