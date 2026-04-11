// src/lib/validations.ts
// All Zod schemas for input validation. Used in both API routes and frontend forms.

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['student', 'employer', 'advisor', 'dept_head']),

  // Student fields
  university: z.string().min(2).max(120).optional(),
  department: z.string().min(2).max(60).optional(),
  yearOfStudy: z.number().int().min(1).max(5).optional(),
  studentId: z.string().max(20).optional(),

  // Employer fields
  companyName: z.string().min(2).max(120).optional(),
  industry: z.string().min(2).max(80).optional(),
  tradeLicenseNo: z.string().max(50).optional(),
  headquartersCity: z.string().max(60).optional(),

  // Advisor / Dept Head fields
  institutionName: z.string().min(2).max(120).optional(),
  advisorStaffId: z.string().max(30).optional(),
  designation: z.string().max(80).optional(),
  advisoryDepartment: z.string().max(60).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyEmailSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const ResendOTPSchema = z.object({
  email: z.string().email().toLowerCase(),
  type: z.enum(['email_verify', 'password_reset']),
});

// ── Profile ───────────────────────────────────────────────────────────────────

export const UpdateStudentProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/, 'Invalid BD phone number (+8801XXXXXXXXX)')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500).optional(),

  // Profile image
  image: z.string().url().optional(),

  // ── Resume URLs ──────────────────────────────────────────────────────────
  // resumeUrl          → manually uploaded PDF (from student/profile page)
  // generatedResumeUrl → auto-generated PDF saved from Resume Builder page
  // These are intentionally separate — saving generated resume must NEVER
  // overwrite the student's manually uploaded resume.
  resumeUrl: z.string().url().optional().nullable(),
  generatedResumeUrl: z.string().url().optional().nullable(),
  gerUrl: z.string().url().optional().nullable(),

  university: z.string().max(120).optional(),
  department: z.string().max(60).optional(),
  yearOfStudy: z.number().int().min(1).max(5).optional(),
  currentSemester: z.string().max(30).optional(),
  cgpa: z.number().min(0).max(4.0).optional(),
  completedCourses: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().max(60).optional(),
  isGraduated: z.boolean().optional(),
});

export const UpdateEmployerProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/)
    .optional()
    .or(z.literal('')),

  // ONLY company logo for employers
  companyLogo: z.string().url().optional(),

  companyName: z.string().min(2).max(120).optional(),
  industry: z.string().max(80).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companyDescription: z.string().max(1000).optional(),
  headquartersCity: z.string().max(60).optional(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ── Admin ─────────────────────────────────────────────────────────────────────

export const AdminApproveSchema = z.object({
  userId: z.string().length(24, 'Invalid user ID'),
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

// ── Module 1 — Job, Recruitment & Career Events System ───────────────────────

export const CreateJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  type: z.enum(['internship', 'part-time', 'full-time', 'campus-drive', 'webinar', 'workshop']),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  responsibilities: z.array(z.string().min(1)).max(20).optional().default([]),
  locationType: z.enum(['onsite', 'remote', 'hybrid']),
  city: z.string().max(80).optional(),

  stipendBDT: z.number().int().min(0).optional(),
  isStipendNegotiable: z.boolean().optional().default(false),

  applicationDeadline: z.string().min(1, 'Deadline is required'),
  startDate: z.string().optional(),
  durationMonths: z.number().int().min(1).max(24).optional(),

  targetUniversities: z.array(z.string()).optional().default([]),
  targetDepartments: z.array(z.string()).optional().default([]),
  targetYears: z.array(z.number().int().min(1).max(5)).optional().default([]),

  requiredSkills: z.array(z.string()).optional().default([]),
  minimumCGPA: z.number().min(0).max(4.0).optional(),
  requiredCourses: z.array(z.string()).optional().default([]),
  experienceExpectations: z.string().max(500).optional(),
  preferredCertifications: z.array(z.string()).optional().default([]),

  isBatchHiring: z.boolean().optional().default(false),
  batchUniversities: z.array(z.string()).optional().default([]),

  isActive: z.boolean().optional().default(true),
  academicSession: z.string().max(20).optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const ApplyJobSchema = z.object({
  coverLetter: z.string().max(2000).optional(),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum([
    'applied',
    'shortlisted',
    'under_review',
    'assessment_sent',
    'interview_scheduled',
    'rejected',
    'hired',
    'withdrawn',
  ]),
  note: z.string().max(500).optional(),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;
export type UpdateEmployerProfileInput = z.infer<typeof UpdateEmployerProfileSchema>;
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;
