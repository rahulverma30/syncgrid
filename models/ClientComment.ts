import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientCommentSchema = new Schema(
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
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['deliverable', 'milestone', 'support-ticket', 'discussion'],
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    authorType: {
      type: String,
      enum: ['client-user', 'internal-user'],
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorImage: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    isInternalOnly: {
      type: Boolean,
      default: false,
      index: true,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, default: 0 },
      },
    ],
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientComment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ClientCommentSchema.index({ referenceId: 1, createdAt: 1 });

export const ClientComment = ((mongoose.models.ClientComment as Model<any>) ||
  mongoose.model('ClientComment', ClientCommentSchema)) as Model<any>;
