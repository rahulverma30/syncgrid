import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientPortalPermissionSchema = new Schema(
  {
    portalRole: {
      type: String,
      enum: ['Client Owner', 'Client Stakeholder', 'Client Reviewer', 'Client Finance Contact'],
      required: true,
      unique: true,
      index: true,
    },
    allowedResources: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    allowedActions: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ClientPortalPermission = ((mongoose.models.ClientPortalPermission as Model<any>) ||
  mongoose.model('ClientPortalPermission', ClientPortalPermissionSchema)) as Model<any>;
