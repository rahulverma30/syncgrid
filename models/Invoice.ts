import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number; // e.g. 18 for 18%
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface IInvoice extends Document {
  companyId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  clientId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  exchangeRate: number;
  lineItems: IInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void';
  recurringMetadata: {
    isRecurring: boolean;
    frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextRunDate?: Date;
    endRunDate?: Date;
  };
  approvalMetadata: {
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
    approverId?: string;
    comments?: string;
  };
  attachments: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  notes?: string;
  terms?: string;
  isArchived: boolean;
  isSoftDeleted: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  discountAmount: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    currency: { type: String, required: true, default: 'USD' },
    exchangeRate: { type: Number, required: true, default: 1.0 },
    lineItems: [InvoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    outstandingAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'],
      required: true,
      default: 'draft',
      index: true,
    },
    recurringMetadata: {
      isRecurring: { type: Boolean, required: true, default: false },
      frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
      nextRunDate: { type: Date },
      endRunDate: { type: Date },
    },
    approvalMetadata: {
      required: { type: Boolean, required: true, default: false },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        required: true,
        default: 'approved',
      },
      approverId: { type: String },
      comments: { type: String },
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        size: { type: Number },
      },
    ],
    notes: { type: String },
    terms: { type: String },
    isArchived: { type: Boolean, required: true, default: false, index: true },
    isSoftDeleted: { type: Boolean, required: true, default: false, index: true },
    createdById: { type: String, required: true },
  },
  { timestamps: true }
);

// Ensure invoice numbers are unique per tenant space
InvoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
// Facilitate search performance optimizations
InvoiceSchema.index({ companyId: 1, isSoftDeleted: 1, isArchived: 1, status: 1 });

export const Invoice =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
