import mongoose, { Schema, Document } from 'mongoose';

export interface IFreelanceOrder extends Document {
  listingId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId; // student
  requirements: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'delivered'
    | 'revision_requested'
    | 'completed'
    | 'cancelled'
    | 'disputed';
  agreedPriceBDT: number;
  nexternCutBDT: number;
  freelancerPayoutBDT: number;
  escrowStatus: 'held' | 'released' | 'refunded';
  bkashPaymentId?: string;
  bkashTrxId?: string;
  deliveryFiles: string[]; // Uploadthing URLs
  clientNote?: string;
  deliveryNote?: string;
  revisionCount: number;
  dueDate: Date;
  completedAt?: Date;
  opportunityScoreAwarded: boolean;
}

const FreelanceOrderSchema = new Schema<IFreelanceOrder>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'FreelanceListing', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requirements: { type: String, required: true, maxlength: 3000 },
    status: {
      type: String,
      enum: [
        'pending',
        'in_progress',
        'delivered',
        'revision_requested',
        'completed',
        'cancelled',
        'disputed',
      ],
      default: 'pending',
    },
    agreedPriceBDT: { type: Number, required: true, min: 0 },
    nexternCutBDT: { type: Number, default: 0 },
    freelancerPayoutBDT: { type: Number, default: 0 },
    escrowStatus: { type: String, enum: ['held', 'released', 'refunded'], default: 'held' },
    bkashPaymentId: { type: String },
    bkashTrxId: { type: String },
    deliveryFiles: [{ type: String }],
    clientNote: { type: String },
    deliveryNote: { type: String },
    revisionCount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    completedAt: { type: Date },
    opportunityScoreAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FreelanceOrder =
  mongoose.models.FreelanceOrder ||
  mongoose.model<IFreelanceOrder>('FreelanceOrder', FreelanceOrderSchema);
