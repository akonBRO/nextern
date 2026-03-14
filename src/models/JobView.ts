// src/models/JobView.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobView extends Document {
  studentId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  viewCount: number;
  firstViewedAt: Date;
  lastViewedAt: Date;
  isSaved: boolean;
  savedAt?: Date;
  isApplied: boolean;
  googleCalendarEventId?: string;
}

const JobViewSchema = new Schema<IJobView>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    viewCount: { type: Number, default: 1 },
    firstViewedAt: { type: Date, default: Date.now },
    lastViewedAt: { type: Date, default: Date.now },
    isSaved: { type: Boolean, default: false },
    savedAt: { type: Date },
    isApplied: { type: Boolean, default: false },
    googleCalendarEventId: { type: String },
  },
  { timestamps: false }
);

JobViewSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
JobViewSchema.index({ studentId: 1, isSaved: 1 });

export const JobView: Model<IJobView> =
  mongoose.models.JobView || mongoose.model<IJobView>('JobView', JobViewSchema);
