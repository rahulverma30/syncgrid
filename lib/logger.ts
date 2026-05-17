import { AuditLog, Activity } from '@/models';
import { connectToDatabase } from '@/lib/db';
import { headers } from 'next/headers';

interface AuditLogOptions {
  companyId?: string | any;
  actorId?: string | any;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'failure';
}

interface ActivityOptions {
  companyId: string | any;
  userId: string | any;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit compliance event to the database
 */
export async function logAuditEvent(options: AuditLogOptions) {
  try {
    await connectToDatabase();

    let ipAddress = '';
    let userAgent = '';

    // Retrieve headers dynamically if within request context (Next.js Edge/Server environment)
    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
      userAgent = headersList.get('user-agent') || '';
    } catch {
      // Gracefully swallow error if called outside of active request runtime context
    }

    const log = await AuditLog.create({
      companyId: options.companyId || null,
      actorId: options.actorId || null,
      action: options.action,
      resource: options.resource,
      resourceId: options.resourceId || null,
      ipAddress,
      userAgent,
      metadata: options.metadata || {},
      status: options.status || 'success',
    });

    return log;
  } catch (error) {
    console.error('❌ Failed to create audit log entry:', error);
  }
}

/**
 * Log an operational user activity to the database
 */
export async function logActivity(options: ActivityOptions) {
  try {
    await connectToDatabase();

    const activity = await Activity.create({
      companyId: options.companyId,
      userId: options.userId,
      type: options.type,
      title: options.title,
      description: options.description || '',
      metadata: options.metadata || {},
    });

    return activity;
  } catch (error) {
    console.error('❌ Failed to log user activity:', error);
  }
}
