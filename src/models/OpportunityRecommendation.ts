import mongoose, { Document, Schema } from 'mongoose';

export interface IOpportunityRecommendation extends Document {
  studentId: mongoose.Types.ObjectId;
  recommenderId: mongoose.Types.ObjectId;
  employerId?: mongoose.Types.ObjectId;
  recommenderRole: 'advisor' | 'dept_head';
  category: 'job' | 'event' | 'course' | 'project' | 'academic_path' | 'skill_plan';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  focusSkills: string[];
  linkedJobId?: mongoose.Types.ObjectId;
  resourceUrl?: string;
  fitScore?: number;
  status: 'active' | 'archived';
  requestStatus: 'pending' | 'accepted' | 'rejected' | 'hold';
  employerResponseNote?: string;
  employerRespondedAt?: Date;
}

const OpportunityRecommendationSchema = new Schema<IOpportunityRecommendation>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recommenderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User' },
    recommenderRole: {
      type: String,
      enum: ['advisor', 'dept_head'],
      required: true,
    },
    category: {
      type: String,
      enum: ['job', 'event', 'course', 'project', 'academic_path', 'skill_plan'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 2400 },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    focusSkills: [{ type: String }],
    linkedJobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    resourceUrl: { type: String },
    fitScore: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    requestStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'hold'],
      default: 'pending',
    },
    employerResponseNote: { type: String, maxlength: 1200 },
    employerRespondedAt: { type: Date },
  },
  { timestamps: true }
);

OpportunityRecommendationSchema.index({ studentId: 1, status: 1, createdAt: -1 });
OpportunityRecommendationSchema.index({ recommenderId: 1, status: 1, createdAt: -1 });
OpportunityRecommendationSchema.index({
  employerId: 1,
  requestStatus: 1,
  status: 1,
  createdAt: -1,
});

export const OpportunityRecommendation =
  mongoose.models.OpportunityRecommendation ||
  mongoose.model<IOpportunityRecommendation>(
    'OpportunityRecommendation',
    OpportunityRecommendationSchema
  );
