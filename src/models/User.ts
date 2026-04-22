import mongoose, { Schema, Document } from 'mongoose';

// ── Sub-document interfaces ──────────────────────────────────
interface IProject {
  title: string;
  description: string;
  techStack: string[];
  projectUrl?: string;
  repoUrl?: string;
  completedAt?: Date;
}

interface ICertification {
  name: string;
  issuedBy: string;
  issueDate?: Date;
  credentialUrl?: string;
}

interface IVerifiedPortfolioItem {
  title: string;
  category: string;
  fileUrl: string;
  fileUrls?: string[];
  summary?: string;
  skills?: string[];
  clientName?: string;
  rating?: number;
  freelanceOrderId: mongoose.Types.ObjectId;
  completedAt: Date;
}

interface INotificationPreferences {
  application_received: boolean;
  application_under_review: boolean;
  application_shortlisted: boolean;
  application_assessment_sent: boolean;
  application_interview: boolean;
  application_hired: boolean;
  application_rejected: boolean;
  application_withdrawn: boolean;
  deadline_reminders: boolean;
  job_matches: boolean;
  badge_earned: boolean;
  advisor_notes: boolean;
  event_registrations: boolean;
  waitlist_updates: boolean;
  student_messages: boolean;
  event_reminders: boolean;
}

interface IEmailPreferences {
  application_received: boolean;
  application_under_review: boolean;
  application_shortlisted: boolean;
  application_assessment_sent: boolean;
  application_interview: boolean;
  application_hired: boolean;
  application_rejected: boolean;
  application_withdrawn: boolean;
  deadline_reminders: boolean;
  event_registrations: boolean;
  event_reminders: boolean;
}

// ── Main interface ───────────────────────────────────────────
export interface IUser extends Document {
  // ── Common fields (all roles) ────────────────────────────
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'employer' | 'advisor' | 'dept_head' | 'admin';
  image?: string;
  phone?: string;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  premiumOverride?: 'free' | 'premium' | null;
  isVerified: boolean;
  mustChangePassword?: boolean;
  createdAt: Date;
  updatedAt: Date;

  // ── Student fields ───────────────────────────────────────
  studentId?: string;
  university?: string;
  department?: string;
  yearOfStudy?: number;
  currentSemester?: string;
  cgpa?: number;
  completedCourses: string[];
  skills: string[];
  closedSkillGaps: string[];
  certifications: ICertification[];
  projects: IProject[];
  verifiedPortfolioItems: IVerifiedPortfolioItem[];
  bio?: string;
  resumeUrl?: string;
  generatedResumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  city?: string;
  opportunityScore: number;
  isGraduated: boolean;
  gerUrl?: string;
  profileCompleteness: number;
  assignedAdvisorId?: mongoose.Types.ObjectId;
  googleRefreshToken?: string;
  googleCalendarConnected?: boolean;
  notificationPreferences: INotificationPreferences;
  emailPreferences: IEmailPreferences;
  freelanceAccountBalanceBDT: number;
  freelanceTotalEarningsBDT: number;
  freelanceTotalSpendingsBDT: number;
  freelanceTotalWithdrawnBDT: number;
  freelanceTotalPlatformFeesBDT: number;

  // ── Employer fields ─────────────────────────────────────
  companyName?: string;
  industry?: string;
  companySize?: string;
  companyWebsite?: string;
  companyLogo?: string;
  companyDescription?: string;
  tradeLicenseNo?: string;
  headquartersCity?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNote?: string;

