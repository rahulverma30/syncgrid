import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';
import { PERMISSION_ACTIONS } from '@/constants/rbac';

const PermissionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: PERMISSION_ACTIONS,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      default: 'core',
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: 'general',
      trim: true,
      lowercase: true,
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSystemPermission: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

export const Permission = ((mongoose.models.Permission as Model<any>) ||
  mongoose.model('Permission', PermissionSchema)) as Model<any>;
