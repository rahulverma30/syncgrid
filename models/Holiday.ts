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
  },
  {
    timestamps: true,
  }
);

HolidaySchema.index({ companyId: 1, date: 1 });

export const Holiday = ((mongoose.models.Holiday as Model<any>) ||
  mongoose.model('Holiday', HolidaySchema)) as Model<any>;
