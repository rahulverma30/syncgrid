import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type:
    | 'lead'
    | 'deal'
    | 'project'
    | 'task'
    | 'invoice'
    | 'payment'
    | 'attendance'
    | 'system'
    | 'mention'
    | 'approval';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'lead',
        'deal',
        'project',
        'task',
        'invoice',
        'payment',
        'attendance',
        'system',
        'mention',
        'approval',
      ],
      default: 'system',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
NotificationSchema.index({ companyId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
