import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ReadingProgressSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    percentViewed: {
      type: Number,
      default: 100, // 0 - 100
    },
    acknowledged: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ReadingProgressSchema.index({ companyId: 1, userId: 1, documentId: 1 }, { unique: true });

export const ReadingProgress = ((mongoose.models.ReadingProgress as Model<any>) ||
  mongoose.model('ReadingProgress', ReadingProgressSchema)) as Model<any>;
