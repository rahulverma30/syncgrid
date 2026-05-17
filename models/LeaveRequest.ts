import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const LeaveRequestSchema = new Schema(
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
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'paid', 'unpaid', 'emergency', 'maternity_paternity'],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    managerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

LeaveRequestSchema.index({ companyId: 1, employeeId: 1, status: 1 });

export const LeaveRequest = ((mongoose.models.LeaveRequest as Model<any>) ||
  mongoose.model('LeaveRequest', LeaveRequestSchema)) as Model<any>;
