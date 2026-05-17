import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const GoalSchema = new Schema(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'achieved', 'missed'],
      default: 'in_progress',
    },
    kpi: { type: String, default: '' },
  },
  { _id: false }
);

const EmployeePerformanceReviewSchema = new Schema(
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
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cycleName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    selfFeedback: {
      type: String,
      default: '',
    },
    managerFeedback: {
      type: String,
      default: '',
    },
    goals: [GoalSchema],
  },
  {
    timestamps: true,
  }
);

EmployeePerformanceReviewSchema.index({ companyId: 1, employeeId: 1, cycleName: 1 });

export const EmployeePerformanceReview = ((mongoose.models
  .EmployeePerformanceReview as Model<any>) ||
  mongoose.model('EmployeePerformanceReview', EmployeePerformanceReviewSchema)) as Model<any>;
