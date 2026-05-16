# 📚 Module 2: Database & Authentication System - COMPLETE GUIDE

## 🎯 Overview

Module 2 provides enterprise-grade authentication, authorization, and RBAC system for the SyncGrid platform. This document explains the complete system, how it works, and how to use it.

---

## 📦 What's Included

### 1. **Authentication System** ✅

- NextAuth.js integration with JWT strategy
- Email/password login with account lockout protection
- Registration with company creation
- Password reset flow
- Session management
- Logout functionality

### 2. **Database Architecture** ✅

- **User Model** - User accounts with roles and permissions
- **Role Model** - RBAC roles with permission assignment
- **Permission Model** - Granular permissions (resource:action)
- **Company Model** - Multi-tenant company support
- **PasswordResetToken Model** - Secure password reset tokens
- **AuditLog Model** - Complete audit trail
- **Activity Model** - User activity tracking

### 3. **RBAC System** ✅

- **7 System Roles**:
  - Super Admin (full access)
  - Admin (company admin)
  - Project Manager
  - Team Lead
  - Developer
  - HR
  - Finance

- **8 Permission Actions**:
  - create
  - read
  - update
  - delete
  - export
  - approve
  - assign
  - manage

- **10 Permission Resources**:
  - dashboard
  - company
  - users
  - roles
  - permissions
  - auditLogs
  - activity
  - settings
  - auth
  - api

### 4. **Security Features** ✅

- Password hashing with bcryptjs (cost factor 12)
- Account lockout after 5 failed attempts (15 minutes)
- Secure token generation and hashing
- JWT-based sessions
- Protected routes and APIs
- CORS support ready

### 5. **Middleware & Route Protection** ✅

- Next.js middleware for protected routes
- Protected `/dashboard` routes
- Protected `/api/protected` routes
- Automatic redirect to login for unauthenticated users

---

## 🚀 How to Use

### A. Authentication

#### 1. **Register a New Account**

```javascript
// POST /api/auth/register
{
  "name": "John Doe",
  "companyName": "Acme Corp",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// Response
{
  "success": true,
  "data": {
    "userId": "...",
    "companyId": "..."
  }
}
```

#### 2. **Login**

```javascript
// NextAuth automatically handles login via /api/auth/signin
// Or use signIn() from next-auth/react

import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'john@example.com',
  password: 'SecurePass123',
  redirect: false,
});
```

#### 3. **Get Current User**

```javascript
// Server-side
import { auth } from '@/lib/auth/session';

const session = await auth();
const user = session?.user;

// Client-side
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
const user = session?.user;
```

#### 4. **Logout**

```javascript
// Server action
import { logoutAction } from '@/actions/logout';

await logoutAction();

// Client-side
import { signOut } from 'next-auth/react';

await signOut({ redirect: true });
```

#### 5. **Forgot Password**

```javascript
// POST /api/auth/forgot-password
{
  "email": "john@example.com"
}

// In development, response includes:
{
  "success": true,
  "devResetToken": "..." // Only in dev
}
```

#### 6. **Reset Password**

```javascript
// POST /api/auth/reset-password
{
  "token": "...",
  "password": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

### B. RBAC & Permissions

#### 1. **Check Permissions in Server Components**

```javascript
import { requirePermission, requireRole } from '@/lib/auth/session';

// Require specific permission
export async function AdminDashboard() {
  const session = await requirePermission('dashboard', 'read');
  // Now you have access to session.user with permissions
}

// Require specific role
export async function SuperAdminPanel() {
  const session = await requireRole(['Super Admin']);
}
```

#### 2. **Check Permissions in Client Components**

```javascript
import { PermissionGuard, RoleGuard, PermissionRequirement } from '@/components/ui';

// Single permission
<PermissionGuard resource="users" action="create">
  <CreateUserButton />
</PermissionGuard>

// Single role
<RoleGuard roles={['admin']}>
  <AdminPanel />
</RoleGuard>

// Multiple permissions (requires all)
<PermissionRequirement
  require="all"
  permissions={[
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
  ]}
>
  <UserManagement />
</PermissionRequirement>

// Multiple permissions (requires any)
<PermissionRequirement
  require="any"
  permissions={[
    { resource: 'dashboard', action: 'read' },
    { resource: 'api', action: 'read' },
  ]}
>
  <Dashboard />
</PermissionRequirement>
```

#### 3. **Check Permissions Programmatically**

```javascript
import {
  hasPermission,
  hasRole,
  hasAllPermissions,
  hasAnyPermission,
  getResourceActions,
} from '@/lib/auth/permission-checks';

// Single permission
if (hasPermission(user.permissions, 'users', 'create')) {
  // User can create users
}

// Single role
if (hasRole(user.roles, ['admin', 'super_admin'])) {
  // User is admin or super admin
}

// All permissions
if (
  hasAllPermissions(user.permissions, [
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'delete' },
  ])
) {
  // User can create AND delete users
}

