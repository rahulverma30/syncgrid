import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AccountSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      trim: true,
      index: true,
    },
    website: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AccountSchema.index({ companyId: 1, name: 1 });

export const Account = ((mongoose.models.Account as Model<any>) ||
  mongoose.model('Account', AccountSchema)) as Model<any>;
