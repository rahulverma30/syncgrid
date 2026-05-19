import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const InvitationSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    onboardingMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate pending invitations to the same email in the same company
InvitationSchema.index({ companyId: 1, email: 1, status: 1 });

export const Invitation = ((mongoose.models.Invitation as Model<any>) ||
  mongoose.model('Invitation', InvitationSchema)) as Model<any>;
