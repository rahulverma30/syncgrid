import mongoose from 'mongoose';
import { getTenantContext } from '@/lib/saas/tenantStore';

export function tenantPlugin(schema: mongoose.Schema) {
  // If the schema does not have a companyId field, do not apply isolation
  if (!schema.paths.companyId) {
    return;
  }

  const queryHooks = [
    'find',
    'findOne',
    'count',
    'countDocuments',
    'estimatedDocumentCount',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
  ];

  function applyTenantScoping(this: any) {
    const context = getTenantContext();
    if (context && !context.bypass && context.companyId) {
      const currentQuery = this.getQuery();

      // If the query already specifies a companyId, do not overwrite it
      if (currentQuery.companyId === undefined) {
        this.where({ companyId: new mongoose.Types.ObjectId(context.companyId) });
      }
    }
  }

  queryHooks.forEach((hook) => {
    schema.pre(hook as any, applyTenantScoping);
  });

  // Intercept and auto-scope aggregation pipelines
  schema.pre('aggregate', function (this: mongoose.Aggregate<any>) {
    const context = getTenantContext();
    if (context && !context.bypass && context.companyId) {
      const pipeline = this.pipeline();

      // Check if there is already a matching $match stage on companyId in the pipeline
      const hasCompanyMatch = pipeline.some(
        (stage: any) => stage.$match && stage.$match.companyId !== undefined
      );

      if (!hasCompanyMatch) {
        pipeline.unshift({
          $match: { companyId: new mongoose.Types.ObjectId(context.companyId) },
        });
      }
    }
  });
}

// Scoped query helpers for explicit manual scoping or bypassing
export async function runBypassingTenant<T>(callback: () => Promise<T>): Promise<T> {
  const { runInBypassTenantContext } = require('@/lib/saas/tenantStore');
  return runInBypassTenantContext(callback);
}
