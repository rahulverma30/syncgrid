import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientAnnouncementSchema = new Schema(
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
    targetClients: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Client',
      },
    ], // Empty array means all clients of the company
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedBy: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ClientAnnouncementSchema.index({ companyId: 1, isPinned: -1, createdAt: -1 });

export const ClientAnnouncement = ((mongoose.models.ClientAnnouncement as Model<any>) ||
  mongoose.model('ClientAnnouncement', ClientAnnouncementSchema)) as Model<any>;
