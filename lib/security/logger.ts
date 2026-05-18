import { ClientPortalAuditLog } from '@/models/ClientPortalAuditLog';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface SecurityEventParams {
  companyId: string;
  clientId: string;
  portalUserId: string;
  portalUserName: string;
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  actionDetails: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enterprise Observability & Security Logger
 * Logs portal-specific activities securely in ClientPortalAuditLog.
 */
export async function logSecurityEvent(params: SecurityEventParams) {
  try {
    await connectToDatabase();
    await ClientPortalAuditLog.create({
      companyId: params.companyId,
      clientId: params.clientId,
      portalUserId: params.portalUserId,
      portalUserName: params.portalUserName,
      eventType: params.eventType,
      severity: params.severity,
      actionDetails: params.actionDetails,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Unknown',
    });
  } catch (error) {
    console.error('Failed to write security audit log:', error);
  }
}
