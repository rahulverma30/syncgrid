import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    settings: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      locale: {
        type: String,
        default: 'en',
      },
    },
    subscription: {
      plan: {
        type: String,
        default: 'starter',
      },
      status: {
        type: String,
        enum: ['trialing', 'active', 'past_due', 'canceled'],
        default: 'trialing',
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Company = ((mongoose.models.Company as Model<any>) ||
  mongoose.model('Company', CompanySchema)) as Model<any>;
