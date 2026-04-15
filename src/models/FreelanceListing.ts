import mongoose, { Schema, Document } from 'mongoose';

interface IFreelanceAsset {
  url: string;
  name: string;
  type: string;
}

export interface IFreelanceListing extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category:
    | 'web-dev'
    | 'graphic-design'
    | 'content-writing'
    | 'data-analysis'
    | 'video-editing'
    | 'other';
  skills: string[];
  priceType: 'fixed' | 'hourly';
  priceBDT: number; // BDT integer
  deliveryDays: number;
  sampleFiles: IFreelanceAsset[]; // Uploadthing URLs
  averageRating: number;
  totalOrdersCompleted: number;
  isActive: boolean;
}

const FreelanceListingSchema = new Schema<IFreelanceListing>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      enum: [
        'web-dev',
        'graphic-design',
        'content-writing',
        'data-analysis',
        'video-editing',
        'other',
      ],
      required: true,
    },
    skills: [{ type: String }],
    priceType: { type: String, enum: ['fixed', 'hourly'], required: true },
    priceBDT: { type: Number, required: true, min: 0 },
    deliveryDays: { type: Number, required: true, min: 1 },
    sampleFiles: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrdersCompleted: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FreelanceListingSchema.index({ studentId: 1, createdAt: -1 });
FreelanceListingSchema.index({ isActive: 1, category: 1, priceBDT: 1 });
FreelanceListingSchema.index({ skills: 1, isActive: 1 });

export const FreelanceListing =
  mongoose.models.FreelanceListing ||
  mongoose.model<IFreelanceListing>('FreelanceListing', FreelanceListingSchema);
