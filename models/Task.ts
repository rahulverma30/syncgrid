import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';
import { Project } from './Project';

const ChecklistItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    parentId: { type: Schema.Types.ObjectId }, // Support sub-checklist nesting
    order: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

const AttachmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    type: { type: String }, // MIME type
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true, timestamps: true }
);

const DependencySchema = new Schema(
  {
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'relates_to'],
      required: true,
      default: 'blocked_by',
    },
    targetTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
  },
  { _id: true, timestamps: true }
);

const TaskSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sprintId: {
      type: Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    milestoneId: {
      type: Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    watchers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskStatus',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    storyPoints: {
      type: Number,
      default: 0,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
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
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      index: true,
    },
    recurrenceRules: {
      frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
      interval: { type: Number, default: 1 },
      nextRunDate: { type: Date },
      active: { type: Boolean, default: false },
    },
    requiresClientApproval: {
      type: Boolean,
      default: false,
    },
    clientApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    automationMetadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    // Subdocument arrays
    checklistItems: [ChecklistItemSchema],
    attachments: [AttachmentSchema],
    dependencies: [DependencySchema],
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for workspace filtering, search and agile boards
TaskSchema.index({ companyId: 1, isArchived: 1, isSoftDeleted: 1 });
TaskSchema.index({ companyId: 1, projectId: 1, statusId: 1 });
TaskSchema.index({ companyId: 1, sprintId: 1, statusId: 1 });
TaskSchema.index({ companyId: 1, code: 1 }, { unique: true });
TaskSchema.index({ parentId: 1 });

// Pre-save trigger for sequential keying and dynamic health calculations
TaskSchema.pre('save', async function (this: any, next?: any) {
  // 1. Auto-generate sequential JIRA-style task code (e.g., SYNC-4)
  if (!this.code) {
    try {
      const project = await Project.findById(this.projectId).select('code name');
      if (project) {
        const prefix = project.code || project.name.substring(0, 3).toUpperCase();
        // Count how many tasks exist in this project to get the sequence number
        const count = await mongoose.model('Task').countDocuments({
          projectId: this.projectId,
        });
        this.code = `${prefix}-${count + 1}`;
      } else {
        const prefix = 'TASK';
        const count = await mongoose.model('Task').countDocuments({
          companyId: this.companyId,
        });
        this.code = `${prefix}-${count + 1}`;
      }
    } catch (err) {
      console.error('Failed to auto-generate task code:', err);
    }
  }

  // 2. Dynamic Health Engine calculations
  let calculatedScore = 100;
  const now = new Date();

  // Overdue check
  if (this.dueDate && new Date(this.dueDate) < now) {
    // If not completed yet
    if (!this.completedDate) {
      const diffTime = Math.abs(now.getTime() - new Date(this.dueDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedScore -= Math.min(40, diffDays * 5); // Subtract 5 points per overdue day, max 40 points
    }
  }

  // Active blockers check
  const blockersCount = (this.dependencies || []).filter(
    (dep: any) => dep.type === 'blocked_by'
  ).length;
  calculatedScore -= Math.min(30, blockersCount * 10); // Subtract 10 points per blocker, max 30 points

  // Time logging overrun check
  if (this.estimatedHours > 0 && this.actualHours > this.estimatedHours) {
    const ratio = (this.actualHours - this.estimatedHours) / this.estimatedHours;
    calculatedScore -= Math.min(30, Math.round(ratio * 20)); // Subtract up to 30 points for overrun
  }

  this.healthScore = Math.max(0, Math.min(100, calculatedScore));

  if (typeof next === 'function') {
    next();
  }
});

// Recursive Subtask Rollup Hook
TaskSchema.post('save', async function (doc: any) {
  const TaskModel = mongoose.model('Task');

  if (doc.parentId) {
    try {
      const parent = await TaskModel.findById(doc.parentId);
      if (parent) {
        // Retrieve sibling nodes in active states
        const children = await TaskModel.find({ parentId: doc.parentId, isSoftDeleted: false });
        let aggregatedPoints = 0;
        let aggregatedEstHours = 0;
        let aggregatedActHours = 0;

        children.forEach((child: any) => {
          aggregatedPoints += child.storyPoints || 0;
          aggregatedEstHours += child.estimatedHours || 0;
          aggregatedActHours += child.actualHours || 0;
        });

        // Reconcile aggregated metrics onto parent node
        parent.storyPoints = aggregatedPoints;
        parent.estimatedHours = aggregatedEstHours;
        parent.actualHours = aggregatedActHours;

        // Recursive save triggers parent's post-save hook up the hierarchy tree
        await parent.save();
      }
    } catch (err) {
      console.error('Failed to run subtask rollup aggregation hook:', err);
    }
  }

  // Project Progress Rollup Hook
  if (doc.projectId) {
    try {
      const ProjectModel = mongoose.model('Project');
      const allTasks = await TaskModel.find({
        projectId: doc.projectId,
        isSoftDeleted: false,
      }).populate('statusId');

      let completedTasks = 0;
      allTasks.forEach((t: any) => {
        if (t.statusId?.category === 'done') {
          completedTasks++;
        }
      });

      const totalTasks = allTasks.length;
      const progressPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await ProjectModel.findByIdAndUpdate(doc.projectId, { progressPercentage });
    } catch (err) {
      console.error('Failed to run project progress rollup hook:', err);
    }
  }
});

export const Task = ((mongoose.models.Task as Model<any>) ||
  mongoose.model('Task', TaskSchema)) as Model<any>;
