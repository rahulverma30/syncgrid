import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ReactionSchema = new Schema(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    emoji: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ReactionSchema.index({ companyId: 1, messageId: 1 });

export const Reaction = ((mongoose.models.Reaction as Model<any>) ||
  mongoose.model('Reaction', ReactionSchema)) as Model<any>;
