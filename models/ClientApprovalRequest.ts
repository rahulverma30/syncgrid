import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ApprovalHistoryItemSchema = new Schema(
  {
    action: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'revision_requested'],
      required: true,
    },
    actedBy: {
      type: String, // 'client' or 'internal'
      enum: ['client', 'internal'],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
    actedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ClientApprovalRequestSchema = new Schema(
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
    type: {
      type: String,
      enum: ['deliverable', 'milestone', 'invoice', 'design-review'],
      required: true,
      index: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision_requested'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    history: [ApprovalHistoryItemSchema],
  },
  {
    timestamps: true,
  }
);

ClientApprovalRequestSchema.index({ clientId: 1, type: 1 });

export const ClientApprovalRequest = ((mongoose.models.ClientApprovalRequest as Model<any>) ||
  mongoose.model('ClientApprovalRequest', ClientApprovalRequestSchema)) as Model<any>;
