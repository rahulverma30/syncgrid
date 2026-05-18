import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ThreadSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    parentMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    replies: [
      {
        senderId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        attachments: [
          {
            fileName: String,
            fileUrl: String,
            fileSize: Number,
            mimeType: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

ThreadSchema.index({ companyId: 1, parentMessageId: 1 });

export const Thread = ((mongoose.models.Thread as Model<any>) ||
  mongoose.model('Thread', ThreadSchema)) as Model<any>;
