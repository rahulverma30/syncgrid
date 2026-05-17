import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

const ProjectMilestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date },
    completedDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'overdue'],
      default: 'pending',
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    dependsOn: [{ type: Schema.Types.ObjectId }], // milestone dependency references
    parentMilestoneId: { type: Schema.Types.ObjectId },
  },
  { _id: true, timestamps: true }
);

const ProjectSprintSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    goal: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'cancelled'],
      default: 'planning',
    },
    velocity: { type: Number, default: 0 },
    retrospective: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const ProjectTeamMemberSchema = new Schema(
  {
    userName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['project-manager', 'team-lead', 'developer', 'qa', 'designer', 'devops', 'other'],
      default: 'developer',
    },
    allocation: { type: Number, default: 100, min: 0, max: 100 }, // percentage
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProjectRiskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'mitigated', 'resolved', 'escalated'],
      default: 'open',
    },
    category: {
      type: String,
      enum: ['technical', 'staffing', 'financial', 'timeline', 'dependency', 'operational'],
      default: 'technical',
    },
    probability: { type: Number, default: 3, min: 1, max: 5 },
    impact: { type: Number, default: 3, min: 1, max: 5 },
    mitigation: { type: String, trim: true },
    reportedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProjectDocumentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['requirements', 'design', 'technical', 'meeting-notes', 'contract', 'other'],
      default: 'other',
    },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    uploadedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProjectCommLogSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['standup', 'review', 'retrospective', 'client-call', 'internal', 'other'],
      default: 'internal',
    },
    summary: { type: String, trim: true },
    loggedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProjectTimelineSchema = new Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, trim: true },
    userName: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ─── Main Project Schema ───────────────────────────────────────────────────────

const ProjectSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
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
    description: { type: String, trim: true },

    // References
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },

    // Status & Priority
    status: {
      type: String,
      enum: [
        'planning',
        'design',
        'development',
        'testing',
        'deployment',
        'completed',
        'on-hold',
        'cancelled',
      ],
      default: 'planning',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },

    // People
    projectManager: {
      type: String,
      trim: true,
      index: true,
    },

    // Financial
    budget: { type: Number, default: 0 },
    billingType: {
      type: String,
      enum: ['fixed', 'hourly', 'retainer', 'milestone-based'],
      default: 'fixed',
    },
    billingRate: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },

    // Dates
    startDate: { type: Date },
    deadline: { type: Date },
    deliveryDate: { type: Date },

    // Technical
    technologies: [{ type: String, trim: true }],
    repositoryLinks: [{ type: String, trim: true }],
    stagingUrl: { type: String, trim: true },
    liveUrl: { type: String, trim: true },

    // Health & Progress
    healthScore: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Meta
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Subdocument arrays
    teamMembers: [ProjectTeamMemberSchema],
    milestones: [ProjectMilestoneSchema],
    sprints: [ProjectSprintSchema],
    risks: [ProjectRiskSchema],
    documents: [ProjectDocumentSchema],
    communicationLogs: [ProjectCommLogSchema],
    timeline: [ProjectTimelineSchema],
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes ──────────────────────────────────────────────────────────
ProjectSchema.index({ companyId: 1, isArchived: 1 });
ProjectSchema.index({ companyId: 1, status: 1 });
ProjectSchema.index({ companyId: 1, projectManager: 1 });
ProjectSchema.index({ companyId: 1, priority: 1 });
ProjectSchema.index({ companyId: 1, riskLevel: 1 });
ProjectSchema.index({ companyId: 1, clientId: 1 });

// ─── Auto-generate project code and calculate health score pre-save ───────────
ProjectSchema.pre('save', function (this: any, next: any) {
  if (!this.code) {
    const prefix = (this.name as string)
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    this.code = `${prefix}-${suffix}`;
  }

  // ─── Dynamic Health & Risk Engine ───────────────────────────────────────────
  let calculatedScore = 100;

  // 1. Missed/Overdue Milestones
  const now = new Date();
  const overdueMilestones = (this.milestones || []).filter(
    (m: any) => m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < now
  ).length;
  calculatedScore -= overdueMilestones * 12;

  // 2. Unresolved Risks (Weight based on severity & probability*impact)
  const openRisks = this.risks || [];
  openRisks.forEach((r: any) => {
    if (r.status === 'open' || r.status === 'escalated') {
      const riskFactor = (r.probability || 3) * (r.impact || 3); // 1-25 range
      if (r.severity === 'critical' || riskFactor >= 16) calculatedScore -= 20;
      else if (r.severity === 'high' || riskFactor >= 9) calculatedScore -= 12;
      else if (r.severity === 'medium' || riskFactor >= 4) calculatedScore -= 7;
      else calculatedScore -= 3;
    }
  });

  // 3. Hours Overrun Variance
  if (this.actualHours > this.estimatedHours && this.estimatedHours > 0) {
    const overrunRatio = (this.actualHours - this.estimatedHours) / this.estimatedHours;
    calculatedScore -= Math.min(20, Math.round(overrunRatio * 15));
  }

  // 4. Over-allocated Team Resources Penalty
  const overAllocatedMembersCount = (this.teamMembers || []).filter(
    (tm: any) => tm.allocation > 100
  ).length;
  calculatedScore -= overAllocatedMembersCount * 5;

  // Bounds limit
  this.healthScore = Math.max(10, Math.min(100, calculatedScore));

  // Determine riskLevel based on health score and unresolved risks
  const maxRiskSeverity = openRisks.reduce((max: string, r: any) => {
    if (r.status === 'open' || r.status === 'escalated') {
      const ranks: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
      const currentSeverity = r.severity || 'low';
      if (ranks[currentSeverity] > ranks[max]) return currentSeverity;
    }
    return max;
  }, 'low');

  if (this.healthScore < 50 || maxRiskSeverity === 'critical') {
    this.riskLevel = 'critical';
  } else if (this.healthScore < 70 || maxRiskSeverity === 'high') {
    this.riskLevel = 'high';
  } else if (this.healthScore < 85 || maxRiskSeverity === 'medium') {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'low';
  }

  next();
});

export const Project = ((mongoose.models.Project as Model<any>) ||
  mongoose.model('Project', ProjectSchema)) as Model<any>;
