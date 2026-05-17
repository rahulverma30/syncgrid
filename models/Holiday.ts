import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const HolidaySchema = new Schema(
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
    date: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    scope: {
      type: String,
      enum: ['company-wide', 'regional', 'department-specific'],
      default: 'company-wide',
    },
    region: {
      type: String,
      default: '',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    type: {
      type: String,
      enum: ['public', 'optional'],
      default: 'public',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

HolidaySchema.index({ companyId: 1, date: 1 });

export const Holiday = ((mongoose.models.Holiday as Model<any>) ||
  mongoose.model('Holiday', HolidaySchema)) as Model<any>;
