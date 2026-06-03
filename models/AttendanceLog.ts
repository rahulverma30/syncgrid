import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const BreakSchema = new Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // in minutes
  },
  { _id: false }
);

const AttendanceLogSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: false,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    punchIn: {
      type: Date,
      required: true,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    totalWorkedMinutes: {
      type: Number,
      default: 0,
    },
    breakMinutes: {
      type: Number,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Weekend', 'Holiday'],
      default: 'Present',
      index: true,
    },
    breaks: [BreakSchema],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// High-speed index to speed up daily punch queries per user
AttendanceLogSchema.index({ companyId: 1, userId: 1, date: 1 }, { unique: true });

export const AttendanceLog = ((mongoose.models.AttendanceLog as Model<any>) ||
  mongoose.model('AttendanceLog', AttendanceLogSchema)) as Model<any>;
