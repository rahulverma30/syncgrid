import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AttachmentSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AttachmentSchema.index({ companyId: 1, mimeType: 1 });

export const Attachment = ((mongoose.models.Attachment as Model<any>) ||
  mongoose.model('Attachment', AttachmentSchema)) as Model<any>;
