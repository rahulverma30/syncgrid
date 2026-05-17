import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskTimeLogSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 0,
    },
    billable: {
      type: Boolean,
      default: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    isRunning: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed indices for timesheet reporting
TaskTimeLogSchema.index({ userId: 1, startTime: -1 });
TaskTimeLogSchema.index({ taskId: 1, isRunning: 1 });

export const TaskTimeLog = ((mongoose.models.TaskTimeLog as Model<any>) ||
  mongoose.model('TaskTimeLog', TaskTimeLogSchema)) as Model<any>;
