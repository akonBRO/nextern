import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartmentBenchmark extends Document {
  deptHeadId: mongoose.Types.ObjectId;
  university: string; // BD university name
  department: string; // 'CSE', 'EEE' etc.
  cohort: string; // 'Spring 2026', 'Fall 2025'
  minReadinessScore: number; // alert fires when avg drops below (0–100)
  minFitScore: number; // minimum average fit score (0–100)
  minCGPA: number; // minimum average CGPA (0.00–4.00)
  isActive: boolean;
  lastAlertSentAt?: Date; // prevents alert spam
}

const DepartmentBenchmarkSchema = new Schema<IDepartmentBenchmark>(
  {
    deptHeadId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    university: { type: String, required: true },
    department: { type: String, required: true },
    cohort: { type: String, required: true },
    minReadinessScore: { type: Number, default: 60, min: 0, max: 100 },
    minFitScore: { type: Number, default: 50, min: 0, max: 100 },
    minCGPA: { type: Number, default: 2.5, min: 0, max: 4.0 },
    isActive: { type: Boolean, default: true },
    lastAlertSentAt: { type: Date },
  },
  { timestamps: true }
);

DepartmentBenchmarkSchema.index({ deptHeadId: 1, department: 1, cohort: 1 }, { unique: true });

export const DepartmentBenchmark =
  mongoose.models.DepartmentBenchmark ||
  mongoose.model<IDepartmentBenchmark>('DepartmentBenchmark', DepartmentBenchmarkSchema);
