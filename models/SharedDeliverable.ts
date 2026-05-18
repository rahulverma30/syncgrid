import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const SharedDeliverableSchema = new Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      required: true,
    },
    stagingUrl: {
      type: String,
      default: '',
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'revision_requested', 'archived'],
      default: 'pending_review',
      index: true,
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    revisions: [
      {
        version: { type: String, required: true },
        url: { type: String, required: true },
        description: { type: String },
        uploadedBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const SharedDeliverable = ((mongoose.models.SharedDeliverable as Model<any>) ||
  mongoose.model('SharedDeliverable', SharedDeliverableSchema)) as Model<any>;
