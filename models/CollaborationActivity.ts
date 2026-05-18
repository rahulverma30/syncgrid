import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const CollaborationActivitySchema = new Schema(
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
    type: {
      type: String,
      enum: ['message_sent', 'reaction_added', 'note_created', 'announcement_read'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

CollaborationActivitySchema.index({ companyId: 1, createdAt: -1 });

export const CollaborationActivity = ((mongoose.models.CollaborationActivity as Model<any>) ||
  mongoose.model('CollaborationActivity', CollaborationActivitySchema)) as Model<any>;
