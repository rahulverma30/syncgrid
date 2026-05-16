import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

export function getEmailTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.EMAIL_FROM) {
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
    from: env.EMAIL_FROM,
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
