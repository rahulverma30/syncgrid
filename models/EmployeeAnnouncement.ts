import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AcknowledgementSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EmployeeAnnouncementSchema = new Schema(
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
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
      default: null,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgements: [AcknowledgementSchema],
  },
  {
    timestamps: true,
  }
);

EmployeeAnnouncementSchema.index({ companyId: 1, isPinned: -1, createdAt: -1 });

export const EmployeeAnnouncement = ((mongoose.models.EmployeeAnnouncement as Model<any>) ||
  mongoose.model('EmployeeAnnouncement', EmployeeAnnouncementSchema)) as Model<any>;
