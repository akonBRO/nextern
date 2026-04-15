import mongoose, { Schema, Document } from 'mongoose';
import {
  INTERVIEW_CONSENT_STATUSES,
  INTERVIEW_RECORDING_STATUSES,
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_SESSION_MODES,
  INTERVIEW_SESSION_STATUSES,
  type HiringAsset,
} from '@/lib/hiring-suite-shared';

type Panelist = {
  name: string;
  email?: string;
  userId?: mongoose.Types.ObjectId;
  role?: 'host' | 'panelist' | 'guest';
};

export interface IInterviewSession extends Document {
  applicationId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: (typeof INTERVIEW_SESSION_STATUSES)[number];
  mode: (typeof INTERVIEW_SESSION_MODES)[number];
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  agoraChannelName: string;
  reminderSentOffsetsMinutes: number[];
  panelists: Panelist[];
  liveNotes?: string;
  scorecard: {
    communication?: number;
    technical?: number;
    problemSolving?: number;
    cultureFit?: number;
    confidence?: number;
    overallScore?: number;
    recommendation?: (typeof INTERVIEW_RECOMMENDATIONS)[number];
    summary?: string;
  };
  consentStatus: (typeof INTERVIEW_CONSENT_STATUSES)[number];
  consentUpdatedAt?: Date;
  recordingStatus: (typeof INTERVIEW_RECORDING_STATUSES)[number];
  recordingAsset?: HiringAsset;
  recordingError?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: INTERVIEW_SESSION_STATUSES,
      default: 'scheduled',
    },
    mode: {
      type: String,
      enum: INTERVIEW_SESSION_MODES,
      default: 'one_on_one',
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 240 },
    agoraChannelName: { type: String, required: true, unique: true },
    reminderSentOffsetsMinutes: { type: [Number], default: [] },
    panelists: [
      {
        name: { type: String, required: true },
        email: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['host', 'panelist', 'guest'], default: 'panelist' },
      },
    ],
    liveNotes: { type: String },
    scorecard: {
      communication: { type: Number, min: 0, max: 100 },
      technical: { type: Number, min: 0, max: 100 },
      problemSolving: { type: Number, min: 0, max: 100 },
      cultureFit: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 },
      overallScore: { type: Number, min: 0, max: 100 },
      recommendation: { type: String, enum: INTERVIEW_RECOMMENDATIONS },
      summary: { type: String },
    },
    consentStatus: {
      type: String,
      enum: INTERVIEW_CONSENT_STATUSES,
      default: 'pending',
    },
    consentUpdatedAt: { type: Date },
    recordingStatus: {
      type: String,
      enum: INTERVIEW_RECORDING_STATUSES,
      default: 'waiting_for_consent',
    },
    recordingAsset: {
      url: String,
      name: String,
      type: String,
    },
    recordingError: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ applicationId: 1 }, { unique: true });
InterviewSessionSchema.index({ employerId: 1, status: 1, scheduledAt: 1 });
InterviewSessionSchema.index({ studentId: 1, status: 1, scheduledAt: 1 });

export const InterviewSession =
  mongoose.models.InterviewSession ||
  mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
