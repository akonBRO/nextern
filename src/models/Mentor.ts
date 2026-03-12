import mongoose, { Schema, Document } from 'mongoose';

export interface IMentor extends Document {
  userId: mongoose.Types.ObjectId;
  expertise: string[];
  industry: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  bio: string;
  monthlySessionLimit: number;
  sessionsThisMonth: number; // cached — reset 1st of each month
  isAvailable: boolean;
  averageRating: number; // cached average of student ratings
  totalSessions: number;
  linkedinUrl?: string;
  graduatedFrom?: string; // BD university
  mentorType: 'alumni' | 'professional'; // alumni = graduated from a BD university
  // professional = external industry volunteer
}

const MentorSchema = new Schema<IMentor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    expertise: [{ type: String }],
    industry: { type: String, required: true },
    currentRole: { type: String, required: true },
    currentCompany: { type: String, required: true },
    yearsOfExperience: { type: Number, min: 0, required: true },
    bio: { type: String, maxlength: 800, required: true },
    monthlySessionLimit: { type: Number, default: 4 },
    sessionsThisMonth: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalSessions: { type: Number, default: 0 },
    linkedinUrl: { type: String },
    graduatedFrom: { type: String },
    mentorType: { type: String, enum: ['alumni', 'professional'], required: true },
  },
  { timestamps: true }
);

MentorSchema.index({ expertise: 1, isAvailable: 1, mentorType: 1 });
MentorSchema.index({ averageRating: -1 });

export const Mentor = mongoose.models.Mentor || mongoose.model<IMentor>('Mentor', MentorSchema);
