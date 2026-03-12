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
  fileUrl: string; // Uploadthing URL
  freelanceOrderId: mongoose.Types.ObjectId;
  completedAt: Date;
}

// ── Main interface ───────────────────────────────────────────
export interface IUser extends Document {
  // ── Common fields (all roles) ────────────────────────────
  name: string;
  email: string;
  password?: string; // null for Google OAuth users
  role: 'student' | 'employer' | 'advisor' | 'dept_head' | 'admin';
  image?: string; // profile photo Uploadthing URL
  phone?: string; // BD format: +8801XXXXXXXXX
  isPremium: boolean;
  premiumExpiresAt?: Date;
  isVerified: boolean; // admin-approved account
  createdAt: Date;
  updatedAt: Date;

  // ── Student fields ───────────────────────────────────────
  studentId?: string; // e.g. '22301206' — stored as String
  university?: string; // BD university name
  department?: string; // 'CSE', 'EEE', 'BBA' etc.
  yearOfStudy?: number; // 1–5
  currentSemester?: string; // 'Spring 2026', 'Fall 2025'
  cgpa?: number; // 0.00–4.00 BD standard — NOT gpa
  completedCourses: string[]; // e.g. ['CSE110', 'CSE220']
  skills: string[];
  closedSkillGaps: string[]; // skills student has globally resolved
  certifications: ICertification[];
  projects: IProject[];
  verifiedPortfolioItems: IVerifiedPortfolioItem[]; // from completed FreelanceOrders
  bio?: string;
  resumeUrl?: string; // Uploadthing URL of latest resume
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  city?: string; // BD district name
  opportunityScore: number; // default 0 — wired by M3 engine
  isGraduated: boolean;
  gerUrl?: string; // Uploadthing URL of GER PDF
  profileCompleteness: number; // 0–100
  assignedAdvisorId?: mongoose.Types.ObjectId; // which advisor oversees student

  // ── Employer fields ─────────────────────────────────────
  companyName?: string;
  industry?: string; // 'IT/Software', 'Banking', 'NGO' etc.
  companySize?: string;
  companyWebsite?: string;
  companyLogo?: string; // Uploadthing URL
  companyDescription?: string;
  tradeLicenseNo?: string; // BD Trade License for admin verification
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
    isVerified: { type: Boolean, default: false },

    // Student
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
        freelanceOrderId: { type: Schema.Types.ObjectId, ref: 'FreelanceOrder' },
        completedAt: Date,
      },
    ],
    bio: { type: String, maxlength: 500 },
    resumeUrl: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    city: { type: String },
    opportunityScore: { type: Number, default: 0, min: 0, max: 100 },
    isGraduated: { type: Boolean, default: false },
    gerUrl: { type: String },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    assignedAdvisorId: { type: Schema.Types.ObjectId, ref: 'User' },

    // Employer
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

    // Advisor / Dept Head
    institutionName: { type: String },
    advisorStaffId: { type: String },
    designation: { type: String },
    advisoryDepartment: { type: String },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, university: 1 });
UserSchema.index({ opportunityScore: -1, university: 1 });
UserSchema.index({ assignedAdvisorId: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
