import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const WikiSpaceSchema = new Schema(
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
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'folder', // e.g. emoji or SVG name
    },
    description: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'internal', 'private', 'restricted'],
      default: 'internal',
      index: true,
    },
    permissions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['editor', 'viewer', 'admin'] },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

WikiSpaceSchema.index({ companyId: 1, slug: 1 }, { unique: true });
WikiSpaceSchema.index({ companyId: 1, visibility: 1 });

export const WikiSpace = ((mongoose.models.WikiSpace as Model<any>) ||
  mongoose.model('WikiSpace', WikiSpaceSchema)) as Model<any>;
