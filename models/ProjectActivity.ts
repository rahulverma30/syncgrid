import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ProjectActivitySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
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
    userName: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for paginating timeline feeds
ProjectActivitySchema.index({ projectId: 1, createdAt: -1 });
ProjectActivitySchema.index({ companyId: 1, createdAt: -1 });

export const ProjectActivity = ((mongoose.models.ProjectActivity as Model<any>) ||
  mongoose.model('ProjectActivity', ProjectActivitySchema)) as Model<any>;
