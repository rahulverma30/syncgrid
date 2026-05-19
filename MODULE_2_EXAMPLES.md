/\*\*

- MODULE 2 EXAMPLES
-
- This file demonstrates all Module 2 authentication and RBAC features.
- Copy and adapt these examples to your own code.
  \*/

// ============================================================
// EXAMPLE 1: Server-side Protected API Route with Permissions
// ============================================================

// File: app/api/users/route.ts
import { NextResponse } from 'next/server';
import { withApiPermission, validateRequestBody, apiSuccess, apiError } from '@/lib/auth/api';
import { createUserSchema } from '@/schemas/auth';
import { connectToDatabase } from '@/lib/db';
import { User, Role } from '@/models';
import { hashPassword } from '@/lib/security/password';

export const POST = withApiPermission(
'users',
'create',
async (request: Request, context: any, session: any) => {
const { data, response } = await validateRequestBody(request, createUserSchema);

    if (!data) return response;

    try {
      await connectToDatabase();

      // Verify roles exist
      const roles = await Role.find({ _id: { $in: data.roleIds } });
      if (roles.length !== data.roleIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_ROLES',
            message: 'One or more roles do not exist',
          },
          { status: 400 }
        );
      }

      // Create user
      const user = await User.create({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(Math.random().toString(36)), // Temporary
        companyId: session.user.companyId,
        roles: data.roleIds,
        status: 'invited',
      });

      return apiSuccess({ userId: user._id.toString() }, 201);
    } catch (error) {
      return apiError(error);
    }

}
);

// ============================================================
// EXAMPLE 2: Client-side Protected Component with Permissions
// ============================================================

// File: components/users/create-user-button.tsx
'use client';

import { PermissionGuard } from '@/components/ui';
import { CreateUserModal } from './create-user-modal';

export function CreateUserButton() {
return (
<PermissionGuard resource="users" action="create" strict>
<CreateUserModal />
</PermissionGuard>
);
}

// ============================================================
// EXAMPLE 3: Protected Page with Role Requirement
// ============================================================

// File: app/dashboard/admin/page.tsx
import { ProtectedPage } from '@/components/layouts';
import { AdminDashboard } from '@/components/admin';

export default function AdminPage() {
return (
<ProtectedPage requiredRole="admin">
<AdminDashboard />
</ProtectedPage>
);
}

// ============================================================
// EXAMPLE 4: Server Action with Permission Check
// ============================================================

// File: actions/users.ts
'use server';

import { requirePermission } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models';
import { revalidatePath } from 'next/cache';

export async function deleteUserAction(userId: string) {
const session = await requirePermission('users', 'delete');

await connectToDatabase();

const user = await User.findByIdAndDelete(userId);

revalidatePath('/dashboard/users');

return {
success: true,
deletedUser: user,
};
}

// ============================================================
// EXAMPLE 5: Navigation Filtering by Permissions
// ============================================================

// File: components/navigation/sidebar.tsx
'use client';

import { useSession } from 'next-auth/react';
import { filterNavigationByUser } from '@/lib/auth/navigation';
import type { NavigationItem } from '@/lib/auth/navigation';

const NAV_ITEMS: NavigationItem[] = [
{
label: 'Dashboard',
href: '/dashboard',
permission: { resource: 'dashboard', action: 'read' },
},
{
label: 'Users',
href: '/dashboard/users',
permission: { resource: 'users', action: 'read' },
},
{
label: 'Roles',
href: '/dashboard/roles',
permission: { resource: 'roles', action: 'read' },
},
{
label: 'Settings',
href: '/dashboard/settings',
roles: ['admin', 'super_admin'],
},
];

export function Sidebar() {
const { data: session } = useSession();

const visibleItems = filterNavigationByUser(
[{ items: NAV_ITEMS }],
session?.user
)[0].items;

return (

<nav>
{visibleItems.map((item) => (
<a key={item.href} href={item.href}>
{item.label}
</a>
))}
</nav>
);
}

// ============================================================
// EXAMPLE 6: Permission Check in Utility Function
// ============================================================

// File: utils/permissions.ts
import { hasPermission, hasRole, getResourceActions } from '@/lib/auth/permission-checks';
import type { Session } from 'next-auth';

export function canUserDeleteUser(session: Session): boolean {
return hasPermission(session.user.permissions, 'users', 'delete');
}

export function canUserExportData(session: Session): boolean {
return (
hasRole(session.user.roles, ['admin', 'super_admin']) ||
hasPermission(session.user.permissions, 'activity', 'export')
);
}

