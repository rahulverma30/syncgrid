import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AnnouncementSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
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
    },
    pinnedUntil: {
      type: Date,
    },
    acknowledgedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reactions: [
      {
        emoji: String,
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    comments: [
      {
        content: String,
        authorId: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ companyId: 1, createdAt: -1 });

export const Announcement = ((mongoose.models.Announcement as Model<any>) ||
  mongoose.model('Announcement', AnnouncementSchema)) as Model<any>;
