import mongoose, { Schema } from 'mongoose';
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
    isSystem: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

export const Permission =
  mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