// Any permission
if (
  hasAnyPermission(user.permissions, [
    { resource: 'dashboard', action: 'read' },
    { resource: 'api', action: 'read' },
  ])
) {
  // User can read dashboard OR api
}

// Get all actions for resource
const actions = getResourceActions(user.permissions, 'users');
// Returns: ['create', 'read', 'update', 'delete']
```

#### 4. **Filter Navigation by Permissions**

```javascript
import { filterNavigationByUser } from '@/lib/auth/navigation';

const navigationGroups = [
  {
    label: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        roles: ['admin', 'super_admin'],
      },
      {
        label: 'Users',
        href: '/dashboard/users',
        permission: { resource: 'users', action: 'read' },
      },
    ],
  },
];

const visibleNavigation = filterNavigationByUser(navigationGroups, session.user);
```

### C. Protected Routes

#### 1. **Protect API Routes**

```javascript
// GET /api/protected/example
import { withApiAuth, withApiPermission, apiSuccess } from '@/lib/auth/api';

export const GET = withApiAuth(async (request, context, session) => {
  // session.user is authenticated
  return apiSuccess({ user: session.user });
});

// With permission check
export const POST = withApiPermission('users', 'create', async (request, context, session) => {
  // User has users:create permission
  const { data, response } = await validateRequestBody(request, createUserSchema);
  if (!data) return response;
  // Process...
});
```

#### 2. **Protect Pages**

```javascript
// app/dashboard/page.js
import { ProtectedPage } from '@/components/layouts';
import Dashboard from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <ProtectedPage requiredRole="admin">
      <Dashboard />
    </ProtectedPage>
  );
}
```

#### 3. **Permission Guards in Components**

```javascript
import { PermissionGuard } from '@/components/ui';

export function UsersList() {
  return (
    <PermissionGuard resource="users" action="read" strict>
      <UsersTable />
    </PermissionGuard>
  );
}
```

### D. Activity Tracking

#### 1. **Track User Activity**

```javascript
import { trackActivityAction } from '@/actions/auth';
import { ACTIVITY_TYPES } from '@/lib/auth/activity';

await trackActivityAction({
  type: ACTIVITY_TYPES.USER_CREATED,
  title: 'User created',
  description: 'Admin created new user John Doe',
  metadata: {
    userId: '...',
    userName: 'John Doe',
  },
});
```

#### 2. **Get Activity Helpers**

```javascript
import {
  formatActivityType,
  getActivityIcon,
  getActivitySeverity,
  ACTIVITY_MESSAGES,
} from '@/lib/auth/activity';

const formatted = formatActivityType('user_created'); // "User Created"
const icon = getActivityIcon('user_created'); // "👤"
const severity = getActivitySeverity('user_created'); // "medium"
const message = ACTIVITY_MESSAGES.USER_CREATED; // { title: "...", description: "..." }
```

---

## 📁 Project Structure

```
lib/
├── auth/
│   ├── activity.ts          # Activity tracking types and helpers
│   ├── api.ts               # API route protection decorators
│   ├── errors.ts            # Auth error classes
│   ├── navigation.ts         # Navigation permission filtering
│   ├── options.ts           # NextAuth configuration
│   ├── permission-checks.ts # Permission checking utilities
│   ├── permissions.ts       # User permission resolution
│   └── session.ts           # Session management
├── db/
│   ├── index.ts             # Database exports
│   └── mongodb.ts           # MongoDB connection
├── security/
│   ├── password.ts          # Password hashing
│   └── tokens.ts            # Token generation
└── env.ts                   # Environment validation

models/
├── User.ts                  # User model
├── Role.ts                  # Role model
├── Permission.ts            # Permission model
├── Company.ts               # Company model
├── PasswordResetToken.ts    # Reset token model
├── AuditLog.ts              # Audit log model
├── Activity.ts              # Activity model
└── index.ts                 # Model exports

app/
├── api/
│   └── auth/
│       ├── me/              # Current user endpoint
│       ├── logout/          # Logout endpoint
│       ├── register/        # Registration
│       ├── forgot-password/ # Password reset request
│       ├── reset-password/  # Password reset confirmation
│       └── [...nextauth]/   # NextAuth handler
├── unauthorized/            # 403 page
└── middleware.ts            # Route protection middleware

components/
├── ui/
│   └── permission-guard.tsx # Permission-based rendering
└── layouts/
    ├── protected-page.tsx   # Protected page wrapper
    └── ...

actions/
├── auth.ts                  # Auth server actions
├── logout.ts                # Logout server action
└── ...

schemas/
├── auth.ts                  # Auth validation schemas
├── rbac.ts                  # RBAC validation schemas
└── ...

