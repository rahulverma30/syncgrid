import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AuditLog } from '@/models';

export const GET = withApiPermission(
  'audit',
  'read',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;

      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const actorId = url.searchParams.get('actorId');
      const action = url.searchParams.get('action');
      const resource = url.searchParams.get('resource');
      const status = url.searchParams.get('status');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      const query: Record<string, any> = { companyId };

      if (actorId) query.actorId = actorId;
      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .populate('actorId', 'name email image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return NextResponse.json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      return apiErrorResponse(error);
    }
  }
);
