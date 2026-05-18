import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientPortalAuditLogSchema = new Schema(
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
      index: true,
    },
    portalUserName: {
      type: String,
      default: 'System',
    },
    eventType: {
      type: String, // 'login_success', 'login_fail', 'mfa_verify', 'approve_item', 'download_secure_doc', 'invite_client', 'permission_change'
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
    },
    actionDetails: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ClientPortalAuditLogSchema.index({ companyId: 1, createdAt: -1 });
ClientPortalAuditLogSchema.index({ clientId: 1, createdAt: -1 });

export const ClientPortalAuditLog = ((mongoose.models.ClientPortalAuditLog as Model<any>) ||
  mongoose.model('ClientPortalAuditLog', ClientPortalAuditLogSchema)) as Model<any>;
