# 🔐 SyncGrid - Module 2: Authentication & RBAC System

## 📖 Table of Contents

1. [Overview](#overview)
2. [What's Included](#whats-included)
3. [Quick Start](#quick-start)
4. [System Architecture](#system-architecture)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)
7. [Documentation](#documentation)
8. [Support](#support)

---

## Overview

**Module 2** provides a complete, enterprise-grade authentication and role-based access control (RBAC) system for the SyncGrid platform. It includes:

- ✅ User authentication (register, login, logout)
- ✅ Password security (hashing, reset, change)
- ✅ Role-based access control (7 roles, 8 actions, 10 resources)
- ✅ Permission management (dynamic, granular, with overrides)
- ✅ Multi-tenant support (company-based isolation)
- ✅ Audit logging (compliance tracking)
- ✅ Activity tracking (user actions)
- ✅ Route protection (middleware, decorators, components)
- ✅ Security features (account lockout, CSRF, XSS protection)

---

## What's Included

### 📦 Core Components

#### Authentication System

```
✅ Email/password login
✅ User registration with company creation
✅ Password reset flow (forgot password → reset)
✅ Logout functionality
✅ Session management (JWT, 24h duration)
✅ Account lockout (5 attempts, 15 minutes)
✅ Current user endpoint
✅ Multi-company support
```

#### Database Models

```
✅ User - User accounts with roles/permissions
✅ Role - RBAC roles with permission assignment
✅ Permission - Granular permissions (resource:action)
✅ Company - Multi-tenant company support
✅ PasswordResetToken - Secure password reset
✅ AuditLog - Compliance audit trail
✅ Activity - User activity tracking
```

#### RBAC System

```
✅ 7 System Roles
   - Super Admin (full access)
   - Admin (company admin)
   - Project Manager
   - Team Lead
   - Developer
   - HR
   - Finance

✅ 8 Permission Actions
   - create, read, update, delete
   - export, approve, assign, manage

✅ 10 Permission Resources
   - dashboard, company, users, roles, permissions
   - auditLogs, activity, settings, auth, api
```

#### Security Features

```
✅ Password hashing (bcryptjs, cost 12)
✅ Secure token generation
✅ Account lockout mechanism
✅ JWT-based sessions
✅ Protected routes (middleware)
✅ Protected APIs (decorators)
✅ Input validation (Zod)
✅ Error handling (proper HTTP codes)
✅ Multi-tenant isolation
✅ Audit logging
```

#### UI Components & Guards

```
✅ PermissionGuard - Permission-based rendering
✅ RoleGuard - Role-based rendering
✅ PermissionRequirement - Multi-permission checks
✅ ProtectedPage - Page-level protection
```

#### API Route Protection

```
✅ withApiAuth() - Require authentication
✅ withApiPermission() - Require permission
✅ withApiRole() - Require role
✅ validateRequestBody() - Schema validation
✅ apiSuccess() - Standard success response
✅ apiErrorResponse() - Standard error response
```

---

## Quick Start

### 1. Environment Setup

```bash
# .env.local
MONGODB_URI=mongodb://127.0.0.1:27017/syncgrid
MONGODB_DB_NAME=syncgrid
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

### 2. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "companyName": "Acme Corp",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Login

```javascript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'john@example.com',
  password: 'SecurePass123',
  redirect: true,
});
```

### 4. Check Permissions

```javascript
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth/permission-checks';

export function MyComponent() {
  const { data: session } = useSession();

  if (!hasPermission(session?.user?.permissions, 'users', 'create')) {
    return <div>You don't have permission</div>;
  }

  return <CreateUserForm />;
}
```

### 5. Protect API Routes

```javascript
import { withApiPermission, apiSuccess } from '@/lib/auth/api';

export const POST = withApiPermission('users', 'create', async (request, context, session) => {
  // User is authenticated and has users:create permission
  const { name, email } = await request.json();
  // Create user...
  return apiSuccess({ userId: '...' }, 201);
});
```

---

## System Architecture

### Authentication Flow

```
User Registration
    ↓
Create Company
    ↓
Create User with Admin Role
    ↓
Assign Default Permissions via Role
    ↓
User Account Ready

User Login
    ↓
Validate Email & Password
    ↓
Check Account Status
    ↓
Check Lockout Status
    ↓
Generate JWT Token
    ↓
Store in Session
    ↓
Redirect to Dashboard

Access Protected Route
    ↓
Check JWT Token (Middleware)
    ↓
Validate User Status
    ↓
Check Permissions (Optional)
    ↓
Allow/Deny Access
```

### Permission Flow

```
User assigned to Role
    ↓
Role has Permissions
    ↓
User inherits Permissions via Role
    ↓
Permissions included in JWT Token
    ↓
Token cached in Session (24h)
    ↓
Token refreshed every 15 minutes
    ↓
Permission checked on sensitive operations
```

### Data Model

```
User
├── Email (unique per company)
├── Password Hash (bcryptjs)
├── Roles (array of Role IDs)
│   └── Role
│       ├── Name (Admin, Developer, etc.)
│       ├── Permissions (array of Permission IDs)
│       │   └── Permission
│       │       ├── Resource (users, roles, company)
│       │       └── Action (create, read, update, delete)
│       └── Company (null = system role)
├── Permission Overrides (allow/deny per user)
├── Company ID (multi-tenant)
├── Status (active, invited, disabled, locked)
└── Account Status (lastLoginAt, failedLoginAttempts, etc.)

Company
├── Name
├── Slug (unique)
├── Owner (User ID)
└── Settings (timezone, locale)
```

---

## Configuration

### NextAuth Configuration

Located in `lib/auth/options.ts`:

```typescript
{
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24,      // 24 hours
    updateAge: 60 * 15,         // 15 minutes
  },
  pages: {
    signIn: '/login',
  },
  // Credentials provider with email/password
  // JWT and Session callbacks for permission injection
}
```

### Middleware Configuration

Located in `middleware.ts`:

```typescript
// Protects:
// - /dashboard/* (with JWT validation)
// - /api/protected/* (with 401 response)

// Allows:
// - / (public)
// - /login, /register, /forgot-password, /reset-password (public)
```

### Role & Permission Configuration

Located in `constants/rbac.ts`:

```typescript
// 7 System Roles
// 8 Permission Actions
// 10 Permission Resources
// Default permissions per role
```

---

## Usage Examples

### Example 1: Protect an API Route

```typescript
// app/api/users/route.ts
import { withApiPermission, apiSuccess } from '@/lib/auth/api';

export const POST = withApiPermission('users', 'create', async (request, context, session) => {
  // session.user is authenticated and has users:create
  const { name, email } = await request.json();
  // Create user...
  return apiSuccess({ userId: '...' }, 201);
});
```

### Example 2: Protect a Component

```typescript
import { PermissionGuard } from '@/components/ui';

export function UsersList() {
  return (
    <PermissionGuard resource="users" action="read">
      <table>
        {/* Users table */}
      </table>
    </PermissionGuard>
  );
}
```

### Example 3: Protect a Page

```typescript
import { ProtectedPage } from '@/components/layouts';

export default function AdminPage() {
  return (
    <ProtectedPage requiredRole="admin">
      <AdminDashboard />
    </ProtectedPage>
  );
}
```

### Example 4: Check Permissions Programmatically

```typescript
import { hasPermission, hasRole } from '@/lib/auth/permission-checks';

if (hasPermission(user.permissions, 'users', 'delete')) {
  // Show delete button
}

if (hasRole(user.roles, ['admin', 'super_admin'])) {
  // Show admin panel
}
```

### Example 5: Track Activity

```typescript
import { trackActivityAction } from '@/actions/auth';
import { ACTIVITY_TYPES } from '@/lib/auth/activity';

await trackActivityAction({
  type: ACTIVITY_TYPES.USER_CREATED,
  title: 'User created',
  description: 'Admin created new user John Doe',
  metadata: { userId: '...', userName: 'John Doe' },
});
```

---

## Documentation

### 📄 MODULE_2_GUIDE.md

**Comprehensive System Guide** (30+ pages)

- Complete system overview
- Authentication usage
- RBAC & permissions
- Protected routes
- Activity tracking
- Configuration
- Troubleshooting

### 📄 MODULE_2_EXAMPLES.md

**Code Examples** (10+ examples)

- API route protection
- Component guarding
- Server actions
- Permission checking
- Activity tracking
- Navigation filtering

### 📄 SECURITY.md

**Security Best Practices**

- Security principles
- Password security
- Session management
- API security
- RBAC best practices
- Common mistakes
- Deployment checklist

### 📄 MODULE_2_CHECKLIST.md

**Implementation Status**

- Feature checklist
- File inventory
- Testing guide
- Statistics
- Next modules

---

## Key Functions

### Permission Checking

```typescript
// Single permission
hasPermission(permissions, 'users', 'create');

// Single role
hasRole(roles, ['admin']);

// Multiple roles (all required)
hasAllRoles(roles, ['admin', 'developer']);

// Multiple permissions (any required)
hasAnyPermission(permissions, [
  { resource: 'users', action: 'read' },
  { resource: 'dashboard', action: 'read' },
]);

// Multiple permissions (all required)
hasAllPermissions(permissions, [
  { resource: 'users', action: 'create' },
  { resource: 'users', action: 'delete' },
]);

// Get all actions for resource
getResourceActions(permissions, 'users');
```

### Navigation Filtering

```typescript
import { filterNavigationByUser } from '@/lib/auth/navigation';

const navigation = [
  {
    label: 'Users',
    href: '/dashboard/users',
    permission: { resource: 'users', action: 'read' },
  },
  // ...
];

const filtered = filterNavigationByUser([{ items: navigation }], user);
```

### API Protection

```typescript
import { withApiAuth, withApiPermission, withApiRole } from '@/lib/auth/api';

// Authentication only
export const GET = withApiAuth(async (req, ctx, session) => {});

// Authentication + Permission
export const POST = withApiPermission('users', 'create', async (req, ctx, session) => {});

// Authentication + Role
export const DELETE = withApiRole(['admin'], async (req, ctx, session) => {});
```

---

## Database Seeding

System roles and permissions are automatically created on first registration.

To manually seed:

```typescript
import { ensureSystemRoles } from '@/lib/auth/seed';
import { connectToDatabase } from '@/lib/db';

await connectToDatabase();
await ensureSystemRoles();
```

---

## Testing

### Test Account

```
Email: test@example.com
Password: SecurePass123
Company: Test Company
Role: Admin
```

### Test Login

```bash
POST /api/auth/signin
{
  "email": "test@example.com",
  "password": "SecurePass123"
}
```

### Test Permission

```bash
GET /api/auth/me
# Returns current user with permissions
```

---

## Security Checklist

- [x] Passwords hashed with bcryptjs
- [x] Account lockout implemented
- [x] JWT tokens secure
- [x] CSRF protection via NextAuth
- [x] XSS protection via React
- [x] Input validation with Zod
- [x] Multi-tenant isolation
- [x] Audit logging
- [x] Error messages don't leak info
- [x] Permission checks on APIs
- [x] Permission checks on routes
- [x] Permission checks on components

---

## Common Tasks

### Add New Permission to User

```typescript
import { User, Role } from '@/models';

const user = await User.findById(userId);
const newRole = await Role.findById(roleId);
user.roles.push(newRole._id);
await user.save();
```

### Create Custom Role

```typescript
import { Role, Permission } from '@/models';

const permissions = await Permission.find({
  key: { $in: ['users:read', 'users:update'] },
});

const role = await Role.create({
  name: 'Custom Role',
  slug: 'custom-role',
  permissions: permissions.map((p) => p._id),
  companyId: companyId,
});
```

### Override User Permission

```typescript
const user = await User.findById(userId);
user.permissionOverrides.push({
  resource: 'company',
  actions: ['delete'],
  effect: 'deny',
});
await user.save();
```

---

## Troubleshooting

### Account Locked

**Error**: "Account is temporarily locked"
**Solution**: Wait 15 minutes or reset password

### Permission Denied

**Error**: "Access denied" on protected route
**Solution**: Assign correct role or permission

### Session Not Working

**Error**: User not authenticated
**Solution**: Set `NEXTAUTH_SECRET` in `.env.local`

### Database Error

**Error**: Connection refused
**Solution**: Verify MongoDB is running and `MONGODB_URI` is correct

---

## Performance Notes

- JWT tokens are stateless (no DB lookup per request)
- Permissions cached in JWT (updates on next login)
- Middleware runs before route handler
- Database queries include relationship population
- Activity logging is non-blocking

---

## Next Steps

1. ✅ **Module 2 Complete** - Authentication & RBAC
2. 🚀 **Module 3** - CRM (Contacts, Companies, Deals)
3. 📊 **Module 4** - Projects (Management, Teams)
4. ✓ **Module 5** - Tasks (Tracking, Comments)
5. 💰 **Module 6** - Finance (Invoices, Expenses)
6. 👥 **Module 7** - HR (Employees, Leave)
7. 📈 **Module 8** - Analytics (Reports, Metrics)

---

## Support

- 📖 **Documentation**: Read MODULE_2_GUIDE.md
- 💡 **Examples**: See MODULE_2_EXAMPLES.md
- 🔐 **Security**: Review SECURITY.md
- ✅ **Status**: Check MODULE_2_CHECKLIST.md

---

## License

MIT - Feel free to use for commercial projects

---

## 🎉 Ready to Build!

Your enterprise authentication system is complete and production-ready.

**Start building Module 3 (CRM) now!** 🚀
