import mongoose, { Schema, Document } from 'mongoose';
import { ASSESSMENT_ASSIGNMENT_STATUSES } from '@/lib/hiring-suite-shared';

export interface IAssessmentAssignment extends Document {
  assessmentId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: (typeof ASSESSMENT_ASSIGNMENT_STATUSES)[number];
  assignedAt: Date;
  dueAt?: Date;
  startedAt?: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  reminderSentOffsetsMinutes: number[];
  objectiveScore?: number;
  manualScore?: number;
  totalScore?: number;
  isPassed?: boolean;
  needsManualReview: boolean;
  lastOpenedAt?: Date;
}

const AssessmentAssignmentSchema = new Schema<IAssessmentAssignment>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ASSESSMENT_ASSIGNMENT_STATUSES,
      default: 'assigned',
    },
    assignedAt: { type: Date, default: Date.now },
    dueAt: { type: Date },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    gradedAt: { type: Date },
    reminderSentOffsetsMinutes: { type: [Number], default: [] },
    objectiveScore: { type: Number },
    manualScore: { type: Number },
    totalScore: { type: Number },
    isPassed: { type: Boolean },
    needsManualReview: { type: Boolean, default: false },
    lastOpenedAt: { type: Date },
  },
  { timestamps: true }
);

AssessmentAssignmentSchema.index({ assessmentId: 1, applicationId: 1 }, { unique: true });
AssessmentAssignmentSchema.index({ studentId: 1, status: 1, dueAt: 1 });
AssessmentAssignmentSchema.index({ employerId: 1, status: 1, createdAt: -1 });

export const AssessmentAssignment =
  mongoose.models.AssessmentAssignment ||
  mongoose.model<IAssessmentAssignment>('AssessmentAssignment', AssessmentAssignmentSchema);
