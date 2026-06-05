import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const PresenceSessionSchema = new Schema(
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
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline',
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    currentChannelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
    },
  },
  {
    timestamps: true,
  }
);

export const PresenceSession = ((mongoose.models.PresenceSession as Model<any>) ||
  mongoose.model('PresenceSession', PresenceSessionSchema)) as Model<any>;
