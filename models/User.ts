import mongoose, { Schema } from 'mongoose';

const PermissionOverrideSchema = new Schema(
  {
    resource: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    actions: [
      {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    ],
    effect: {
      type: String,
      enum: ['allow', 'deny'],
      default: 'allow',
    },
  },
  {
    _id: false,
  }
);

const UserSchema = new Schema(
  {
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
      select: false,
    },
    image: {
      type: String,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
    permissionOverrides: [PermissionOverrideSchema],
    status: {
      type: String,
      enum: ['invited', 'active', 'disabled', 'locked'],
      default: 'active',
      index: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
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

UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
