# 🔐 Security & RBAC Best Practices

## Core Principles

### 1. **Least Privilege Access**

- Users should have the minimum permissions needed for their role
- Avoid giving blanket `*:manage` permissions to non-admins
- Use specific resource:action combinations

```javascript
// ❌ AVOID - Too broad
const roles = await Role.findOne({ slug: 'developer' });
await role.updateOne({
  permissions: ['*:manage'], // Full access!
});

// ✅ GOOD - Specific permissions
const roles = ['dashboard:read', 'api:read', 'activity:read'];
```

### 2. **Defense in Depth**

- Protect routes with middleware
- Validate permissions at API level
- Check permissions in components
- Use multiple layers of security

```javascript
// Layer 1: Middleware (routes/api)
// Layer 2: Server action (requirePermission)
// Layer 3: Component guard (PermissionGuard)
// Layer 4: UI logic (hasPermission checks)
```

### 3. **Fail Secure**

- Default to denying access
- Explicit allow > implicit deny
- Redirect to login on auth failure
- Show helpful error messages

```javascript
// ✅ GOOD - Explicit denial
if (!hasPermission(permissions, resource, action)) {
  return new PermissionError();
}

// ✅ GOOD - Fallback to empty state
<PermissionGuard resource="users" action="read" fallback={<AccessDenied />}>
  <UsersList />
</PermissionGuard>;
```

---

## Password Security

### Requirements

```javascript
// Minimum 12 characters
// At least one uppercase letter (A-Z)
// At least one lowercase letter (a-z)
// At least one number (0-9)

// Examples:
// ✅ SecurePass123
// ✅ P@ssw0rd2024
// ❌ password123 (no uppercase)
// ❌ PASSWORD123 (no lowercase)
// ❌ SecurePass (no number)
```

### Hashing

```javascript
// Passwords are hashed with bcryptjs
// Cost factor: 12
// Each password takes ~300ms to hash
// Never store plain-text passwords

import { hashPassword, verifyPassword } from '@/lib/security/password';

const hashed = await hashPassword('SecurePass123');
const isValid = await verifyPassword('SecurePass123', hashed);
```

### Account Lockout

```javascript
// After 5 failed login attempts:
// - Account is locked for 15 minutes
// - User cannot login during lockout
// - Lockout is cleared on successful login

// Configure in lib/auth/options.ts
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
```

---

## Session & Token Security

### JWT Strategy

```javascript
// Uses secure JWT-based sessions
// Default duration: 24 hours
// Token refresh: 15 minutes (sliding window)

// In lib/auth/options.ts:
session: {
  strategy: 'jwt',
  maxAge: 60 * 60 * 24,      // 24 hours
  updateAge: 60 * 15,         // 15 minutes
}
```

### Token Rotation

```javascript
// JWT tokens are automatically refreshed
// Tokens are validated on every request
// Expired tokens redirect to login
```

### Logout

```javascript
// All sessions are invalidated on logout
// Client-side: signOut() clears session
// Server-side: Session data removed

import { signOut } from 'next-auth/react';
await signOut({ redirect: true });
```

---

## API Security

### ALWAYS Protect Sensitive Endpoints

```javascript
// ❌ AVOID - Unprotected
export async function GET(request: Request) {
  const users = await User.find(); // ANYONE can access!
  return NextResponse.json(users);
}

// ✅ GOOD - Protected with authentication
export const GET = withApiAuth(async (request, context, session) => {
  const users = await User.find({ companyId: session.user.companyId });
  return NextResponse.json(users);
});

// ✅ BETTER - Protected with permission check
export const GET = withApiPermission(
  'users',
  'read',
  async (request, context, session) => {
    const users = await User.find({ companyId: session.user.companyId });
    return NextResponse.json(users);
  }
);
```

### Validate Request Body

```javascript
import { validateRequestBody, apiErrorResponse } from '@/lib/auth/api';

export const POST = withApiPermission('users', 'create', async (request, context, session) => {
  const { data, response } = await validateRequestBody(request, createUserSchema);

  if (!data) return response;

  // Process validated data
});
```

### Return Proper Error Responses

```javascript
import { apiError, apiErrorResponse } from '@/lib/auth/api';

// Use apiError for general error handling
catch (error) {
  return apiError(error);
}

// Use apiErrorResponse for specific errors
if (!user) {
  return apiErrorResponse('USER_NOT_FOUND', 'User does not exist', 404);
}
```

---

## Route Protection

### Protected Routes via Middleware

```javascript
// Automatically protected by middleware in middleware.ts

// Public routes (AUTH_PUBLIC_ROUTES in constants/routes.ts):
// - /
// - /login
// - /register
// - /forgot-password
// - /reset-password

// Protected routes:
// - /dashboard/*
// - /api/protected/*

// User is redirected to /login if not authenticated
```

### Protected Pages via Component Wrapper

```javascript
import { ProtectedPage } from '@/components/layouts';

export default function AdminPage() {
  return (
    <ProtectedPage requiredRole="admin">
      <AdminDashboard />
    </ProtectedPage>
  );
}

// Automatically redirects to /login if not authenticated
// Automatically redirects to /unauthorized if wrong role
```

---

## RBAC Best Practices

### 1. Use Resource:Action Format

```javascript
// ✅ GOOD - Clear, granular permissions
'users:create';
'users:read';
'users:update';
'users:delete';
'users:assign'; // Assign roles
'users:manage'; // All user actions

// ❌ AVOID - Ambiguous
'user_admin';
'manage_all';
'full_access';
```

### 2. Organize Permissions by Resource

