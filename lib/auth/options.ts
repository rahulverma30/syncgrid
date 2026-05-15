import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/db';
import { getAuthSecret } from '@/lib/env';
import { verifyPassword, isAccountLocked } from '@/lib/security/password';
import { loginSchema } from '@/schemas/auth';
import { Permission, Role, User } from '@/models';
import { compactPermissions } from './permission-checks';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function serializeUser(user: any) {
  const roles = user.roles?.map((role: any) => role.name) || [];
  const permissions = compactPermissions(
    user.roles?.flatMap((role: any) =>
      role.permissions?.map((permission: any) => ({
        resource: permission.resource,
        action: permission.action,
      }))
    ) || []
  );

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    companyId: user.companyId.toString(),
    roles,
    permissions,
    status: user.status,
  };
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 15,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        await connectToDatabase();

        const user = await User.findOne({ email: parsed.data.email })
          .select('+passwordHash')
          .populate({
            path: 'roles',
            model: Role,
            populate: {
              path: 'permissions',
              model: Permission,
            },
          });

        if (!user || user.status === 'disabled') {
          return null;
        }

        if (isAccountLocked(user)) {
          throw new Error('Account is temporarily locked.');
        }

        const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          const lockUntil =
            failedLoginAttempts >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
              : null;

          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                failedLoginAttempts,
                lockUntil,
              },
            }
          );

          return null;
        }

        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              lastLoginAt: new Date(),
              failedLoginAttempts: 0,
              lockUntil: null,
            },
          }
        );

        return serializeUser(user);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = (user as any).companyId;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
        token.status = (user as any).status;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string;
        session.user.roles = (token.roles as string[]) || [];
        session.user.permissions = (token.permissions as string[]) || [];
        session.user.status = token.status as string;
      }

      return session;
    },
  },
};
