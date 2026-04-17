import mongoose, { Schema, Document } from 'mongoose';

interface IFreelanceAsset {
  url: string;
  name: string;
  type: string;
}

interface IFreelanceNegotiationEntry {
  by: 'client' | 'freelancer';
  action: 'request' | 'counter' | 'accept' | 'reject';
  rateBDT: number;
  hours?: number;
  totalBDT: number;
  note?: string;
  createdAt: Date;
}

export interface IFreelanceOrder extends Document {
  listingId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId; // student
  requirements: string;
  requirementsFiles: IFreelanceAsset[];
  adminNote?: string;
  priceType: 'fixed' | 'hourly';
  listedPriceBDT: number;
  quotedRateBDT: number;
  quotedHours?: number;
  proposalStatus: 'requested' | 'countered' | 'accepted' | 'rejected';
  latestOfferBy: 'client' | 'freelancer';
  proposalNote?: string;
  negotiationHistory: IFreelanceNegotiationEntry[];
  messageThreadId?: string;
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
  escrowStatus: 'pending_payment' | 'held' | 'released' | 'refunded';
  paymentMethod?: 'bkash' | 'visa' | 'mastercard';
  paymentId?: mongoose.Types.ObjectId;
  bkashPaymentId?: string;
  bkashTrxId?: string;
  stripePaymentIntentId?: string;
  deliveryFiles: IFreelanceAsset[]; // Uploadthing URLs
  clientNote?: string;
  deliveryNote?: string;
  revisionCount: number;
  dueDate: Date;
  deliveredAt?: Date;
  clientConfirmedAt?: Date;
  completedAt?: Date;
  escrowReleasedAt?: Date;
  escrowRefundedAt?: Date;
  disputedAt?: Date;
  clientReviewSubmitted: boolean;
  freelancerReviewSubmitted: boolean;
  opportunityScoreAwarded: boolean;
  clientSpendRecordedAt?: Date;
  clientSpendReversedAt?: Date;
  freelancerEarningRecordedAt?: Date;
}

const FreelanceOrderSchema = new Schema<IFreelanceOrder>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'FreelanceListing', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requirements: { type: String, required: true, maxlength: 3000 },
    requirementsFiles: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    adminNote: { type: String, maxlength: 1000 },
    priceType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    listedPriceBDT: { type: Number, default: 0, min: 0 },
    quotedRateBDT: { type: Number, default: 0, min: 0 },
    quotedHours: { type: Number, min: 1 },
    proposalStatus: {
      type: String,
      enum: ['requested', 'countered', 'accepted', 'rejected'],
    },
    latestOfferBy: {
      type: String,
      enum: ['client', 'freelancer'],
    },
    proposalNote: { type: String, maxlength: 1000 },
    negotiationHistory: [
      {
        by: { type: String, enum: ['client', 'freelancer'], required: true },
        action: { type: String, enum: ['request', 'counter', 'accept', 'reject'], required: true },
        rateBDT: { type: Number, required: true, min: 0 },
        hours: { type: Number, min: 1 },
        totalBDT: { type: Number, required: true, min: 0 },
        note: { type: String, maxlength: 1000 },
        createdAt: { type: Date, required: true, default: Date.now },
      },
    ],
    messageThreadId: { type: String },
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
    escrowStatus: {
      type: String,
      enum: ['pending_payment', 'held', 'released', 'refunded'],
      default: 'pending_payment',
    },
    paymentMethod: { type: String, enum: ['bkash', 'visa', 'mastercard'] },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    bkashPaymentId: { type: String },
    bkashTrxId: { type: String },
    stripePaymentIntentId: { type: String },
    deliveryFiles: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    clientNote: { type: String },
    deliveryNote: { type: String },
    revisionCount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    deliveredAt: { type: Date },
    clientConfirmedAt: { type: Date },
    completedAt: { type: Date },
    escrowReleasedAt: { type: Date },
    escrowRefundedAt: { type: Date },
    disputedAt: { type: Date },
    clientReviewSubmitted: { type: Boolean, default: false },
    freelancerReviewSubmitted: { type: Boolean, default: false },
    opportunityScoreAwarded: { type: Boolean, default: false },
    clientSpendRecordedAt: { type: Date },
    clientSpendReversedAt: { type: Date },
    freelancerEarningRecordedAt: { type: Date },
  },
  { timestamps: true }
);

FreelanceOrderSchema.index({ clientId: 1, createdAt: -1 });
FreelanceOrderSchema.index({ freelancerId: 1, createdAt: -1 });
FreelanceOrderSchema.index({ listingId: 1, createdAt: -1 });
FreelanceOrderSchema.index({ status: 1, escrowStatus: 1, createdAt: -1 });
FreelanceOrderSchema.index({ messageThreadId: 1 });

export const FreelanceOrder =
  mongoose.models.FreelanceOrder ||
  mongoose.model<IFreelanceOrder>('FreelanceOrder', FreelanceOrderSchema);
