import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskCommentSchema = new Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskComment',
      index: true,
      default: null,
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, trim: true },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false, // Internal-only comments visible to project managers / admins
      index: true,
    },
    editHistory: [
      {
        content: { type: String, required: true },
        editedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for paginating comment feeds chronologically
TaskCommentSchema.index({ taskId: 1, parentId: 1, createdAt: 1 });

export const TaskComment = ((mongoose.models.TaskComment as Model<any>) ||
  mongoose.model('TaskComment', TaskCommentSchema)) as Model<any>;
