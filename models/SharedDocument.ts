import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const SharedDocumentSchema = new Schema(
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
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    isDownloadable: {
      type: Boolean,
      default: true,
    },
    isWatermarked: {
      type: Boolean,
      default: false,
    },
    watermarkText: {
      type: String,
      default: 'CONFIDENTIAL',
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    sharedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

SharedDocumentSchema.index({ clientId: 1, documentId: 1 }, { unique: true });

export const SharedDocument = ((mongoose.models.SharedDocument as Model<any>) ||
  mongoose.model('SharedDocument', SharedDocumentSchema)) as Model<any>;
