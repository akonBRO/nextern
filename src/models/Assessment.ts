import mongoose, { Schema, Document } from 'mongoose';
import {
  ASSESSMENT_QUESTION_TYPES,
  ASSESSMENT_TYPES,
  CODING_LANGUAGES,
  type AssessmentQuestionType,
  type AssessmentType,
  type CodingLanguage,
  type HiringAsset,
} from '@/lib/hiring-suite-shared';

interface IQuestion {
  index: number;
  type: AssessmentQuestionType;
  questionText: string;
  marks: number;
  options?: string[];
  correctOptionIndex?: number;
  acceptedAnswers?: string[];
  enablePlagiarismCheck?: boolean;
  language?: CodingLanguage;
  starterCode?: string;
  testCases?: { input: string; expectedOutput: string; isSample?: boolean }[];
  rubric?: string;
  attachments?: HiringAsset[];
  maxWords?: number;
}

export interface IAssessment extends Document {
  employerId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  title: string;
  type: AssessmentType;
  questions: IQuestion[];
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  instructions?: string;
  dueAt?: Date;
  reminderOffsetsMinutes: number[];
  isTimedAutoSubmit: boolean;
  allowLateSubmission: boolean;
  isActive: boolean;
  assignedApplicationIds: mongoose.Types.ObjectId[];
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ASSESSMENT_TYPES,
      required: true,
    },
    questions: [
      {
        index: { type: Number, required: true },
        type: { type: String, enum: ASSESSMENT_QUESTION_TYPES, required: true },
        questionText: { type: String, required: true },
        marks: { type: Number, required: true, min: 1 },
        options: [String],
        correctOptionIndex: Number,
        acceptedAnswers: [String],
        enablePlagiarismCheck: Boolean,
        language: { type: String, enum: CODING_LANGUAGES },
        starterCode: String,
        testCases: [{ input: String, expectedOutput: String, isSample: Boolean }],
        rubric: String,
        attachments: [{ url: String, name: String, type: String }],
        maxWords: Number,
      },
    ],
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    instructions: { type: String },
    dueAt: { type: Date },
    reminderOffsetsMinutes: { type: [Number], default: [1440, 60] },
    isTimedAutoSubmit: { type: Boolean, default: true },
    allowLateSubmission: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    assignedApplicationIds: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  },
  { timestamps: true }
);

AssessmentSchema.index({ assignedApplicationIds: 1 });
AssessmentSchema.index({ employerId: 1, jobId: 1, createdAt: -1 });
export const Assessment =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
