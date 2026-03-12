import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentSubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  answers: {
    questionIndex: number;
    answer: string;
    marksAwarded?: number;
    // Piston API fields (replaces Judge0)
    executionStatus?: string; // 'success' | 'error' | 'timeout'
    executionOutput?: string; // Piston run.stdout
    executionError?: string; // Piston run.stderr
    executionExitCode?: number; // 0 = success
    plagiarismScore?: number; // 0–100
  }[];
  totalScore?: number;
  isPassed?: boolean;
  startedAt: Date;
  submittedAt?: Date;
  timeTakenSeconds?: number;
  isAutoSubmitted: boolean;
  videoRecordingUrl?: string;
  consentGiven: boolean; // must be true before recording stored
}

const AssessmentSubmissionSchema = new Schema<IAssessmentSubmission>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    answers: [
      {
        questionIndex: Number,
        answer: String,
        marksAwarded: Number,
        executionStatus: String,
        executionOutput: String,
        executionError: String,
        executionExitCode: Number,
        plagiarismScore: Number,
      },
    ],
    totalScore: { type: Number },
    isPassed: { type: Boolean },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeTakenSeconds: { type: Number },
    isAutoSubmitted: { type: Boolean, default: false },
    videoRecordingUrl: { type: String },
    consentGiven: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AssessmentSubmissionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

export const AssessmentSubmission =
  mongoose.models.AssessmentSubmission ||
  mongoose.model<IAssessmentSubmission>('AssessmentSubmission', AssessmentSubmissionSchema);
