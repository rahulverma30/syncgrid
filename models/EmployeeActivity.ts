import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const EmployeeActivitySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'hired',
        'promoted',
        'transferred',
        'leave_requested',
        'leave_approved',
        'leave_rejected',
        'checked_in',
        'checked_out',
        'performance_submitted',
        'document_uploaded',
        'asset_assigned',
        'asset_returned',
        'checklist_updated',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

EmployeeActivitySchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });

export const EmployeeActivity = ((mongoose.models.EmployeeActivity as Model<any>) ||
  mongoose.model('EmployeeActivity', EmployeeActivitySchema)) as Model<any>;
