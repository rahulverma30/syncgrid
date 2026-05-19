import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/security/password';
import { registerSchema } from '@/schemas/auth';
import { ensureSystemRoles } from '@/lib/auth/seed';
import { slugifyRole } from '@/lib/auth/permission-checks';
import { AuditLog, Company, Role, User } from '@/models';
import { rateLimit } from '@/lib/security/rateLimiter';

function slugifyCompany(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request) {
  try {
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(`rate:register:${ip}`, 3, 60 * 60 * 1000); // 3 registrations per hour
    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: 'Too many registration attempts from this IP. Please try again in an hour.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureSystemRoles();

    const existingUser = await User.findOne({ email: parsed.data.email }).select('_id');

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'An account with this email already exists.',
        },
        { status: 409 }
      );
    }

    const company = await Company.create({
      name: parsed.data.companyName,
      slug: `${slugifyCompany(parsed.data.companyName)}-${Date.now().toString(36)}`,
    });

    const adminRole = await Role.findOne({
      slug: slugifyRole('Admin'),
      companyId: null,
    });

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      companyId: company._id,
      roles: adminRole ? [adminRole._id] : [],
      status: 'active',
      passwordChangedAt: new Date(),
    });

    await Company.updateOne({ _id: company._id }, { $set: { ownerId: user._id } });

    await AuditLog.create({
      companyId: company._id,
      actorId: user._id,
      action: 'register',
      resource: 'auth',
      resourceId: user._id.toString(),
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: user._id.toString(),
          companyId: company._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'REGISTER_FAILED',
        message: 'Unable to create account.',
      },
      { status: 500 }
    );
  }
}
