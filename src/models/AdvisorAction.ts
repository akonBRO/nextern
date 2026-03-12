import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvisorAction extends Document {
  advisorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  actionType:
    | 'plan_endorsed'
    | 'plan_modified'
    | 'note_added'
    | 'priority_flagged'
    | 'report_exported';
  aiTrainingPlanSnapshot: string[];
  advisorModifications?: string[];
  advisorNote?: string;
  isPriorityFlagged: boolean;
  reportPdfUrl?: string;
}

const AdvisorActionSchema = new Schema<IAdvisorAction>(
  {
    advisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: {
      type: String,
      enum: ['plan_endorsed', 'plan_modified', 'note_added', 'priority_flagged', 'report_exported'],
      required: true,
    },
    aiTrainingPlanSnapshot: [{ type: String }],
    advisorModifications: [{ type: String }],
    advisorNote: { type: String, maxlength: 1000 },
    isPriorityFlagged: { type: Boolean, default: false },
    reportPdfUrl: { type: String },
  },
  { timestamps: true }
);

AdvisorActionSchema.index({ advisorId: 1, studentId: 1 });
AdvisorActionSchema.index({ studentId: 1, isPriorityFlagged: 1 });

export const AdvisorAction =
  mongoose.models.AdvisorAction ||
  mongoose.model<IAdvisorAction>('AdvisorAction', AdvisorActionSchema);
