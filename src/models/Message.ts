import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  threadId: string; // [senderId,receiverId].sort().join('-')
  content: string;
  isRead: boolean;
  readAt?: Date;
  isFlagged: boolean; // admin monitoring
  flagReason?: string;
  templateType?: 'interview_invite' | 'rejection' | 'offer_letter' | null;
  attachmentUrl?: string; // Uploadthing URL
  relatedJobId?: mongoose.Types.ObjectId;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    threadId: { type: String, required: true },
    content: { type: String, required: true, maxlength: 5000 },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    templateType: {
      type: String,
      enum: ['interview_invite', 'rejection', 'offer_letter', null],
      default: null,
    },
    attachmentUrl: { type: String },
    relatedJobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  },
  { timestamps: true }
);

MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

export const Message =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
