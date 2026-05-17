import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskStatusSchema = new Schema(
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
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'done'],
      required: true,
      default: 'todo',
    },
    color: {
      type: String,
      default: '#94a3b8', // Tailwind slate-400
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed index for loading status lists per company ordered by sequencing
TaskStatusSchema.index({ companyId: 1, order: 1 });
TaskStatusSchema.index({ companyId: 1, key: 1 }, { unique: true });

export const TaskStatus = ((mongoose.models.TaskStatus as Model<any>) ||
  mongoose.model('TaskStatus', TaskStatusSchema)) as Model<any>;
