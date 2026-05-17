import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskMentionSchema = new Schema(
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
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskComment',
      index: true,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentionedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TaskMentionSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const TaskMention = ((mongoose.models.TaskMention as Model<any>) ||
  mongoose.model('TaskMention', TaskMentionSchema)) as Model<any>;
