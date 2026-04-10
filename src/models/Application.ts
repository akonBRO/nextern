import mongoose, { Schema, Document } from 'mongoose';
import type { AIExecutionMeta } from '@/lib/ai-meta';

interface IStatusHistoryEntry {
  status: string;
  changedAt: Date;
  changedBy: mongoose.Types.ObjectId;
  note?: string;
}

export interface IApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  status:
    | 'applied'
    | 'shortlisted'
    | 'under_review'
    | 'assessment_sent'
    | 'interview_scheduled'
    | 'rejected'
    | 'hired'
    | 'withdrawn';
  appliedAt: Date;
  coverLetter?: string;
  resumeUrlSnapshot?: string;
  generatedResumeUrlSnapshot?: string;
  isEventRegistration: boolean;

  fitScore?: number;
  hardGaps: string[];
  softGaps: string[];
  metRequirements: string[];
  suggestedPath: string[];
  fitSummary?: string;
  fitScoreComputedAt?: Date;
  fitAnalysisMeta?: AIExecutionMeta;

  assessmentId?: mongoose.Types.ObjectId;
  assessmentScore?: number;
  assessmentPassed?: boolean;

  interviewScheduledAt?: Date;
  agoraChannelId?: string;
  interviewNotes?: string;
  interviewRecordingUrl?: string;

  statusHistory: IStatusHistoryEntry[];
  employerNotes?: string;
  isWithdrawn: boolean;

  googleCalendarEventId?: string;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: [
        'applied',
        'shortlisted',
        'under_review',
        'assessment_sent',
        'interview_scheduled',
        'rejected',
        'hired',
        'withdrawn',
      ],
      default: 'applied',
    },
    appliedAt: { type: Date, default: Date.now },
    coverLetter: { type: String, maxlength: 2000 },
    resumeUrlSnapshot: { type: String },
    generatedResumeUrlSnapshot: { type: String },
    isEventRegistration: { type: Boolean, default: false },
    fitScore: { type: Number, min: 0, max: 100 },
    hardGaps: [{ type: String }],
    softGaps: [{ type: String }],
    metRequirements: [{ type: String }],
    suggestedPath: [{ type: String }],
    fitSummary: { type: String },
    fitScoreComputedAt: { type: Date },
    fitAnalysisMeta: {
      mode: {
        type: String,
        enum: ['ai', 'fallback', 'unknown'],
      },
      provider: {
        type: String,
        enum: ['gemini', 'groq', 'local'],
      },
      requestedProvider: {
        type: String,
        enum: ['gemini', 'groq'],
      },
      model: { type: String, default: null },
      fallbackReason: { type: String, default: null },
    },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment' },
    assessmentScore: { type: Number },
    assessmentPassed: { type: Boolean },
    interviewScheduledAt: { type: Date },
    agoraChannelId: { type: String },
    interviewNotes: { type: String, select: false },
    interviewRecordingUrl: { type: String },
    googleCalendarEventId: { type: String },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: Schema.Types.ObjectId,
        note: String,
      },
    ],
    employerNotes: { type: String, select: false },
    isWithdrawn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ApplicationSchema.index({ studentId: 1, status: 1 });
ApplicationSchema.index({ jobId: 1, status: 1, fitScore: -1 });
ApplicationSchema.index({ employerId: 1, status: 1 });
ApplicationSchema.index({ studentId: 1, isEventRegistration: 1 });
ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

export const Application =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
