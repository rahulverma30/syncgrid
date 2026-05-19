import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

export function getEmailTransporter() {
  const isDevelopment = env.NODE_ENV === 'development';

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.EMAIL_FROM) {
    if (isDevelopment) {
      console.warn(
        '⚠️ SMTP configuration is incomplete. Emails will be logged to the console instead of being sent.'
      );
      // Return a mock transporter for development
      return {
        sendMail: async (message: any) => {
          console.log('📧 DEVELOPMENT EMAIL SENT:');
          console.log('From:', message.from);
          console.log('To:', message.to);
          console.log('Subject:', message.subject);
          console.log('Text Content:', message.text);
          console.log('---------------------------');
          return { messageId: 'dev-mock-id' };
        },
      } as any;
    }

    throw new Error(
      'SMTP email configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM.'
    );
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE || false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail({ to, token }: { to: string; token: string }) {
  const transporter = getEmailTransporter();
  const resetUrl = `${env.NEXTAUTH_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const message = {
    from: env.EMAIL_FROM || 'SyncGrid CRM <syncgrid.crm@gmail.com>',
    to,
    subject: 'SyncGrid password reset instructions',
    text: `You requested a password reset for your SyncGrid account.

Open this link to set a new password:
${resetUrl}

If you did not request this, please ignore this message.
`,
    html: `
      <div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.5; color:#111;">
        <h1>Password reset request</h1>
        <p>You requested a password reset for your SyncGrid account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">
            Reset your password
          </a>
        </p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(message);
}

export async function sendInvitationEmail({
  to,
  token,
  companyName,
  invitedBy,
}: {
  to: string;
  token: string;
  companyName: string;
  invitedBy: string;
}) {
  const transporter = getEmailTransporter();
  const inviteUrl = `${env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${encodeURIComponent(token)}`;

  const message = {
    from: env.EMAIL_FROM || 'SyncGrid CRM <syncgrid.crm@gmail.com>',
    to,
    subject: `You have been invited to join ${companyName} on SyncGrid`,
    text: `Hi there,

${invitedBy} has invited you to join their organization, ${companyName}, on SyncGrid.

To accept your invitation and set up your profile, please open this link:
${inviteUrl}

This link will expire in 24 hours.

If you did not expect this, please ignore this message.
`,
    html: `
      <div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.5; color:#1f2937; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Welcome to SyncGrid!</h2>
        <p style="font-size: 14px;"><strong>${invitedBy}</strong> has invited you to join their workspace, <strong>${companyName}</strong>, on SyncGrid.</p>
        <p style="font-size: 14px;">Set up your account, configure your profile, and begin collaborating with your team today.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);">
            Accept Invitation & Setup Profile
          </a>
        </div>
        <p style="font-size: 12px; color: #6b7280;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; word-break: break-all;"><a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">This invitation link will expire in 24 hours. If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(message);
}
