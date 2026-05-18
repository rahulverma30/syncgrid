import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientProjectAccessSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    isAccessAllowed: {
      type: Boolean,
      default: true,
    },
    showMilestones: {
      type: Boolean,
      default: true,
    },
    showTasks: {
      type: Boolean,
      default: false,
    },
    showBudgets: {
      type: Boolean,
      default: false,
    },
    showTimeLogs: {
      type: Boolean,
      default: false,
    },
    customRules: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

ClientProjectAccessSchema.index({ clientId: 1, projectId: 1 }, { unique: true });

export const ClientProjectAccess = ((mongoose.models.ClientProjectAccess as Model<any>) ||
  mongoose.model('ClientProjectAccess', ClientProjectAccessSchema)) as Model<any>;
