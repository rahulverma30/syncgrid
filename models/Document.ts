import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const DocumentCommentSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DocumentAttachmentSchema = new Schema({
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
  },
  uploadToken: {
    type: String,
  },
});

const DocumentSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'WikiSpace',
      required: true,
      index: true,
    },
    parentDocumentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeCategory',
      default: null,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
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
      default: 'page', // emoji or SVG name
    },
    coverImage: {
      type: String,
      default: '',
    },
    content: {
      type: String, // tip-tap HTML or stringified block node data
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'internal', 'private', 'restricted'],
      default: 'internal',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSop: {
      type: Boolean,
      default: false,
      index: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    attachments: [DocumentAttachmentSchema],
    comments: [DocumentCommentSchema],
    versionsCount: {
      type: Number,
      default: 1,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    // AI semantic markers placeholders
    aiSummary: {
      type: String,
      default: '',
    },
    aiEmbeddingIndexed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ companyId: 1, spaceId: 1, parentDocumentId: 1 });
DocumentSchema.index({ companyId: 1, slug: 1 });
DocumentSchema.index({ companyId: 1, title: 'text', content: 'text' }); // Enable text indexing for weighted searches

export const Document = ((mongoose.models.Document as Model<any>) ||
  mongoose.model('Document', DocumentSchema)) as Model<any>;
