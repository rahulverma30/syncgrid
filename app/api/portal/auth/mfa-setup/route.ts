import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { generateMFASecret } from '@/lib/security/mfa';

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requirePortalAuth();
    const { id: userId, email } = session.user;

    const user = await ClientPortalUser.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'User not found.' },
        { status: 404 }
      );
    }

    // Generate fresh secret key and otpauth config string
    const { secret, otpauthUrl } = generateMFASecret(email);

    // Save pending secret on user profile
    await ClientPortalUser.updateOne({ _id: userId }, { $set: { mfaSecret: secret } });

    return NextResponse.json({
      success: true,
      data: {
        secret,
        otpauthUrl,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (error: any) {
    console.error('MFA Setup GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
