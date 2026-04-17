import mongoose, { Schema, Document } from 'mongoose';
import type { HiringAsset } from '@/lib/hiring-suite-shared';

export interface IAssessmentSubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  answers: {
    questionIndex: number;
    answerText?: string;
    selectedOptionIndex?: number;
    code?: string;
    uploadedFiles?: HiringAsset[];
    marksAwarded?: number;
    objectiveMarksAwarded?: number;
    manualMarksAwarded?: number;
    executionStatus?: string;
    executionOutput?: string;
    executionError?: string;
    executionExitCode?: number;
    judge0SubmissionToken?: string;
    plagiarismScore?: number;
    plagiarismMatches?: { submissionId: mongoose.Types.ObjectId; score: number }[];
    evaluationNotes?: string;
  }[];
  objectiveScore?: number;
  manualScore?: number;
  totalScore?: number;
  isPassed?: boolean;
  startedAt: Date;
  submittedAt?: Date;
  timeTakenSeconds?: number;
  isAutoSubmitted: boolean;
}

const AssessmentSubmissionSchema = new Schema<IAssessmentSubmission>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'AssessmentAssignment', required: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    answers: [
      {
        questionIndex: Number,
        answerText: String,
        selectedOptionIndex: Number,
        code: String,
        uploadedFiles: [{ url: String, name: String, type: String }],
        marksAwarded: Number,
        objectiveMarksAwarded: Number,
        manualMarksAwarded: Number,
        executionStatus: String,
        executionOutput: String,
        executionError: String,
        executionExitCode: Number,
        judge0SubmissionToken: String,
        plagiarismScore: Number,
        plagiarismMatches: [{ submissionId: Schema.Types.ObjectId, score: Number }],
        evaluationNotes: String,
      },
    ],
    objectiveScore: { type: Number },
    manualScore: { type: Number },
    totalScore: { type: Number },
    isPassed: { type: Boolean },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeTakenSeconds: { type: Number },
    isAutoSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AssessmentSubmissionSchema.index({ assignmentId: 1 }, { unique: true });
AssessmentSubmissionSchema.index({ assessmentId: 1, studentId: 1 });
AssessmentSubmissionSchema.index({ employerId: 1, submittedAt: -1 });

export const AssessmentSubmission =
  mongoose.models.AssessmentSubmission ||
  mongoose.model<IAssessmentSubmission>('AssessmentSubmission', AssessmentSubmissionSchema);
