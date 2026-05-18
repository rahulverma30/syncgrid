import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const SupportTicketSchema = new Schema(
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
    portalUserId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientPortalUser',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['billing', 'technical', 'bug', 'feature-request', 'general'],
      default: 'general',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId, // Internal employee user id
      default: null,
      index: true,
    },
    assigneeName: {
      type: String,
      default: 'Unassigned',
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

SupportTicketSchema.index({ companyId: 1, status: 1 });
SupportTicketSchema.index({ clientId: 1, priority: 1 });

export const SupportTicket = ((mongoose.models.SupportTicket as Model<any>) ||
  mongoose.model('SupportTicket', SupportTicketSchema)) as Model<any>;
