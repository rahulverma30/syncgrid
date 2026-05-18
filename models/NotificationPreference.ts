import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const NotificationPreferenceSchema = new Schema(
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
      unique: true,
      index: true,
    },
    dmPreference: {
      type: String,
      enum: ['all', 'mentions', 'none'],
      default: 'all',
    },
    channelPreference: {
      type: String,
      enum: ['all', 'mentions', 'none'],
      default: 'mentions',
    },
    mutedChannels: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Channel',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = ((mongoose.models.NotificationPreference as Model<any>) ||
  mongoose.model('NotificationPreference', NotificationPreferenceSchema)) as Model<any>;
