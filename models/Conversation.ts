import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ConversationSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ companyId: 1, participants: 1 });

export const Conversation = ((mongoose.models.Conversation as Model<any>) ||
  mongoose.model('Conversation', ConversationSchema)) as Model<any>;
