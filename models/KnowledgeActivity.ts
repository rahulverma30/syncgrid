import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const KnowledgeActivitySchema = new Schema(
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
      default: null,
      index: true,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'WikiSpace',
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'created',
        'edited',
        'version_restored',
        'commented',
        'shared',
        'acknowledged',
        'space_created',
      ],
      required: true,
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning'],
      default: 'info',
    },
  },
  {
    timestamps: true,
  }
);

KnowledgeActivitySchema.index({ companyId: 1, createdAt: -1 });

export const KnowledgeActivity = ((mongoose.models.KnowledgeActivity as Model<any>) ||
  mongoose.model('KnowledgeActivity', KnowledgeActivitySchema)) as Model<any>;
