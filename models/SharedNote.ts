import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const SharedNoteSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SharedNoteSchema.index({ companyId: 1, workspaceId: 1, title: 1 });

export const SharedNote = ((mongoose.models.SharedNote as Model<any>) ||
  mongoose.model('SharedNote', SharedNoteSchema)) as Model<any>;
