import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

// Sub-schemas for Client
const ClientContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    communicationPref: {
      type: String,
      enum: ['email', 'phone', 'slack', 'zoom'],
      default: 'email',
    },
  },
  { _id: true, timestamps: true }
);

const ClientNoteSchema = new Schema(
  {
    content: { type: String, required: true },
    createdByName: { type: String, required: true },
    isPinned: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    editHistory: [
      {
        content: { type: String, required: true },
        editedBy: { type: String, required: true },
        editedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: true }
);

const ClientDocumentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['contract', 'proposal', 'NDA', 'invoice', 'onboarding', 'legal'],
      default: 'proposal',
    },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    uploadedBy: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ClientContractSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    value: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'expired', 'renewal-pending'],
      default: 'active',
    },
  },
  { _id: true, timestamps: true }
);

const ClientMeetingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    attendees: [{ type: String }],
    notes: { type: String },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const ClientCommLogSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'other'],
      default: 'email',
    },
    summary: { type: String, trim: true },
    loggedBy: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ClientTimelineSchema = new Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    userName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Main Client Schema
const ClientSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    crmAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    clientType: {
      type: String,
      enum: ['VIP', 'Enterprise', 'Startup', 'High Value', 'Retainer', 'Inactive'],
      default: 'Startup',
      index: true,
    },
    industry: {
      type: String,
      trim: true,
      index: true,
    },
    emails: [{ type: String, lowercase: true, trim: true }],
    phones: [{ type: String, trim: true }],
    address: { type: String },
    timezone: { type: String, default: 'UTC' },
    website: { type: String, trim: true },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201+'],
      default: '1-10',
    },
    revenueContribution: {
      type: Number,
      default: 0,
      index: true,
    },
    accountManager: {
      type: String,
      trim: true,
      index: true,
    },
    onboardingStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
      index: true,
    },
    retentionStatus: {
      type: String,
      enum: ['retained', 'churn-risk', 'churned'],
      default: 'retained',
      index: true,
    },
    healthScore: {
      type: Number,
      default: 80,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    contacts: [ClientContactSchema],
    notes: [ClientNoteSchema],
    documents: [ClientDocumentSchema],
    contracts: [ClientContractSchema],
    meetings: [ClientMeetingSchema],
    communicationLogs: [ClientCommLogSchema],
    timeline: [ClientTimelineSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance dynamic queries

ClientSchema.index({ companyId: 1, clientType: 1 });
ClientSchema.index({ companyId: 1, retentionStatus: 1 });
ClientSchema.index({ companyId: 1, healthScore: 1 });

export const Client = ((mongoose.models.Client as Model<any>) ||
  mongoose.model('Client', ClientSchema)) as Model<any>;
