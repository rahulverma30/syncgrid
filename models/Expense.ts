import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalHistoryItem {
  approverId: string;
  action: 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
}

export interface IExpense extends Document {
  companyId: mongoose.Types.ObjectId;
  expenseNumber: string;
  category:
    | 'travel'
    | 'meals'
    | 'software'
    | 'hardware'
    | 'marketing'
    | 'office_supplies'
    | 'utilities'
    | 'rent'
    | 'salary'
    | 'consulting'
    | 'other';
  merchant: string;
  employeeId?: mongoose.Types.ObjectId; // Empty for corporate expense, populated for employee claims
  projectId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  taxAmount: number;
  expenseDate: Date;
  receiptUrl?: string;
  receiptName?: string;
  receiptSize?: number;
  reimbursementStatus: 'none' | 'pending' | 'approved' | 'reimbursed' | 'rejected';
  approvalWorkflow: {
    currentStep: 'manager' | 'finance' | 'done';
    status: 'pending' | 'approved' | 'rejected';
    approverId?: string;
    comments?: string;
    history: IApprovalHistoryItem[];
  };
  paymentStatus: 'unpaid' | 'paid';
  paymentDate?: Date;
  notes?: string;
  isRecurring: boolean;
  isSoftDeleted: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalHistorySchema = new Schema<IApprovalHistoryItem>({
  approverId: { type: String, required: true },
  action: { type: String, enum: ['approved', 'rejected'], required: true },
  comments: { type: String },
  timestamp: { type: Date, required: true, default: Date.now },
});

const ExpenseSchema = new Schema<IExpense>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    expenseNumber: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'travel',
        'meals',
        'software',
        'hardware',
        'marketing',
        'office_supplies',
        'utilities',
        'rent',
        'salary',
        'consulting',
        'other',
      ],
      required: true,
      index: true,
    },
    merchant: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'USD' },
    taxAmount: { type: Number, required: true, default: 0 },
    expenseDate: { type: Date, required: true, default: Date.now },
    receiptUrl: { type: String },
    receiptName: { type: String },
    receiptSize: { type: Number },
    reimbursementStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'reimbursed', 'rejected'],
      required: true,
      default: 'none',
      index: true,
    },
    approvalWorkflow: {
      currentStep: {
        type: String,
        enum: ['manager', 'finance', 'done'],
        required: true,
        default: 'done',
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        required: true,
        default: 'approved',
      },
      approverId: { type: String },
      comments: { type: String },
      history: [ApprovalHistorySchema],
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      required: true,
      default: 'unpaid',
      index: true,
    },
    paymentDate: { type: Date },
    notes: { type: String },
    isRecurring: { type: Boolean, required: true, default: false },
    isSoftDeleted: { type: Boolean, required: true, default: false, index: true },
    createdById: { type: String, required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ companyId: 1, expenseNumber: 1 }, { unique: true });
ExpenseSchema.index({ companyId: 1, isSoftDeleted: 1, reimbursementStatus: 1, paymentStatus: 1 });

export const Expense =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