```javascript
// Good permission organization:
// users:* (all user permissions)
// roles:* (all role permissions)
// company:* (all company permissions)

// Not:
// admin:*
// staff:*
```

### 3. Create Meaningful Roles

```javascript
// ✅ GOOD - Purpose-driven roles
// Admin - Full company access
// Manager - Team and project management
// Developer - Read-only access to relevant data
// HR - User and company management

// ❌ AVOID - Too many roles
// Role 1
// Role 2
// ...
// Role 50
```

### 4. Dynamic Permissions via Overrides

```javascript
// Users can have permission overrides
// Allows flexible permission management

const user = await User.findById(userId);

// User has Admin role (many permissions)
// But deny specific action:
user.permissionOverrides = [
  {
    resource: 'company',
    actions: ['delete'],
    effect: 'deny',
  },
];

// Now user cannot delete company, despite being admin
```

---

## Data Isolation

### Multi-tenancy Security

```javascript
// Always filter by companyId

// ❌ AVOID - No company isolation
const users = await User.find();

// ✅ GOOD - Filter by company
const users = await User.find({
  companyId: session.user.companyId,
});
```

### Company-scoped Queries

```javascript
// Always include company check
async function getUsersForCompany(session: any) {
  return User.find({
    companyId: session.user.companyId,
  });
}

// In API routes:
export const GET = withApiAuth(async (request, context, session) => {
  const users = await User.find({
    companyId: session.user.companyId, // CRITICAL
  });
  return apiSuccess(users);
});
```

---

## Audit & Logging

### Track Important Actions

```javascript
import { trackActivityAction } from '@/actions/auth';
import { ACTIVITY_TYPES } from '@/lib/auth/activity';

// Track user creation
await trackActivityAction({
  type: ACTIVITY_TYPES.USER_CREATED,
  title: 'User created',
  description: 'Admin created new user',
  metadata: { userId, userName },
});

// Track permission changes
await trackActivityAction({
  type: ACTIVITY_TYPES.PERMISSION_GRANTED,
  title: 'Permission granted',
  description: 'User granted delete permission',
  metadata: { userId, permission: 'users:delete' },
});
```

### Audit Log Queries

```javascript
// Review who did what when
const logs = await AuditLog.find({
  companyId: companyId,
  createdAt: { $gte: startDate, $lte: endDate },
}).sort({ createdAt: -1 });

// Find specific action
const deletions = await AuditLog.find({
  action: 'delete',
  resource: 'users',
});
```

---

## Common Security Mistakes

### ❌ Mistake 1: Trusting Client-side Checks

```javascript
// WRONG - Client can fake permissions
if (session?.user?.permissions.includes('users:delete')) {
  // Delete user
}

// RIGHT - Always validate server-side
const session = await requirePermission('users', 'delete');
// Now safe to delete
```

### ❌ Mistake 2: Storing Sensitive Data in JWT

```javascript
// WRONG - JWT tokens are readable (not encrypted)
jwt.sign({
  userId: user._id,
  email: user.email,
  apiKey: user.apiKey, // EXPOSED!
  secretData: 'secret',
});

// RIGHT - Only store ID, verify in database
jwt.sign({
  userId: user._id, // OK - can be decoded
  companyId: user.companyId, // OK
  roles: user.roles, // OK - non-sensitive
});
```

### ❌ Mistake 3: Missing CSRF Protection

```javascript
// WRONG - No CSRF token validation
export async function POST(request: Request) {
  const data = await request.json();
  await deleteUser(data.userId); // Vulnerable to CSRF
}

// RIGHT - Use POST with proper validation
// NextAuth provides CSRF protection automatically
// API routes should use tokens in Authorization header
```

### ❌ Mistake 4: Exposing Error Messages

```javascript
// WRONG - Reveals if user exists
if (!user) {
  return { error: 'User with email john@example.com not found' };
}

// RIGHT - Generic message
if (!user) {
  return { error: 'Invalid credentials' };
}
```

### ❌ Mistake 5: Not Validating Input

```javascript
// WRONG - Direct use of input
const user = await User.findById(req.body.userId);

// RIGHT - Validate first
const parsed = createUserSchema.safeParse(req.body);
if (!parsed.success) {
  return { error: 'Invalid input' };
}
const user = await User.findById(parsed.data.userId);
```

---

## Performance & Security Balance

### Avoid N+1 Queries

```javascript
// ❌ SLOW - Multiple queries
const users = await User.find();
for (const user of users) {
  const roles = await Role.find({ _id: { $in: user.roles } });
}

// ✅ FAST - Single query with populate
const users = await User.find().populate('roles');
```

### Cache Carefully

```javascript
// Be careful with permission caching
// Don't cache sensitive permissions
// Always validate on sensitive operations

// OK to cache (read-only):
export const getUserRoles = async (userId: string) => {
  return cache.get(`roles:${userId}`) ||
         await fetchRolesFromDB(userId);
};

// MUST validate server-side:
export const DELETE = withApiPermission(
  'users',
  'delete',
  // Don't rely on cached permissions
);
```

---

## Deployment Checklist

- [ ] Set strong NEXTAUTH_SECRET (min 32 chars, random)
- [ ] Use production MongoDB URI
- [ ] Enable HTTPS in production
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Test all auth flows
- [ ] Review middleware configuration
- [ ] Audit default roles and permissions
- [ ] Enable monitoring/logging
- [ ] Set up SSL certificates
- [ ] Configure CORS if needed
- [ ] Review error messages (no sensitive data)
- [ ] Test account lockout
- [ ] Verify token expiration works
- [ ] Test permission edge cases
- [ ] Set up audit log retention

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/example)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)

---

## Support

For security issues or vulnerabilities, please report privately rather than creating public issues.
