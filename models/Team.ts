import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const TeamSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    isSoftDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ companyId: 1, departmentId: 1, isSoftDeleted: 1 });

export const Team = ((mongoose.models.Team as Model<any>) ||
  mongoose.model('Team', TeamSchema)) as Model<any>;
