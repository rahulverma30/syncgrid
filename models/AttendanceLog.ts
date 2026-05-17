import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AttendanceLogSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workMode: {
      type: String,
      enum: ['remote', 'hybrid', 'office'],
      default: 'remote',
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day'],
      default: 'present',
      index: true,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// High-speed index to speed up daily punch queries
AttendanceLogSchema.index({ companyId: 1, employeeId: 1, date: 1 });

export const AttendanceLog = ((mongoose.models.AttendanceLog as Model<any>) ||
  mongoose.model('AttendanceLog', AttendanceLogSchema)) as Model<any>;
