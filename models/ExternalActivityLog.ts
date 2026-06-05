import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ExternalActivityLogSchema = new Schema(
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
    portalUserName: {
      type: String,
      required: true,
    },
    action: {
      type: String, // e.g., 'login', 'approve_deliverable', 'download_doc', 'create_ticket'
      required: true,
      index: true,
    },
    resource: {
      type: String, // e.g., 'deliverable', 'invoice', 'project', 'support_ticket'
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ExternalActivityLogSchema.index({ clientId: 1, createdAt: -1 });

export const ExternalActivityLog = ((mongoose.models.ExternalActivityLog as Model<any>) ||
  mongoose.model('ExternalActivityLog', ExternalActivityLogSchema)) as Model<any>;
