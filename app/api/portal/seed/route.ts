import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { Client } from '@/models/Client';
import { hashPassword } from '@/lib/security/password';
import { withApiAuth } from '@/lib/auth/api';
import { sendInvitationEmail, sendPortalWelcomeEmail } from '@/lib/email';
import { env } from '@/lib/env';
import crypto from 'crypto';

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'API_ERROR', message: 'Use POST to invite a user.' },
    { status: 403 }
  );
}

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const payload = await request.json();

    if (payload.action === 'invite') {
      const { clientId, name, email, portalRole } = payload;
      const companyId = session.user.companyId;

      const client = await Client.findOne({ _id: clientId, companyId });
      if (!client) {
        return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
      }

      // Check if user already exists
      let user = await ClientPortalUser.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Create user with a default password for testing purposes
        const defaultPasswordHash = await hashPassword('password123');
        const token = crypto.randomBytes(32).toString('hex');

        user = await ClientPortalUser.create({
          companyId,
          clientId,
          name,
          email,
          passwordHash: defaultPasswordHash,
          portalRole,
          status: 'invited',
          inviteToken: token,
          inviteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
      }

      // Try sending an email
      try {
        const portalLink = `${env.NEXTAUTH_URL || 'http://localhost:3000'}/portal/login`;
        await sendPortalWelcomeEmail({
          to: user.email,
          companyName: session.user.companyName || 'Your Agency',
          invitedBy: session.user.name || 'System Admin',
          portalLink,
          temporaryPassword: 'password123',
        });
      } catch (err) {
        console.warn('Could not send invite email', err);
      }

      return NextResponse.json({ success: true, message: 'Invite sent', data: user });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
