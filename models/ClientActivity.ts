import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientActivitySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for paginating timeline feeds
ClientActivitySchema.index({ clientId: 1, createdAt: -1 });

export const ClientActivity = ((mongoose.models.ClientActivity as Model<any>) ||
  mongoose.model('ClientActivity', ClientActivitySchema)) as Model<any>;
