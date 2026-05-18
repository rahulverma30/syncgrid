import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const PinnedMessageSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PinnedMessageSchema.index({ companyId: 1, channelId: 1 });

export const PinnedMessage = ((mongoose.models.PinnedMessage as Model<any>) ||
  mongoose.model('PinnedMessage', PinnedMessageSchema)) as Model<any>;
