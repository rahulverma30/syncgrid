import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const DepartmentSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    isSoftDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize multi-tenant queries
DepartmentSchema.index({ companyId: 1, isSoftDeleted: 1 });
DepartmentSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Department = ((mongoose.models.Department as Model<any>) ||
  mongoose.model('Department', DepartmentSchema)) as Model<any>;
