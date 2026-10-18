import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'milestone' | 'payment' | 'approval' | 'alert';
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'milestone', 'payment', 'approval', 'alert'],
      default: 'info',
    },
    linkUrl: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
