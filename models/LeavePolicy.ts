import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const LeavePolicySchema = new Schema(
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
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'paid', 'unpaid', 'emergency', 'maternity_paternity'],
      required: true,
    },
    annualAllowance: {
      type: Number,
      required: true,
      default: 15,
    },
    carryOverLimit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

LeavePolicySchema.index({ companyId: 1, leaveType: 1 }, { unique: true });

export const LeavePolicy = ((mongoose.models.LeavePolicy as Model<any>) ||
  mongoose.model('LeavePolicy', LeavePolicySchema)) as Model<any>;
