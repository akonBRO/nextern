import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'student_premium' | 'employer_premium';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  amountBDT: number;
  paymentMethod: 'bkash' | 'visa' | 'mastercard';
  paymentId: mongoose.Types.ObjectId;
  autoRenew: boolean;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['student_premium', 'employer_premium'], required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amountBDT: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['bkash', 'visa', 'mastercard'], required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
