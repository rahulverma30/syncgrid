import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const RoleAssignmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    conditions: {
      type: Schema.Types.Mixed,
      default: {},
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

// Prevent duplicate assignments of the same role to the same user within a specific scope
RoleAssignmentSchema.index(
  { userId: 1, roleId: 1, companyId: 1, workspaceId: 1, departmentId: 1 },
  { unique: true }
);

export const RoleAssignment = ((mongoose.models.RoleAssignment as Model<any>) ||
  mongoose.model('RoleAssignment', RoleAssignmentSchema)) as Model<any>;
