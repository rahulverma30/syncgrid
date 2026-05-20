import mongoose from 'mongoose';
import { getTenantContext } from '@/lib/saas/tenantStore';

function hasCompanyIdInQuery(query: any): boolean {
  if (!query) return false;
  if (query.companyId !== undefined) return true;
  if (Array.isArray(query.$or)) {
    return query.$or.some((subQuery: any) => hasCompanyIdInQuery(subQuery));
  }
  if (Array.isArray(query.$and)) {
    return query.$and.some((subQuery: any) => hasCompanyIdInQuery(subQuery));
  }
  return false;
}

function hasCompanyIdInStage(stage: any): boolean {
  if (!stage) return false;
  if (stage.$match) {
    return hasCompanyIdInQuery(stage.$match);
  }
  return false;
}

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

  function applyTenantScoping(this: any, next?: any) {
    const context = getTenantContext();
    if (context && !context.bypass && context.companyId) {
      const currentQuery = this.getQuery();

      // If the query already specifies a companyId explicitly anywhere, do not overwrite it
      if (!hasCompanyIdInQuery(currentQuery)) {
        const isRequired =
          schema.paths.companyId.options && schema.paths.companyId.options.required;
        const tenantCompanyId = new mongoose.Types.ObjectId(context.companyId);

        if (isRequired) {
          this.where({ companyId: tenantCompanyId });
        } else {
          // If companyId is not required, allow system-wide documents (companyId: null) as well
          this.where({
            $or: [{ companyId: tenantCompanyId }, { companyId: null }],
          });
        }
      }
    }
    if (typeof next === 'function') {
      next();
    }
  }

  queryHooks.forEach((hook) => {
    schema.pre(hook as any, applyTenantScoping);
  });

  // Intercept and auto-scope aggregation pipelines
  schema.pre('aggregate', function (this: mongoose.Aggregate<any>, next?: any) {
    const context = getTenantContext();
    if (context && !context.bypass && context.companyId) {
      const pipeline = this.pipeline();

      const hasCompanyMatch = pipeline.some(hasCompanyIdInStage);

      if (!hasCompanyMatch) {
        const isRequired =
          schema.paths.companyId.options && schema.paths.companyId.options.required;
        const tenantCompanyId = new mongoose.Types.ObjectId(context.companyId);

        if (isRequired) {
          pipeline.unshift({
            $match: { companyId: tenantCompanyId },
          });
        } else {
          pipeline.unshift({
            $match: {
              $or: [{ companyId: tenantCompanyId }, { companyId: null }],
            },
          });
        }
      }
    }
    if (typeof next === 'function') {
      next();
    }
  });
}

// Scoped query helpers for explicit manual scoping or bypassing
export async function runBypassingTenant<T>(callback: () => Promise<T>): Promise<T> {
  const { runInBypassTenantContext } = require('@/lib/saas/tenantStore');
  return runInBypassTenantContext(callback);
}
