import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const CRMActivitySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'created',
        'updated',
        'status_change',
        'stage_change',
        'note_added',
        'email',
        'call',
        'meeting',
        'converted',
        'won',
        'lost',
      ],
      required: true,
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
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    dealId: {
      type: Schema.Types.ObjectId,
      ref: 'Deal',
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CRMActivitySchema.index({ companyId: 1, leadId: 1 });
CRMActivitySchema.index({ companyId: 1, accountId: 1 });
CRMActivitySchema.index({ companyId: 1, dealId: 1 });

export const CRMActivity = ((mongoose.models.CRMActivity as Model<any>) ||
  mongoose.model('CRMActivity', CRMActivitySchema)) as Model<any>;
