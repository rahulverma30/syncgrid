import { NextResponse } from 'next/server';
import { withApiRole } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ensureSystemRoles } from '@/lib/auth/seed';
import {
  Company,
  Employee,
  Invoice,
  Client,
  Project,
  AttendanceLog,
  LeaveRequest,
  WorkflowExecution,
  AnalyticsSnapshot,
  ExternalActivityLog,
  TaskTimeLog,
  Transaction,
  Expense,
  Budget,
  Vendor,
  PurchaseOrder,
  Lead,
  WikiSpace,
  Document,
  Message,
  Conversation,
  Channel,
  Workspace,
  PresenceSession,
  MessageRead,
  Announcement,
  ReadingProgress,
  SavedReport,
  DashboardLayout,
  KPIConfiguration,
  AuditLog,
  Invitation,
  User,
  Role,
  AuthorizationPolicy,
  SaaSOrganizationSubscription,
  SaaSUsageMetric,
  SaaSBackup,
} from '@/models';

export const POST = withApiRole(
  ['super-admin'],
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const adminUserId = session.user.id;

      console.log(
        `[GOVERNANCE] Super-Admin ${adminUserId} initiated complete sandboxed database purge.`
      );

      // 1. Safe cleaning of core transactional/lead/employee databases
      await Transaction.deleteMany({});
      await Invoice.deleteMany({});
      await Expense.deleteMany({}); // Wait, is Expense imported? Let's check imports. Yes, we should import Expense.
      await Budget.deleteMany({});
      await Vendor.deleteMany({});
      await PurchaseOrder.deleteMany({});
      await Lead.deleteMany({});
      await Client.deleteMany({});
      await Project.deleteMany({});
      await Employee.deleteMany({});
      await AttendanceLog.deleteMany({});
      await LeaveRequest.deleteMany({});
      await TaskTimeLog.deleteMany({});
      await AnalyticsSnapshot.deleteMany({});
      await ExternalActivityLog.deleteMany({});
      await WorkflowExecution.deleteMany({});
      await WikiSpace.deleteMany({});
      await Document.deleteMany({});
      await Message.deleteMany({});
      await Conversation.deleteMany({});
      await Channel.deleteMany({});
      await Workspace.deleteMany({});
      await PresenceSession.deleteMany({});
      await MessageRead.deleteMany({});
      await Announcement.deleteMany({});
      await ReadingProgress.deleteMany({});
      await SavedReport.deleteMany({});
      await DashboardLayout.deleteMany({});
      await KPIConfiguration.deleteMany({});
      await AuditLog.deleteMany({});
      await Invitation.deleteMany({});

      // SaaS multi-tenant metadata
      await SaaSOrganizationSubscription.deleteMany({});
      await SaaSUsageMetric.deleteMany({});
      await SaaSBackup.deleteMany({});
      await Company.deleteMany({});

      // 2. Safe cleaning of user identities: keep the executing admin user intact
      await User.deleteMany({ _id: { $ne: adminUserId } });

      // 3. Clear out tenant-specific roles and ABAC authorization policies
      await Role.deleteMany({ companyId: { $ne: null } });
      await AuthorizationPolicy.deleteMany({ companyId: { $ne: null } });

      // 4. Re-establish bootstrap foundation roles, permissions and policies
      await ensureSystemRoles();

      console.log(`[GOVERNANCE] Purge executed cleanly. Default system roles re-seeded.`);

      return NextResponse.json({
        success: true,
        message:
          'Database has been purged cleanly to production baseline. Foundational RBAC controls successfully seeded.',
      });
    } catch (error: any) {
      console.error('[GOVERNANCE] Database purge encountered error:', error);
      return NextResponse.json(
        { success: false, error: 'PURGE_FAILED', message: error.message },
        { status: 500 }
      );
    }
  }
);