  // ── Advisor / Department Head fields ────────────────────
  institutionName?: string;
  advisorStaffId?: string;
  designation?: string;
  advisoryDepartment?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

// ── Schema definition ────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['student', 'employer', 'advisor', 'dept_head', 'admin'],
      required: true,
    },
    image: { type: String },
    phone: { type: String, match: /^\+8801[3-9]\d{8}$/ },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date },
    premiumOverride: { type: String, enum: ['free', 'premium'], default: null },
    isVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },

    // ── Student ──────────────────────────────────────────
    studentId: { type: String },
    university: { type: String },
    department: { type: String },
    yearOfStudy: { type: Number, min: 1, max: 5 },
    currentSemester: { type: String },
    cgpa: { type: Number, min: 0, max: 4.0 },
    completedCourses: [{ type: String }],
    skills: [{ type: String }],
    closedSkillGaps: [{ type: String }],
    certifications: [{ name: String, issuedBy: String, issueDate: Date, credentialUrl: String }],
    projects: [
      {
        title: String,
        description: String,
        techStack: [String],
        projectUrl: String,
        repoUrl: String,
        completedAt: Date,
      },
    ],
    verifiedPortfolioItems: [
      {
        title: String,
        category: String,
        fileUrl: String,
        fileUrls: [String],
        summary: String,
        skills: [String],
        clientName: String,
        rating: Number,
        freelanceOrderId: { type: Schema.Types.ObjectId, ref: 'FreelanceOrder' },
        completedAt: Date,
      },
    ],
    bio: { type: String, maxlength: 500 },
    resumeUrl: { type: String },
    generatedResumeUrl: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    city: { type: String },
    opportunityScore: { type: Number, default: 0, min: 0, max: 100 },
    isGraduated: { type: Boolean, default: false },
    gerUrl: { type: String },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    assignedAdvisorId: { type: Schema.Types.ObjectId, ref: 'User' },
    googleRefreshToken: { type: String, select: false }, // never exposed to client
    googleCalendarConnected: { type: Boolean, default: false },
    freelanceAccountBalanceBDT: { type: Number, default: 0, min: 0 },
    freelanceTotalEarningsBDT: { type: Number, default: 0, min: 0 },
    freelanceTotalSpendingsBDT: { type: Number, default: 0, min: 0 },
    freelanceTotalWithdrawnBDT: { type: Number, default: 0, min: 0 },
    freelanceTotalPlatformFeesBDT: { type: Number, default: 0, min: 0 },

    // ── Notification preferences ─────────────────────────
    notificationPreferences: {
      application_received: { type: Boolean, default: true },
      application_under_review: { type: Boolean, default: true },
      application_shortlisted: { type: Boolean, default: true },
      application_assessment_sent: { type: Boolean, default: true },
      application_interview: { type: Boolean, default: true },
      application_hired: { type: Boolean, default: true },
      application_rejected: { type: Boolean, default: true },
      application_withdrawn: { type: Boolean, default: true },
      deadline_reminders: { type: Boolean, default: true },
      job_matches: { type: Boolean, default: true },
      badge_earned: { type: Boolean, default: true },
      advisor_notes: { type: Boolean, default: true },
      event_registrations: { type: Boolean, default: true },
      waitlist_updates: { type: Boolean, default: true },
      student_messages: { type: Boolean, default: true },
      event_reminders: { type: Boolean, default: true },
    },
    emailPreferences: {
      application_received: { type: Boolean, default: true },
      application_under_review: { type: Boolean, default: true },
      application_shortlisted: { type: Boolean, default: true },
      application_assessment_sent: { type: Boolean, default: true },
      application_interview: { type: Boolean, default: true },
      application_hired: { type: Boolean, default: true },
      application_rejected: { type: Boolean, default: true },
      application_withdrawn: { type: Boolean, default: true },
      deadline_reminders: { type: Boolean, default: true },
      event_registrations: { type: Boolean, default: true },
      event_reminders: { type: Boolean, default: true },
    },

    // ── Employer ─────────────────────────────────────────
    companyName: { type: String },
    industry: { type: String },
    companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
    companyWebsite: { type: String },
    companyLogo: { type: String },
    companyDescription: { type: String, maxlength: 1000 },
    tradeLicenseNo: { type: String },
    headquartersCity: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verificationNote: { type: String },

    // ── Advisor / Dept Head ───────────────────────────────
    institutionName: { type: String },
    advisorStaffId: { type: String },
    designation: { type: String },
    advisoryDepartment: { type: String },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────
UserSchema.index({ role: 1, university: 1 });
UserSchema.index({ opportunityScore: -1, university: 1 });
UserSchema.index({ assignedAdvisorId: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