constants/
├── routes.ts                # Public/protected routes
└── rbac.ts                  # Roles and permissions
```

---

## 🔐 Security Best Practices

### 1. **Password Security**

```javascript
// Passwords are automatically hashed with bcryptjs (cost factor 12)
// Password requirements:
// - Minimum 12 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
```

### 2. **Account Lockout**

```javascript
// After 5 failed login attempts:
// Account is locked for 15 minutes
// User cannot login during lockout period
// Lockout is automatically cleared on successful login
```

### 3. **Session Management**

```javascript
// JWT-based sessions
// Default session duration: 24 hours
// Token refresh: every 15 minutes
// Session automatically cleared on logout
```

### 4. **Protected API Routes**

```javascript
// Always require authentication for protected APIs
import { withApiAuth, withApiPermission } from '@/lib/auth/api';

// Validate request body
import { validateRequestBody } from '@/lib/auth/api';

// Return proper error responses
import { apiError, apiSuccess } from '@/lib/auth/api';
```

### 5. **XSS Protection**

```javascript
// Use permission guards to prevent unauthorized content rendering
<PermissionGuard resource="users" action="delete" strict>
  <DeleteButton />
</PermissionGuard>
```

---

## 🔄 Database Seeding

### 1. **Automatic Role & Permission Seeding**

```javascript
// Roles and permissions are automatically created on first registration
// Called via ensureSystemRoles() in register endpoint
```

### 2. **Manual Seeding**

```javascript
import { ensureSystemRoles } from '@/lib/auth/seed';
import { connectToDatabase } from '@/lib/db';

await connectToDatabase();
await ensureSystemRoles();
```

---

## 📊 User Roles & Permissions

### Super Admin

- **Access**: All features with `*:manage` permission
- **Use Case**: System administrator

### Admin

- **Resources**: Dashboard, Users, Roles, Permissions, Settings, Company
- **Use Case**: Company administrator

### Project Manager

- **Resources**: Dashboard, Users, Activity
- **Use Case**: Project oversight

### Team Lead

- **Resources**: Dashboard, Users
- **Use Case**: Team management

### Developer

- **Resources**: Dashboard
- **Use Case**: Individual contributor

### HR

- **Resources**: Dashboard, Users (full CRUD)
- **Use Case**: HR management

### Finance

- **Resources**: Dashboard, Audit Logs
- **Use Case**: Financial oversight

---

## ⚙️ Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/syncgrid
MONGODB_DB_NAME=syncgrid

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Node
NODE_ENV=development
```

### NextAuth Configuration

Located in `lib/auth/options.ts`:

```typescript
{
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24,        // 24 hours
    updateAge: 60 * 15,           // 15 minutes
  },
  pages: {
    signIn: '/login',
  },
  // ... providers and callbacks
}
```

---

## 🧪 Testing

### Test Login

```bash
# Use registration to create test account
POST http://localhost:3000/api/auth/register
{
  "name": "Test User",
  "companyName": "Test Company",
  "email": "test@example.com",
  "password": "SecurePass123"
}

# Login
POST http://localhost:3000/api/auth/signin
{
  "email": "test@example.com",
  "password": "SecurePass123"
}
```

### Test Permissions

```javascript
// Check current user permissions
fetch('/api/auth/me', {
  headers: { Authorization: 'Bearer <token>' },
})
  .then((r) => r.json())
  .then((data) => console.log(data.user.permissions));
```

---

## 🐛 Troubleshooting

### Issue: "Account is temporarily locked"

**Cause**: 5 failed login attempts
**Solution**: Wait 15 minutes or reset password

### Issue: "Access denied" when accessing protected route

**Cause**: User lacks required permission
**Solution**: Assign appropriate role to user or update role permissions

### Issue: Session not persisting

**Cause**: NEXTAUTH_SECRET not set
**Solution**: Set NEXTAUTH_SECRET in .env.local with min 32 characters

### Issue: Database connection error

**Cause**: MONGODB_URI not set or MongoDB not running
**Solution**: Set MONGODB_URI and ensure MongoDB is running

---

## 📝 Next Steps for Module 3+

The authentication and database foundation is complete. Ready for:

1. **CRM Module** - Customer relationship management
2. **Projects Module** - Project management
3. **Tasks Module** - Task management
4. **Finance Module** - Financial management
5. **HR Module** - Human resources management
6. **Analytics Module** - Advanced analytics

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Mongoose Documentation](https://mongoosejs.com/)
- [Zod Documentation](https://zod.dev/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 🎉 Module 2 Complete!

Your enterprise authentication and RBAC system is fully implemented and production-ready.

**Key Files Added/Modified:**

- ✅ Middleware implementation
- ✅ API routes (me, logout)
- ✅ Server actions (logout)
- ✅ Permission guards
- ✅ Activity tracking
- ✅ Enhanced schemas
- ✅ API decorators
- ✅ Type definitions

**Total Features:** 25+ authentication and security features
**Security Level:** Enterprise-grade
**Status:** ✅ Production Ready
