import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const MessageReadSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

MessageReadSchema.index({ companyId: 1, userId: 1, channelId: 1 });
MessageReadSchema.index({ companyId: 1, userId: 1, conversationId: 1 });

export const MessageRead = ((mongoose.models.MessageRead as Model<any>) ||
  mongoose.model('MessageRead', MessageReadSchema)) as Model<any>;
