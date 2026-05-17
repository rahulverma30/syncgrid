import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: { type: Number, min: 1, max: 5, default: 3 }, // 1 (Beginner) to 5 (Expert)
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, default: '' },
    date: { type: Date, default: null },
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const EmployeeAssetSchema = new Schema(
  {
    name: { type: String, required: true },
    serialNumber: { type: String, default: '' },
    assignedDate: { type: Date, default: Date.now },
    returnedDate: { type: Date, default: null },
    status: { type: String, enum: ['assigned', 'returned'], default: 'assigned' },
  },
  { _id: true }
);

const EmployeeDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const EmployeeSchema = new Schema(
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
      index: true,
      default: null,
    },
    employeeId: {
      type: String,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
      default: null,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
      default: null,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    designation: {
      type: String,
      default: '',
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contractor', 'intern'],
      default: 'full-time',
      index: true,
    },
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exitDate: {
      type: Date,
      default: null,
    },
    workMode: {
      type: String,
      enum: ['remote', 'hybrid', 'office'],
      default: 'remote',
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'onboarding', 'offboarded', 'terminated'],
      default: 'onboarding',
      index: true,
    },
    // Sub-lists
    skills: [SkillSchema],
    certifications: [CertificationSchema],
    emergencyContacts: [EmergencyContactSchema],
    assets: [EmployeeAssetSchema],
    documents: [EmployeeDocumentSchema],
    // Metadata aggregates
    compensationMetadata: {
      salary: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      payPeriod: { type: String, default: 'monthly' },
    },
    performanceMetadata: {
      lastReviewScore: { type: Number, default: null },
      activeGoalsCount: { type: Number, default: 0 },
    },
    attendanceSummary: {
      presentCount: { type: Number, default: 0 },
      lateCount: { type: Number, default: 0 },
      hoursTracked: { type: Number, default: 0 },
    },
    leaveBalances: {
      casualDays: { type: Number, default: 12 },
      sickDays: { type: Number, default: 10 },
      paidDays: { type: Number, default: 15 },
    },
    presenceStatus: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    payrollMetadata: {
      bankRouting: { type: String, default: '' },
      bankAccount: { type: String, default: '' },
      taxFormW4Signed: { type: Boolean, default: false },
      taxFormW9Signed: { type: Boolean, default: false },
      govIdVerified: { type: Boolean, default: false },
    },
    checklistTemplate: {
      type: String,
      default: 'standard',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
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

// High-speed compound indexes for multi-tenant query optimizations
EmployeeSchema.index({ companyId: 1, isArchived: 1, isSoftDeleted: 1 });
EmployeeSchema.index({ companyId: 1, departmentId: 1, status: 1 });

// Pre-save auto-increment sequential employeeId EMP-1, EMP-2...
EmployeeSchema.pre('save', async function (this: any, next: any) {
  if (!this.employeeId) {
    try {
      const count = await mongoose.model('Employee').countDocuments({
        companyId: this.companyId,
      });
      this.employeeId = `EMP-${count + 1}`;
    } catch (err) {
      console.error('Failed to generate employeeId:', err);
    }
  }
  if (!this.displayName) {
    this.displayName = this.fullName;
  }
  next();
});

export const Employee = ((mongoose.models.Employee as Model<any>) ||
  mongoose.model('Employee', EmployeeSchema)) as Model<any>;
