import mongoose, { Schema, Document } from 'mongoose';

export interface IPOItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IPurchaseOrder extends Document {
  companyId: mongoose.Types.ObjectId;
  poNumber: string;
  vendorId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  lineItems: IPOItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled';
  approvalWorkflow: {
    status: 'pending' | 'approved' | 'rejected';
    approverId?: string;
    comments?: string;
  };
  notes?: string;
  isSoftDeleted: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    poNumber: { type: String, required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    orderDate: { type: Date, required: true, default: Date.now },
    expectedDeliveryDate: { type: Date },
    lineItems: [POItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'received', 'cancelled'],
      required: true,
      default: 'draft',
      index: true,
    },
    approvalWorkflow: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        required: true,
        default: 'approved',
      },
      approverId: { type: String },
      comments: { type: String },
    },
    notes: { type: String },
    isSoftDeleted: { type: Boolean, required: true, default: false, index: true },
    createdById: { type: String, required: true },
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ companyId: 1, poNumber: 1 }, { unique: true });

export const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
