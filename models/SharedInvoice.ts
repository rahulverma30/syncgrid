import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const SharedInvoiceSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      unique: true,
      index: true,
    },
    isShared: {
      type: Boolean,
      default: true,
      index: true,
    },
    paymentUrl: {
      type: String,
      default: '',
    },
    customNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SharedInvoice = ((mongoose.models.SharedInvoice as Model<any>) ||
  mongoose.model('SharedInvoice', SharedInvoiceSchema)) as Model<any>;
