import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const DealSchema = new Schema(
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
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    expectedCloseDate: {
      type: Date,
      required: true,
    },
    stage: {
      type: String,
      enum: ['qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'qualified',
      index: true,
    },
    probability: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    notes: [
      {
        content: { type: String },
        createdByName: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

DealSchema.index({ companyId: 1, stage: 1 });
DealSchema.index({ companyId: 1, expectedCloseDate: 1 });

export const Deal = ((mongoose.models.Deal as Model<any>) ||
  mongoose.model('Deal', DealSchema)) as Model<any>;
