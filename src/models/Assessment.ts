import mongoose, { Schema, Document } from 'mongoose';

interface IQuestion {
  index: number;
  type: 'mcq' | 'short_answer' | 'coding' | 'case_study';
  questionText: string;
  marks: number;
  // MCQ
  options?: string[];
  correctOptionIndex?: number; // never sent to student
  // Short answer
  enablePlagiarismCheck?: boolean;
  // Coding (Piston API)
  language?: string; // 'javascript', 'python', 'java', 'cpp'
  starterCode?: string;
  testCases?: { input: string; expectedOutput: string }[];
}

export interface IAssessment extends Document {
  employerId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  title: string;
  type: 'mcq' | 'short_answer' | 'coding' | 'case_study' | 'mixed';
  questions: IQuestion[];
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  instructions?: string;
  isTimedAutoSubmit: boolean;
  isActive: boolean;
  assignedApplicationIds: mongoose.Types.ObjectId[];
  // applications (shortlisted candidates) this assessment is assigned to
  // query: Assessment.findById(id).populate('assignedApplicationIds')
  // to find "assigned but not started": assignedApplicationIds not in any AssessmentSubmission
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'short_answer', 'coding', 'case_study', 'mixed'],
      required: true,
    },
    questions: [
      {
        index: Number,
        type: String,
        questionText: String,
        marks: Number,
        options: [String],
        correctOptionIndex: Number,
        enablePlagiarismCheck: Boolean,
        language: String,
        starterCode: String,
        testCases: [{ input: String, expectedOutput: String }],
      },
    ],
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    instructions: { type: String },
    isTimedAutoSubmit: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    assignedApplicationIds: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  },
  { timestamps: true }
);

AssessmentSchema.index({ assignedApplicationIds: 1 });
export const Assessment =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
