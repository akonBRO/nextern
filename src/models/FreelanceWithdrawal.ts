import mongoose, { Document, Schema } from 'mongoose';

export interface IFreelanceWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  amountBDT: number;
  status: 'requested' | 'processed' | 'rejected';
  note?: string;
  adminNote?: string;
  accountBalanceBeforeBDT: number;
  accountBalanceAfterBDT: number;
  processedAt?: Date;
  rejectedAt?: Date;
}

const FreelanceWithdrawalSchema = new Schema<IFreelanceWithdrawal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountBDT: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['requested', 'processed', 'rejected'],
      default: 'requested',
    },
    note: { type: String, maxlength: 500 },
    adminNote: { type: String, maxlength: 1000 },
    accountBalanceBeforeBDT: { type: Number, required: true, min: 0 },
    accountBalanceAfterBDT: { type: Number, required: true, min: 0 },
    processedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

FreelanceWithdrawalSchema.index({ userId: 1, createdAt: -1 });
FreelanceWithdrawalSchema.index({ status: 1, createdAt: -1 });

export const FreelanceWithdrawal =
  mongoose.models.FreelanceWithdrawal ||
  mongoose.model<IFreelanceWithdrawal>('FreelanceWithdrawal', FreelanceWithdrawalSchema);
