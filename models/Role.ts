import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const RoleSchema = new Schema(
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
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
      index: true,
    },
    hierarchyLevel: {
      type: Number,
      required: true,
      default: 100, // lower numbers mean higher priority / hierarchical supremacy
      index: true,
    },
    inheritedRoles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
    workspaceRestrictions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
      },
    ],
    departmentRestrictions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    priority: {
      type: Number,
      default: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness globally or per company
RoleSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { companyId: null },
  }
);

RoleSchema.index(
  { slug: 1, companyId: 1 },
  {
    unique: true,
    partialFilterExpression: { companyId: { $type: 'objectId' } },
  }
);

export const Role = ((mongoose.models.Role as Model<any>) ||
  mongoose.model('Role', RoleSchema)) as Model<any>;