export function getUserPermissionsSummary(session: Session) {
return {
canManageUsers: hasPermission(session.user.permissions, 'users', 'manage'),
canViewAuditLogs: hasPermission(session.user.permissions, 'auditLogs', 'read'),
userActions: getResourceActions(session.user.permissions, 'users'),
isAdmin: hasRole(session.user.roles, ['admin']),
};
}

// ============================================================
// EXAMPLE 7: Activity Tracking
// ============================================================

// File: actions/audit.ts
'use server';

import { trackActivityAction } from '@/actions/auth';
import { ACTIVITY_TYPES, ACTIVITY_MESSAGES } from '@/lib/auth/activity';

export async function trackUserCreated(userId: string, userName: string) {
const message = ACTIVITY_MESSAGES[ACTIVITY_TYPES.USER_CREATED];

return trackActivityAction({
type: ACTIVITY_TYPES.USER_CREATED,
title: message.title,
description: `Created user: ${userName}`,
metadata: {
userId,
userName,
},
});
}

// ============================================================
// EXAMPLE 8: Advanced Permission Checking
// ============================================================

// File: components/user-actions.tsx
'use client';

import {
hasAnyPermission,
hasAllPermissions,
getResourceActions,
} from '@/lib/auth/permission-checks';
import { useSession } from 'next-auth/react';

export function UserActions() {
const { data: session } = useSession();

if (!session?.user) return null;

// Check if user can do ANY of these actions
const canViewOrEdit = hasAnyPermission(session.user.permissions, [
{ resource: 'users', action: 'read' },
{ resource: 'users', action: 'update' },
]);

// Check if user can do ALL of these actions
const canCreateAndDelete = hasAllPermissions(session.user.permissions, [
{ resource: 'users', action: 'create' },
{ resource: 'users', action: 'delete' },
]);

// Get all possible actions for users resource
const userActions = getResourceActions(session.user.permissions, 'users');

return (

<div>
{canViewOrEdit && <p>User can view or edit users</p>}
{canCreateAndDelete && <p>User can create and delete users</p>}
<p>User can perform these user actions: {userActions.join(', ')}</p>
</div>
);
}

// ============================================================
// EXAMPLE 9: Form with Permission-based Field Visibility
// ============================================================

// File: components/users/user-form.tsx
'use client';

import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth/permission-checks';
import { Input, Button } from '@/components/ui';

export function UserForm() {
const { data: session } = useSession();

const canAssignRoles = hasPermission(session?.user?.permissions || [], 'users', 'assign');
const canUpdate = hasPermission(session?.user?.permissions || [], 'users', 'update');

if (!canUpdate) {
return <p>You don't have permission to edit users</p>;
}

return (

<form>
<Input type="text" placeholder="Name" />
<Input type="email" placeholder="Email" />

      {canAssignRoles && (
        <div>
          <label>Assign Roles</label>
          <select multiple>
            <option>Admin</option>
            <option>Developer</option>
            <option>HR</option>
          </select>
        </div>
      )}

      <Button type="submit">Save User</Button>
    </form>

);
}

// ============================================================
// EXAMPLE 10: Multiple Permission Guard Combinations
// ============================================================

// File: components/dashboard.tsx
'use client';

import { PermissionRequirement, RoleGuard } from '@/components/ui';
import { AdminPanel } from './admin-panel';
import { UserDashboard } from './user-dashboard';

export function Dashboard() {
return (

<div>
{/_ Show only if user has dashboard read permission _/}
<PermissionRequirement
require="all"
permissions={[{ resource: 'dashboard', action: 'read' }]} >
<UserDashboard />
</PermissionRequirement>

      {/* Show only if user is admin */}
      <RoleGuard roles={['admin', 'super_admin']}>
        <AdminPanel />
      </RoleGuard>

      {/* Show if user can either read or write reports */}
      <PermissionRequirement
        require="any"
        permissions={[
          { resource: 'activity', action: 'read' },
          { resource: 'auditLogs', action: 'read' },
        ]}
      >
        <ReportsSection />
      </PermissionRequirement>
    </div>

);
}

function ReportsSection() {
return <div>Reports and Analytics</div>;
}

// ============================================================
// USAGE IN YOUR APP
// ============================================================

/\*

1. Use these examples to structure your own code
2. Always check permissions before sensitive operations
3. Use guards in components for UI conditional rendering
4. Use requirePermission() on server for API/action validation
5. Track important activities for audit trails
6. Filter navigation based on user permissions
7. Provide clear error messages when access is denied
   \*/
