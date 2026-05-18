import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventSubscription extends Document {
  companyId: mongoose.Types.ObjectId;
  eventName: string; // e.g. 'task_completed', 'invoice_paid'
  workflowId: mongoose.Types.ObjectId;
  active: boolean;
}

const EventSubscriptionSchema = new Schema<IEventSubscription>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    eventName: { type: String, required: true, index: true },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
      index: true,
    },
    active: { type: Boolean, default: true, required: true, index: true },
  },
  { timestamps: true }
);

EventSubscriptionSchema.index({ companyId: 1, eventName: 1, active: 1 });

export const EventSubscription =
  (mongoose.models.EventSubscription as Model<IEventSubscription>) ||
  mongoose.model<IEventSubscription>('EventSubscription', EventSubscriptionSchema);
