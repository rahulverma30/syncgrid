import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const PipelineStageSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, required: true }, // e.g. Hex code or HSL token
    order: { type: Number, required: true },
  },
  { _id: false }
);

const CrmSettingsSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    pipelineStages: {
      type: [PipelineStageSchema],
      default: [
        { id: 'new', label: 'New Lead', color: '#3b82f6', order: 1 },
        { id: 'contacted', label: 'Contacted', color: '#a855f7', order: 2 },
        { id: 'proposal', label: 'Proposal Sent', color: '#eab308', order: 3 },
        { id: 'negotiation', label: 'Negotiating', color: '#f97316', order: 4 },
        { id: 'won', label: 'Won (Closed)', color: '#22c55e', order: 5 },
        { id: 'lost', label: 'Lost (Closed)', color: '#ef4444', order: 6 },
      ],
    },
    leadSources: {
      type: [String],
      default: ['website', 'upwork', 'linkedin', 'referral', 'ads', 'cold-reach', 'social'],
    },
  },
  {
    timestamps: true,
  }
);

export const CrmSettings = ((mongoose.models.CrmSettings as Model<any>) ||
  mongoose.model('CrmSettings', CrmSettingsSchema)) as Model<any>;
