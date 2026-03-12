import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'subscription' | 'freelance_escrow' | 'freelance_release';
  amountBDT: number;
  method: 'bkash' | 'visa' | 'mastercard';
  status: 'initiated' | 'success' | 'failed' | 'refunded';
  bkashPaymentId?: string;
  bkashTrxId?: string;
  stripePaymentIntentId?: string; // for Visa / Mastercard via Stripe
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: 'Subscription' | 'FreelanceOrder';
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['subscription', 'freelance_escrow', 'freelance_release'],
      required: true,
    },
    amountBDT: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['bkash', 'visa', 'mastercard'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'success', 'failed', 'refunded'],
      default: 'initiated',
    },
    bkashPaymentId: { type: String },
    bkashTrxId: { type: String },
    stripePaymentIntentId: { type: String },
    referenceId: { type: Schema.Types.ObjectId, refPath: 'referenceType' },
    referenceType: { type: String, enum: ['Subscription', 'FreelanceOrder'] },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ bkashTrxId: 1 });

export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
