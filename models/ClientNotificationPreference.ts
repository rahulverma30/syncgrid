import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientNotificationPreferenceSchema = new Schema(
  {
    portalUserId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientPortalUser',
      required: true,
      unique: true,
      index: true,
    },
    emailAlerts: {
      approvals: { type: Boolean, default: true },
      deliverables: { type: Boolean, default: true },
      invoices: { type: Boolean, default: true },
      supportTickets: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
    },
    inAppAlerts: {
      approvals: { type: Boolean, default: true },
      deliverables: { type: Boolean, default: true },
      invoices: { type: Boolean, default: true },
      supportTickets: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const ClientNotificationPreference = ((mongoose.models
  .ClientNotificationPreference as Model<any>) ||
  mongoose.model('ClientNotificationPreference', ClientNotificationPreferenceSchema)) as Model<any>;
