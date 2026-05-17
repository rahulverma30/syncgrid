import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TaskLabelSchema = new Schema(
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
    color: {
      type: String,
      default: '#3b82f6', // Tailwind blue-500
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

// High-speed compound index for loading labels per company
TaskLabelSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const TaskLabel = ((mongoose.models.TaskLabel as Model<any>) ||
  mongoose.model('TaskLabel', TaskLabelSchema)) as Model<any>;
