import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientPortalSessionSchema = new Schema(
  {
    portalUserId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientPortalUser',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ClientPortalSession = ((mongoose.models.ClientPortalSession as Model<any>) ||
  mongoose.model('ClientPortalSession', ClientPortalSessionSchema)) as Model<any>;
