import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const DocumentVersionSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    editorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    changeSummary: {
      type: String,
      default: 'Manual save checkpoint',
    },
    versionNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

DocumentVersionSchema.index({ documentId: 1, versionNumber: -1 });

export const DocumentVersion = ((mongoose.models.DocumentVersion as Model<any>) ||
  mongoose.model('DocumentVersion', DocumentVersionSchema)) as Model<any>;
