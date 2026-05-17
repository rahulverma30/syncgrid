import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskActivitySchema = new Schema(
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
    type: {
      type: String,
      required: true,
      index: true,
      // e.g., 'created', 'updated', 'status_change', 'assignee_changed', 'comment_added', 'checklist_updated', 'timer_toggled', 'dependency_added'
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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

// High-speed compound index for loading a task's activity timeline
TaskActivitySchema.index({ taskId: 1, createdAt: -1 });

export const TaskActivity = ((mongoose.models.TaskActivity as Model<any>) ||
  mongoose.model('TaskActivity', TaskActivitySchema)) as Model<any>;
