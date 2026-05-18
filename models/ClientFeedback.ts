import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientFeedbackSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    portalUserId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientPortalUser',
      required: true,
      index: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['deliverable', 'milestone', 'support-ticket', 'project'],
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ['positive', 'negative', 'constructive', 'bug_report', 'general'],
      default: 'general',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['unread', 'under-review', 'addressed', 'archived'],
      default: 'unread',
      index: true,
    },
    resolvedBy: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ClientFeedback = ((mongoose.models.ClientFeedback as Model<any>) ||
  mongoose.model('ClientFeedback', ClientFeedbackSchema)) as Model<any>;
