import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskWatcherSchema = new Schema(
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
    },
  },
  {
    timestamps: true,
  }
);

TaskWatcherSchema.index({ taskId: 1, userId: 1 }, { unique: true });
TaskWatcherSchema.index({ userId: 1 });

export const TaskWatcher = ((mongoose.models.TaskWatcher as Model<any>) ||
  mongoose.model('TaskWatcher', TaskWatcherSchema)) as Model<any>;
