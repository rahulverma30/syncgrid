import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db/mongodb';
import { hashPassword } from '@/lib/security/password';
import { Invitation, User, Employee, Company, AuditLog, RoleAssignment } from '@/models';
import { rateLimit } from '@/lib/security/rateLimiter';

// 1. GET: Verify invitation token validity
export async function GET(request: Request) {
  try {
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(`rate:invite-verify:${ip}`, 10, 15 * 60 * 1000); // 10 verifications / 15 mins
    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'API_ERROR',
          message: 'Too many verification attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const invitation = await Invitation.findOne({ token, status: 'pending' });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Invalid or expired invitation token.' },
        { status: 404 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'This invitation has expired.' },
        { status: 410 }
      );
    }

    const company = await Company.findById(invitation.companyId).select('name');
    const companyName = company ? company.name : 'SyncGrid Workspace';

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        companyName,
        companyId: invitation.companyId.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

// 2. POST: Accept invitation and create active user account
export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(`rate:invite-accept:${ip}`, 5, 15 * 60 * 1000); // 5 attempts / 15 mins
    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'API_ERROR',
          message: 'Too many onboarding attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'All fields are required' },
        { status: 400 }
      );
    }

    const invitation = await Invitation.findOne({ token, status: 'pending' });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Invalid or expired invitation token' },
        { status: 404 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // A. Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // B. Hash password
    const passwordHash = await hashPassword(password);

    // C. Create User record inside the company
    const user = new User({
      name,
      email: invitation.email,
      passwordHash,
      companyId: invitation.companyId,
      roles: [invitation.role],
      status: 'active',
      emailVerifiedAt: new Date(),
      passwordChangedAt: new Date(),
    });
    await user.save();

    // D. Link and update placeholder Employee record
    const employee = await Employee.findOne({
      companyId: invitation.companyId,
      email: invitation.email,
      isSoftDeleted: false,
    });
    if (employee) {
      employee.fullName = name;
      employee.status = 'active';
      employee.userId = user._id;
      await employee.save();
    } else {
      // If placeholder was deleted, create a new one
      const newEmployee = new Employee({
        companyId: invitation.companyId,
        fullName: name,
        email: invitation.email,
        status: 'active',
        designation: 'Specialist',
        departmentId: invitation.department,
        userId: user._id,
      });
      await newEmployee.save();
    }

    // D2. Create Role Assignment for Granular Scoping (Workspace/Department)
    const roleAssignment = new RoleAssignment({
      userId: user._id,
      companyId: invitation.companyId,
      roleId: invitation.role,
      assignedBy: invitation.invitedBy,
      workspaceId: invitation.workspaceId || null,
      departmentId: invitation.department || null,
    });
    await roleAssignment.save();

    // E. Accept Invitation
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // F. Audit Log
    await AuditLog.create({
      companyId: invitation.companyId,
      actorId: user._id,
      action: 'invite_accepted',
      resource: 'users',
      resourceId: user._id.toString(),
      status: 'success',
      details: `Accepted invite, created active user linked to employee profile.`,
    });

    return NextResponse.json({ success: true, message: 'Invitation accepted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
