import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const MessageSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    contentType: {
      type: String,
      enum: ['text', 'rich', 'announcement', 'file'],
      default: 'text',
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
    replyCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    editedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ companyId: 1, channelId: 1, createdAt: -1 });
MessageSchema.index({ companyId: 1, conversationId: 1, createdAt: -1 });

export const Message = ((mongoose.models.Message as Model<any>) ||
  mongoose.model('Message', MessageSchema)) as Model<any>;
