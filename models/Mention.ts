import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const MentionSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['direct', 'channel', 'all'],
      default: 'direct',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MentionSchema.index({ companyId: 1, userId: 1, isRead: 1 });

export const Mention = ((mongoose.models.Mention as Model<any>) ||
  mongoose.model('Mention', MentionSchema)) as Model<any>;
