import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import crypto from 'crypto';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User, Employee, Invitation, Role, Company } from '@/models';
import { sendInvitationEmail } from '@/lib/email';

/**
 * GET: Fetch team members (users) for the current company context.
 * Supports fuzzy search, role filtering, and basic pagination.
 */
export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const roleSlug = url.searchParams.get('role') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { companyId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (roleSlug) {
      // Find matching role
      const dbRole = await Role.findOne({
        $and: [
          {
            $or: [{ slug: roleSlug.toLowerCase() }, { name: { $regex: roleSlug, $options: 'i' } }],
          },
          { $or: [{ companyId }, { companyId: null }] },
        ],
      });
      if (dbRole) {
        query.roles = dbRole._id;
      } else {
        // If role doesn't exist, return empty data set
        return NextResponse.json({
          success: true,
          data: [],
          meta: { page, limit, total: 0 },
        });
      }
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('roles')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      status: u.status || 'active',
      roles:
        u.roles?.map((r: any) => ({
          _id: r._id.toString(),
          name: r.name,
          slug: r.slug,
        })) || [],
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      meta: {
        page,
        limit,
        total,
      },
    });
  } catch (error: any) {
    console.error('[GET Members Error]:', error);
    return apiErrorResponse(error);
  }
});

/**
 * POST: Invite a new collaborator.
 * Creates an Invitation and an Employee onboarding profile, then triggers SMTP dispatch.
 */
export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();
    const { name, email, role, departmentId } = body;

    if (!email || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Name and email are required parameters.',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'DUPLICATE_ERROR', message: 'User account already registered.' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvite = await Invitation.findOne({
      companyId,
      email: email.toLowerCase(),
      status: 'pending',
    });
    if (existingInvite) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_ERROR',
          message: 'Pending invitation already active for this email.',
        },
        { status: 400 }
      );
    }

    // Match Role or find default standard role
    let targetRole = null;
    if (role) {
      targetRole = await Role.findOne({
        $and: [
          { $or: [{ slug: role.toLowerCase() }, { name: { $regex: role, $options: 'i' } }] },
          { $or: [{ companyId }, { companyId: null }] },
        ],
      });
    }

    if (!targetRole) {
      // Default to "member" or similar system role
      targetRole = await Role.findOne({ slug: 'member' });
      if (!targetRole) {
        // Fall back to first available role
        targetRole = await Role.findOne();
      }
    }

    if (!targetRole) {
      return NextResponse.json(
        { success: false, error: 'ROLE_ERROR', message: 'No standard roles configured in system.' },
        { status: 500 }
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

    // 1. Save Invitation
    const invitation = new Invitation({
      companyId,
      email: email.toLowerCase(),
      role: targetRole._id,
      invitedBy: session.user.id,
      token,
      expiresAt,
      status: 'pending',
      department: departmentId || null,
    });
    await invitation.save();

    // 2. Provision onboarding Employee profile
    const employee = new Employee({
      companyId,
      fullName: name,
      email: email.toLowerCase(),
      status: 'onboarding',
      joiningDate: new Date(),
      employmentType: 'full-time',
      departmentId: departmentId || null,
    });
    await employee.save();

    // 3. Retrieve company name & dispatch SMTP invite email
    const company = await Company.findById(companyId);
    const companyName = company ? company.name : 'SyncGrid';

    await sendInvitationEmail({
      to: email.toLowerCase(),
      token,
      companyName,
      invitedBy: session.user.name || 'A Workspace Admin',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Secure team invitation dispatched successfully.',
        data: {
          _id: invitation._id.toString(),
          email: invitation.email,
          status: invitation.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST Members Error]:', error);
    return apiErrorResponse(error);
  }
});
