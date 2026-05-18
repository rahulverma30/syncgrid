import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const KnowledgeCategorySchema = new Schema(
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
    colorCode: {
      type: String,
      default: '#10B981', // green accent color
    },
  },
  {
    timestamps: true,
  }
);

KnowledgeCategorySchema.index({ companyId: 1, slug: 1 }, { unique: true });

export const KnowledgeCategory = ((mongoose.models.KnowledgeCategory as Model<any>) ||
  mongoose.model('KnowledgeCategory', KnowledgeCategorySchema)) as Model<any>;
