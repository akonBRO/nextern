import mongoose, { Schema, Document } from 'mongoose';

interface ISessionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IMockInterviewSession extends Document {
  studentId: mongoose.Types.ObjectId;
  targetRole: string; // e.g. 'Software Engineer Intern'
  targetIndustry: string; // BD industry
  messages: ISessionMessage[]; // full Groq conversation history
  overallFeedback?: string; // Groq final summary
  strengthsIdentified: string[];
  areasToImprove: string[];
  sessionDurationSeconds?: number;
  isCompleted: boolean;
}

const MockInterviewSessionSchema = new Schema<IMockInterviewSession>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: { type: String, required: true },
    targetIndustry: { type: String, required: true },
    messages: [{ role: String, content: String, timestamp: { type: Date, default: Date.now } }],
    overallFeedback: { type: String },
    strengthsIdentified: [{ type: String }],
    areasToImprove: [{ type: String }],
    sessionDurationSeconds: { type: Number },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MockInterviewSessionSchema.index({ studentId: 1, createdAt: -1 });

export const MockInterviewSession =
  mongoose.models.MockInterviewSession ||
  mongoose.model<IMockInterviewSession>('MockInterviewSession', MockInterviewSessionSchema);
