import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { getAuthSecret } from '@/lib/env';
import { verifyPassword, isAccountLocked } from '@/lib/security/password';
import { loginSchema } from '@/schemas/auth';
import { Permission, Role, User } from '@/models';
import { compactPermissions } from './permission-checks';
import { rateLimit } from '@/lib/security/rateLimiter';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function prunePermissions(permissions: string[]): string[] {
  if (permissions.includes('*:manage')) {
    return ['*:manage'];
  }

  const manageResources = new Set<string>();
  permissions.forEach((p) => {
    const parts = p.split(':');
    if (parts.length === 2 && parts[1] === 'manage') {
      manageResources.add(parts[0]);
    }
  });

  return permissions.filter((p) => {
    const parts = p.split(':');
    if (parts.length === 2) {
      const [res, act] = parts;
      if (act === 'manage') return true;
      if (manageResources.has(res)) return false;
    }
    return true;
  });
}

function serializeUser(user: any) {
  const roles =
    user.rolesData?.map((role: any) => role.name) ||
    user.roles?.map((role: any) => (typeof role === 'string' ? role : role.name)) ||
    [];
  const permissions = prunePermissions(
    compactPermissions(
      user.permissionsData?.map((permission: any) => ({
        resource: permission.resource,
        action: permission.action,
      })) ||
        user.roles?.flatMap((role: any) =>
          role.permissions?.map((permission: any) => ({
            resource: permission.resource,
            action: permission.action,
          }))
        ) ||
        []
    )
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
        const tStart = performance.now();
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        // Apply sliding-window rate limit on login attempts
        try {
          const headerList = await headers();
          const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
          const limitResult = await rateLimit(`rate:login:${ip}`, 5, 15 * 60 * 1000); // Max 5 logins / 15 mins
          if (!limitResult.success) {
            throw new Error('Too many login attempts. Please try again in 15 minutes.');
          }
        } catch (e: any) {
          if (e.message?.includes('Too many login attempts')) {
            throw e;
          }
        }

        const tDbStart = performance.now();
        await connectToDatabase();
        const tDbEnd = performance.now();

        const tLookupStart = performance.now();
        const emailLower = parsed.data.email.toLowerCase();

        // Single database aggregation pipeline: User -> Roles -> Permissions
        const aggResults = await User.aggregate([
          { $match: { email: emailLower } },
          { $limit: 1 },
          {
            $lookup: {
              from: 'roles',
              localField: 'roles',
              foreignField: '_id',
              as: 'rolesData',
            },
          },
          {
            $lookup: {
              from: 'permissions',
              localField: 'rolesData.permissions',
              foreignField: '_id',
              as: 'permissionsData',
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              image: 1,
              companyId: 1,
              status: 1,
              passwordHash: 1,
              failedLoginAttempts: 1,
              lockUntil: 1,
              'rolesData.name': 1,
              'permissionsData.resource': 1,
              'permissionsData.action': 1,
            },
          },
        ]);
        const tLookupEnd = performance.now();

        const user = aggResults[0];

        if (!user || user.status === 'disabled') {
          console.log(`[AUTH PERFORMANCE PROFILE - FAILED LOOKUP]
  Total Latency:        ${(performance.now() - tStart).toFixed(2)}ms
  Database connection:  ${(tDbEnd - tDbStart).toFixed(2)}ms
  Aggregation Lookup:   ${(tLookupEnd - tLookupStart).toFixed(2)}ms`);
          return null;
        }

        if (isAccountLocked(user)) {
          console.log(`[AUTH PERFORMANCE PROFILE - LOCKED ACCOUNT]
  Total Latency:        ${(performance.now() - tStart).toFixed(2)}ms
  Database connection:  ${(tDbEnd - tDbStart).toFixed(2)}ms
  Aggregation Lookup:   ${(tLookupEnd - tLookupStart).toFixed(2)}ms`);
          throw new Error('Account is temporarily locked.');
        }

        const tBcryptStart = performance.now();
        const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
        const tBcryptEnd = performance.now();

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

          console.log(`[AUTH PERFORMANCE PROFILE - FAILED PASSWORD]
  Total Latency:        ${(performance.now() - tStart).toFixed(2)}ms
  Database connection:  ${(tDbEnd - tDbStart).toFixed(2)}ms
  Aggregation Lookup:   ${(tLookupEnd - tLookupStart).toFixed(2)}ms
  Bcrypt verify:        ${(tBcryptEnd - tBcryptStart).toFixed(2)}ms`);
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

        const tSerializeStart = performance.now();
        const serialized = serializeUser(user);
        const tSerializeEnd = performance.now();

        const totalLatency = performance.now() - tStart;
        console.log(`[AUTH PERFORMANCE PROFILE - SUCCESS]
  Total Login Latency:  ${totalLatency.toFixed(2)}ms
  Database connection:  ${(tDbEnd - tDbStart).toFixed(2)}ms
  Aggregation Lookup:   ${(tLookupEnd - tLookupStart).toFixed(2)}ms
  Bcrypt verify:        ${(tBcryptEnd - tBcryptStart).toFixed(2)}ms
  Session serialize:    ${(tSerializeEnd - tSerializeStart).toFixed(2)}ms`);

        return serialized;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const tStart = performance.now();
      if (user) {
        token.id = user.id;
        token.companyId = (user as any).companyId;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
        token.status = (user as any).status;
      }

      // Dynamic database validation & disabled-user check on session refresh
      // Only do this periodically (e.g., every 5 minutes) to optimize DB traffic
      const now = Date.now();
      const lastChecked = (token as any).lastChecked || 0;
      const CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes

      if (token.id && now - lastChecked > CHECK_INTERVAL) {
        try {
          const tDbStart = performance.now();
          await connectToDatabase();
          const tDbEnd = performance.now();

          const tQueryStart = performance.now();
          const dbUser = await User.findById(token.id).select('status').lean();
          const tQueryEnd = performance.now();

          if (dbUser) {
            token.status = dbUser.status;
          } else {
            token.status = 'disabled'; // User deleted/not found
          }
          (token as any).lastChecked = now;

          console.log(`[AUTH PERFORMANCE PROFILE - JWT VERIFY]
  DB connection:        ${(tDbEnd - tDbStart).toFixed(2)}ms
  User Status Query:    ${(tQueryEnd - tQueryStart).toFixed(2)}ms
  Total JWT verification: ${(performance.now() - tStart).toFixed(2)}ms`);
        } catch (error) {
          console.error('Error verifying user status in JWT callback:', error);
        }
      }

      const tTotal = performance.now() - tStart;
      if (user) {
        console.log(`[AUTH PERFORMANCE PROFILE - JWT CREATION]
  Total JWT creation:   ${tTotal.toFixed(2)}ms`);
      }

      return token;
    },
    async session({ session, token }) {
      const tStart = performance.now();
      if (session.user) {
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string;
        session.user.roles = (token.roles as string[]) || [];
        session.user.permissions = (token.permissions as string[]) || [];
        session.user.status = token.status as string;
      }

      console.log(`[AUTH PERFORMANCE PROFILE - SESSION SERIALIZATION]
  Total Session creation: ${(performance.now() - tStart).toFixed(2)}ms`);

      return session;
    },
  },
};
