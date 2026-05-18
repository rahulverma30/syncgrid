import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientPortalUserSchema = new Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    portalRole: {
      type: String,
      enum: ['Client Owner', 'Client Stakeholder', 'Client Reviewer', 'Client Finance Contact'],
      default: 'Client Reviewer',
      index: true,
    },
    status: {
      type: String,
      enum: ['invited', 'active', 'disabled'],
      default: 'invited',
      index: true,
    },
    inviteToken: {
      type: String,
      default: null,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ClientPortalUserSchema.index({ companyId: 1, email: 1 }, { unique: true });
ClientPortalUserSchema.index({ clientId: 1, status: 1 });

export const ClientPortalUser = ((mongoose.models.ClientPortalUser as Model<any>) ||
  mongoose.model('ClientPortalUser', ClientPortalUserSchema)) as Model<any>;
