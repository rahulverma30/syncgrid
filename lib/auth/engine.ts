import { connectToDatabase } from '@/lib/db/mongodb';
import { Role, Permission, RoleAssignment, AuthorizationPolicy, User } from '@/models';
import { permissionKey } from './permission-checks';
import type { Types } from 'mongoose';

// Simple high-performance TTL cache for resolved permissions (sub-5ms resolution target)
interface CacheEntry {
  permissions: Set<string>;
  roles: Set<string>;
  maxHierarchy: number;
  expiresAt: number;
}
const permissionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Flush authorization cache for a user
 */
export function flushUserAuthCache(userId: string) {
  permissionCache.delete(userId.toString());
}

/**
 * Resolves a user's full set of effective permissions and roles (including inheritance and scoping)
 */
export async function resolveUserAuthContext(
  userId: string,
  companyId: string
): Promise<{
  permissions: Set<string>;
  roles: Set<string>;
  maxHierarchy: number;
}> {
  const cacheKey = `${userId}:${companyId}`;
  const cached = permissionCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  await connectToDatabase();

  const user = await User.findById(userId).populate({
    path: 'roles',
    model: Role,
    populate: {
      path: 'permissions',
      model: Permission,
    },
  });

  if (!user) {
    return { permissions: new Set(), roles: new Set(), maxHierarchy: 999 };
  }

  const effectivePermissions = new Set<string>();
  const effectiveRoles = new Set<string>();
  let maxHierarchy = 999; // lower numbers are superior

  // 1. Helper function to recursively resolve roles and inherited roles
  async function processRole(role: any) {
    if (!role) return;
    const roleSlug = role.slug.toLowerCase();
    if (effectiveRoles.has(roleSlug)) return;

    effectiveRoles.add(roleSlug);
    if (role.hierarchyLevel < maxHierarchy) {
      maxHierarchy = role.hierarchyLevel;
    }

    // Add permissions of this role
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((perm: any) => {
        if (perm && perm.resource && perm.action) {
          effectivePermissions.add(permissionKey(perm.resource, perm.action));
        } else if (typeof perm === 'string') {
          // Fallback if permission keys are stored as raw strings
          effectivePermissions.add(perm.toLowerCase());
        }
      });
    }

    // Process inherited roles recursively
    if (role.inheritedRoles && role.inheritedRoles.length > 0) {
      const populatedRole = await Role.findById(role._id).populate({
        path: 'inheritedRoles',
        model: Role,
        populate: {
          path: 'permissions',
          model: Permission,
        },
      });
      if (populatedRole && populatedRole.inheritedRoles) {
        for (const inherited of populatedRole.inheritedRoles) {
          await processRole(inherited);
        }
      }
    }
  }

  // A. Process direct roles tied to User document
  if (user.roles && Array.isArray(user.roles)) {
    for (const r of user.roles) {
      await processRole(r);
    }
  }

  // B. Process role assignments via RoleAssignment model (for granular workspace/dept scopes)
  const assignments = await RoleAssignment.find({ userId, companyId }).populate({
    path: 'roleId',
    model: Role,
    populate: {
      path: 'permissions',
      model: Permission,
    },
  });

  for (const assign of assignments) {
    if (assign.roleId) {
      await processRole(assign.roleId);
    }
  }

  // C. Cache resolved details
  const result = {
    permissions: effectivePermissions,
    roles: effectiveRoles,
    maxHierarchy,
  };

  permissionCache.set(cacheKey, {
    ...result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

/**
 * Centrally validates if a user has permission to perform an action on a resource
 */
export async function can(
  userSession: { id: string; companyId: string; roles?: string[]; permissions?: string[] },
  action: string,
  resource: string,
  contextData: {
    ownerId?: string | Types.ObjectId;
    userId?: string | Types.ObjectId;
    companyId?: string | Types.ObjectId;
    workspaceId?: string | Types.ObjectId;
    departmentId?: string | Types.ObjectId;
    [key: string]: any;
  } = {}
): Promise<boolean> {
  const userId = userSession.id;
  const companyId = userSession.companyId;

  // 1. Strict Tenant Isolation Check
  if (contextData.companyId && contextData.companyId.toString() !== companyId) {
    console.warn(`[AUTH SECURITY ENFORCER] Blocked cross-tenant access attempt by user ${userId}`);
    return false;
  }

  // Warm-up database & load resolved context
  const authContext = await resolveUserAuthContext(userId, companyId);
  const normalizedResource = resource.toLowerCase();
  const normalizedAction = action.toLowerCase();

  // 2. DENY OVERRIDES: Check dynamic AuthorizationPolicies for matching deny rules
  const policies = await AuthorizationPolicy.find({
    $or: [{ companyId: null }, { companyId }],
    resource: normalizedResource,
    enabled: true,
  }).sort({ priority: 1 }); // Evaluate higher priority policies first

  for (const policy of policies) {
    const isActionMatch = policy.actions.includes('*') || policy.actions.includes(normalizedAction);
    if (!isActionMatch) continue;

    // Evaluate policy conditions (e.g. ownership checks, department checks)
    let isConditionSatisfied = true;
    if (policy.conditions) {
      const conditions = policy.conditions as Record<string, any>;

      // Self-Ownership check
      if (conditions.isOwner) {
        const targetOwnerId = (contextData.ownerId || contextData.userId)?.toString();
        if (targetOwnerId !== userId) {
          isConditionSatisfied = false;
        }
      }

      // Department Match check
      if (conditions.departmentMatch) {
        const targetDeptId = contextData.departmentId?.toString();
        const userAssignments = await RoleAssignment.find({ userId, companyId });
        const hasDeptAssignment = userAssignments.some(
          (a) => a.departmentId?.toString() === targetDeptId
        );
        if (!hasDeptAssignment) {
          isConditionSatisfied = false;
        }
      }

      // Workspace Match check
      if (conditions.workspaceMatch) {
        const targetWorkspaceId = contextData.workspaceId?.toString();
        const userAssignments = await RoleAssignment.find({ userId, companyId });
        const hasWorkspaceAssignment = userAssignments.some(
          (a) => a.workspaceId?.toString() === targetWorkspaceId
        );
        if (!hasWorkspaceAssignment) {
          isConditionSatisfied = false;
        }
      }
    }

    if (isConditionSatisfied) {
      if (policy.effect === 'deny') {
        console.warn(
          `[AUTH POLICY ENFORCER] Deny policy matched. Blocking ${userId} from ${normalizedAction} on ${normalizedResource}`
        );
        return false; // Instant rejection (deny override)
      }
      if (policy.effect === 'allow') {
        return true; // Instant approval
      }
    }
  }

  // 3. Super Admin Wildcard Bypass
  if (authContext.roles.has('super-admin') || authContext.permissions.has('*:manage')) {
    return true;
  }

  // 4. Standard Permission check (with wildcard supports)
  const hasDirectPermission =
    authContext.permissions.has('*:manage') ||
    authContext.permissions.has(`${normalizedResource}:manage`) ||
    authContext.permissions.has(`*:${normalizedAction}`) ||
    authContext.permissions.has(permissionKey(normalizedResource, normalizedAction));

  if (hasDirectPermission) {
    return true;
  }

  return false;
}

/**
 * Central hasRole function
 */
export async function hasRoleCheck(
  userId: string,
  companyId: string,
  requiredRoles: string[]
): Promise<boolean> {
  const authContext = await resolveUserAuthContext(userId, companyId);
  const normalizedRequired = requiredRoles.map((r) => r.toLowerCase());
  return requiredRoles.some((r) => authContext.roles.has(r.toLowerCase()));
}

/**
 * Checks if user is permitted to view a specific Workspace
 */
export async function canAccessWorkspace(
  userSession: { id: string; companyId: string },
  workspaceId: string
): Promise<boolean> {
  const authContext = await resolveUserAuthContext(userSession.id, userSession.companyId);

  // Super admins have global access
  if (authContext.roles.has('super-admin') || authContext.roles.has('admin')) {
    return true;
  }

  const assignments = await RoleAssignment.find({
    userId: userSession.id,
    companyId: userSession.companyId,
    workspaceId,
  });

  return assignments.length > 0;
}

/**
 * Checks if user is permitted to view a specific Department
 */
export async function canAccessDepartment(
  userSession: { id: string; companyId: string },
  departmentId: string
): Promise<boolean> {
  const authContext = await resolveUserAuthContext(userSession.id, userSession.companyId);

  if (
    authContext.roles.has('super-admin') ||
    authContext.roles.has('admin') ||
    authContext.roles.has('hr-manager')
  ) {
    return true;
  }

  const assignments = await RoleAssignment.find({
    userId: userSession.id,
    companyId: userSession.companyId,
    departmentId,
  });

  return assignments.length > 0;
}
