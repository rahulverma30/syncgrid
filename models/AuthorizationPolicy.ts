import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AuthorizationPolicySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    actions: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    conditions: {
      type: Schema.Types.Mixed,
      default: {}, // e.g., { "isOwner": true, "departmentMatch": true }
    },
    effect: {
      type: String,
      enum: ['allow', 'deny'],
      default: 'allow',
      required: true,
    },
    priority: {
      type: Number,
      default: 10, // lower priority executes first (allows deny overrides to be structured perfectly)
      index: true,
    },
    tenantAware: {
      type: Boolean,
      default: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AuthorizationPolicySchema.index({ companyId: 1, resource: 1, enabled: 1 });

export const AuthorizationPolicy = ((mongoose.models.AuthorizationPolicy as Model<any>) ||
  mongoose.model('AuthorizationPolicy', AuthorizationPolicySchema)) as Model<any>;
