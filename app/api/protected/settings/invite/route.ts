import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Invitation, Employee, User, Role, Company, AuditLog } from '@/models';
import { sendInvitationEmail } from '@/lib/email';
import { hasRole } from '@/lib/auth/permission-checks';
import { runBypassingTenant } from '@/lib/db/tenantPlugin';

// 1. GET: List all invitations for the company
export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const invitations = await Invitation.find({ companyId })
      .populate({ path: 'role', select: 'name' })
      .populate({ path: 'department', select: 'name' })
      .populate({ path: 'invitedBy', select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: invitations });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

// 2. POST: Create an invitation
export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const actorId = session.user.id;
    const actorName = session.user.name;
    const roles = session.user.roles || [];

    // RBAC: Only Admins or Super Admins can invite team members
    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to invite members',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, roleId, departmentId, workspaceId, permissions } = body;

    if (!email || !roleId) {
      return NextResponse.json(
        { success: false, message: 'Email and Role are required fields' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // A. Check if the user already exists in the system globally (bypassing tenant plugin)
    const existingUser = await runBypassingTenant(() => User.findOne({ email: cleanEmail }));
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'A user with this email address already exists in the system.',
        },
        { status: 409 }
      );
    }

    // B. Check if active employee exists
    const existingEmployee = await Employee.findOne({
      companyId,
      email: cleanEmail,
      isSoftDeleted: false,
    });
    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMPLOYEE_EXISTS',
          message: 'An active employee with this email already exists in your company.',
        },
        { status: 409 }
      );
    }

    // C. Check if pending invite already exists
    const existingInvite = await Invitation.findOne({
      companyId,
      email: cleanEmail,
      status: 'pending',
    });
    if (existingInvite) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVITE_PENDING',
          message: 'A pending invitation already exists for this email.',
        },
        { status: 409 }
      );
    }

    // D. Fetch company name for email template
    const company = await Company.findById(companyId);
    const companyName = company ? company.name : 'SyncGrid Workspace';

    // E. Generate crypto-secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // F. Create Invitation
    const invitation = new Invitation({
      companyId,
      workspaceId: workspaceId || null,
      email: cleanEmail,
      role: roleId,
      department: departmentId || null,
      invitedBy: actorId,
      token,
      expiresAt,
      permissions: permissions || [],
      status: 'pending',
    });
    await invitation.save();

    // G. Create placeholder onboarding Employee record
    const selectedRole = await Role.findById(roleId);
    const employee = new Employee({
      companyId,
      fullName: cleanEmail.split('@')[0], // placeholder
      email: cleanEmail,
      status: 'onboarding',
      designation: selectedRole ? selectedRole.name : 'Specialist',
      departmentId: departmentId || null,
      isSoftDeleted: false,
    });
    await employee.save();

    // H. Send email with robust error boundary and dynamic cleanup
    try {
      await sendInvitationEmail({
        to: cleanEmail,
        token,
        companyName,
        invitedBy: actorName || session.user.email,
      });
    } catch (emailError: any) {
      // Rollback database writes to avoid blocking subsequent invites to this email
      await Invitation.deleteOne({ _id: invitation._id });
      await Employee.deleteOne({ _id: employee._id });

      console.error('❌ Failed to dispatch invitation email:', emailError);
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_DISPATCH_FAILED',
          message: `Failed to send invitation email: ${emailError.message}. Database records have been rolled back so you can try again.`,
        },
        { status: 502 }
      );
    }

    // I. Audit log
    await AuditLog.create({
      companyId,
      actorId,
      action: 'invite_created',
      resource: 'users',
      resourceId: invitation._id.toString(),
      status: 'success',
      details: `Invited ${cleanEmail} as role ${selectedRole ? selectedRole.name : 'Unknown'}.`,
    });

    return NextResponse.json({ success: true, data: invitation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

// 3. PUT: Resend an invitation
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const actorId = session.user.id;
    const actorName = session.user.name;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to resend invitations',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body;

    const invite = await Invitation.findOne({ _id: id, companyId });
    if (!invite) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found' },
        { status: 404 }
      );
    }

    const company = await Company.findById(companyId);
    const companyName = company ? company.name : 'SyncGrid Workspace';

    // Revertible token regeneration & expiration extension
    const originalToken = invite.token;
    const originalExpiresAt = invite.expiresAt;
    const originalStatus = invite.status;

    const newToken = crypto.randomBytes(32).toString('hex');
    invite.token = newToken;
    invite.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    invite.status = 'pending';
    await invite.save();

    try {
      await sendInvitationEmail({
        to: invite.email,
        token: newToken,
        companyName,
        invitedBy: actorName || session.user.email,
      });
    } catch (emailError: any) {
      // Revert database writes on failure
      invite.token = originalToken;
      invite.expiresAt = originalExpiresAt;
      invite.status = originalStatus;
      await invite.save();

      console.error('❌ Failed to resend invitation email:', emailError);
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_DISPATCH_FAILED',
          message: `Failed to resend invitation email: ${emailError.message}. Database records have been reverted.`,
        },
        { status: 502 }
      );
    }

    await AuditLog.create({
      companyId,
      actorId,
      action: 'invite_resent',
      resource: 'users',
      resourceId: invite._id.toString(),
      status: 'success',
      details: `Resent invitation to ${invite.email}`,
    });

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

// 4. DELETE: Revoke an invitation
export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const actorId = session.user.id;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to revoke invitations',
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invite ID required' }, { status: 400 });
    }

    const invite = await Invitation.findOne({ _id: id, companyId });
    if (!invite) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found' },
        { status: 404 }
      );
    }

    invite.status = 'revoked';
    await invite.save();

    // Soft-delete or terminate the matching placeholder employee record
    await Employee.updateOne(
      { companyId, email: invite.email, isSoftDeleted: false },
      { $set: { isSoftDeleted: true, status: 'terminated' } }
    );

    await AuditLog.create({
      companyId,
      actorId,
      action: 'invite_revoked',
      resource: 'users',
      resourceId: invite._id.toString(),
      status: 'success',
      details: `Revoked invitation to ${invite.email}`,
    });

    return NextResponse.json({ success: true, message: 'Invitation successfully revoked' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
