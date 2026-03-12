import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  employerId: mongoose.Types.ObjectId;
  companyName: string; // denormalized — avoids JOIN on list render
  companyLogo?: string; // denormalized Uploadthing URL
  description: string;
  responsibilities: string[];
  type: 'internship' | 'part-time' | 'full-time' | 'campus-drive' | 'webinar' | 'workshop';
  locationType: 'onsite' | 'remote' | 'hybrid';
  city?: string; // BD district — null if remote
  stipendBDT?: number; // monthly stipend integer in BDT
  isStipendNegotiable: boolean;
  applicationDeadline?: Date; // stored for M3 calendar reminders
  startDate?: Date;
  durationMonths?: number; // typical BD internships: 3 months

  // ── Targeting filters ──────────────────────────────────
  targetUniversities: string[]; // empty = open to all universities
  targetDepartments: string[]; // empty = open to all departments
  targetYears: number[]; // empty = open to all years

  // ── Internship Requirement Profile (feeds M2 AI engine) ─
  requiredSkills: string[]; // Sabbir's gap engine reads this
  minimumCGPA?: number; // 0.00–4.00 BD scale
  requiredCourses: string[]; // Sabbir's fit score reads this
  experienceExpectations?: string;
  preferredCertifications: string[];

  // ── Batch hiring ───────────────────────────────────────
  isBatchHiring: boolean;
  batchUniversities: string[];

  // ── Metadata ───────────────────────────────────────────
  applicationCount: number; // incremented on each application
  viewCount: number; // incremented on each JobView
  isActive: boolean;
  isPremiumListing: boolean;
  academicSession?: string; // 'Spring 2026'
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    type: {
      type: String,
      enum: ['internship', 'part-time', 'full-time', 'campus-drive', 'webinar', 'workshop'],
      required: true,
    },
    locationType: { type: String, enum: ['onsite', 'remote', 'hybrid'], required: true },
    city: { type: String },
    stipendBDT: { type: Number, min: 0 },
    isStipendNegotiable: { type: Boolean, default: false },
    applicationDeadline: { type: Date },
    startDate: { type: Date },
    durationMonths: { type: Number, min: 1 },
    targetUniversities: [{ type: String }],
    targetDepartments: [{ type: String }],
    targetYears: [{ type: Number }],
    requiredSkills: [{ type: String }],
    minimumCGPA: { type: Number, min: 0, max: 4.0 },
    requiredCourses: [{ type: String }],
    experienceExpectations: { type: String },
    preferredCertifications: [{ type: String }],
    isBatchHiring: { type: Boolean, default: false },
    batchUniversities: [{ type: String }],
    applicationCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPremiumListing: { type: Boolean, default: false },
    academicSession: { type: String },
  },
  { timestamps: true }
);

JobSchema.index({ employerId: 1 });
JobSchema.index({ type: 1, isActive: 1, applicationDeadline: 1 });
JobSchema.index({ targetUniversities: 1, targetDepartments: 1 });
JobSchema.index({ requiredSkills: 1 });

export const Job = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
