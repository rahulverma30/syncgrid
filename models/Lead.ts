import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

// Note Subschema
const LeadNoteSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    isPinned: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Reminder Subschema
const LeadReminderSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['call', 'meeting', 'email', 'custom'], default: 'custom' },
    dueDate: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Attachment Subschema
const LeadAttachmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    category: { type: String, enum: ['proposal', 'contract', 'other'], default: 'other' },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Timeline Event Subschema
const LeadTimelineSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'created',
        'status_change',
        'assignment',
        'call',
        'email',
        'note_added',
        'attachment_added',
        'reminder_added',
        'stage_change',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
  },
  { timestamps: true }
);

// Alternate Contact Subschema
const AlternateContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
  },
  { _id: false }
);

// Main Lead Schema
const LeadSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true, // Company Name
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    alternateContacts: [AlternateContactSchema],
    status: {
      type: String,
      required: true,
      default: 'new', // references dynamic stage IDs
      index: true,
    },
    source: {
      type: String,
      default: 'website',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    workType: {
      type: String,
      trim: true,
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    expectedCloseDate: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
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
    notes: [LeadNoteSchema],
    reminders: [LeadReminderSchema],
    attachments: [LeadAttachmentSchema],
    timeline: [LeadTimelineSchema],
  },
  {
    timestamps: true,
  }
);

// Compound optimization index
LeadSchema.index({ companyId: 1, isArchived: 1 });
LeadSchema.index({ companyId: 1, status: 1 });
LeadSchema.index({ companyId: 1, assignedTo: 1 });

export const Lead = ((mongoose.models.Lead as Model<any>) ||
  mongoose.model('Lead', LeadSchema)) as Model<any>;
