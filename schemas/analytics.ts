import { z } from 'zod';

export const ReportCreateInputSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  type: z.enum(['financial', 'project', 'workforce', 'productivity']),
  visibilityScope: z.enum(['private', 'shared', 'organization']).default('private'),
  filters: z.record(z.any()).default({}),
  metrics: z.array(z.string()).min(1, 'At least one metric must be selected'),
  groupBy: z.string().optional(),
  aggregateType: z.enum(['sum', 'avg', 'count', 'max', 'min']).default('sum'),
  chartConfig: z.object({
    chartType: z.enum(['line', 'bar', 'area', 'pie', 'donut', 'stacked', 'metric']),
    dimensions: z.array(z.string()).optional(),
    legendPosition: z.enum(['top', 'bottom', 'left', 'right']).default('bottom'),
  }),
  dashboardWidgetPlacement: z
    .object({
      isWidget: z.boolean().default(false),
      widthKey: z.enum(['full', 'half', 'third']).default('half'),
    })
    .optional(),
});

export const KPIConfigUpdateSchema = z.object({
  targetValue: z.number().nonnegative('Target value cannot be negative'),
  warningThreshold: z.number().min(0).max(100, 'Threshold must be between 0% and 100%'),
  criticalThreshold: z.number().min(0).max(100, 'Threshold must be between 0% and 100%'),
  scoringWeight: z.number().positive('Scoring weight must be positive'),
});

export const WidgetPositionInputSchema = z.object({
  widgetId: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  isCollapsed: z.boolean().optional(),
});

export const DashboardLayoutUpdateSchema = z.object({
  name: z.string().min(1, 'Layout name is required').optional(),
  isDefault: z.boolean().optional(),
  widgets: z.array(WidgetPositionInputSchema),
});

export const ForecastRequestSchema = z.object({
  metricName: z.enum(['revenue', 'workload', 'budget']),
  timelineMonths: z.number().int().min(1).max(12).default(6),
  confidenceInterval: z.number().min(50).max(99).default(95),
});
