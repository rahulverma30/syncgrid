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

  // 1. Fetch all system roles and company-scoped roles in a single database query with populated permissions
  const allRoles = await Role.find({
    $or: [{ companyId: null }, { companyId }],
  })
    .populate({
      path: 'permissions',
      model: Permission,
    })
    .lean();

  const rolesMap = new Map<string, any>();
  for (const role of allRoles) {
    rolesMap.set(role._id.toString(), role);
  }

  // 2. Fetch user's direct role IDs
  const user = await User.findById(userId).select('roles').lean();
  if (!user) {
    return { permissions: new Set(), roles: new Set(), maxHierarchy: 999 };
  }

  // 3. Fetch user's assigned roles via RoleAssignment model (for granular workspace/dept scopes)
  const assignments = await RoleAssignment.find({ userId, companyId }).select('roleId').lean();

  const effectivePermissions = new Set<string>();
  const effectiveRoles = new Set<string>();
  let maxHierarchy = 999; // lower numbers are superior
  const processedRoleIds = new Set<string>();

  // 4. In-memory recursive resolution (sub-1ms execution)
  function processRole(roleIdOrObj: any) {
    if (!roleIdOrObj) return;
    const roleId = (roleIdOrObj._id || roleIdOrObj).toString();
    if (processedRoleIds.has(roleId)) return;
    processedRoleIds.add(roleId);

    const role = rolesMap.get(roleId);
    if (!role) return;

    const roleSlug = role.slug?.toLowerCase();
    if (roleSlug) {
      effectiveRoles.add(roleSlug);
    }
    if (role.hierarchyLevel !== undefined && role.hierarchyLevel < maxHierarchy) {
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

    // Process inherited roles recursively in memory
    if (role.inheritedRoles && Array.isArray(role.inheritedRoles)) {
      for (const inherited of role.inheritedRoles) {
        processRole(inherited);
      }
    }
  }

  // A. Process direct roles tied to User document
  if (user.roles && Array.isArray(user.roles)) {
    for (const r of user.roles) {
      processRole(r);
    }
  }

  // B. Process role assignments via RoleAssignment model (for granular workspace/dept scopes)
  for (const assign of assignments) {
    if (assign.roleId) {
      processRole(assign.roleId);
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
  const policyCacheKey = `policies:${companyId}:${normalizedResource}`;
  let policies: any[] = [];
  const cachedPolicies = permissionCache.get(policyCacheKey);
  if (cachedPolicies && Date.now() < cachedPolicies.expiresAt) {
    policies = cachedPolicies.policies as any[];
  } else {
    policies = await AuthorizationPolicy.find({
      $or: [{ companyId: null }, { companyId }],
      resource: normalizedResource,
      enabled: true,
    })
      .sort({ priority: 1 })
      .lean(); // Added lean() for performance
    permissionCache.set(policyCacheKey, { policies, expiresAt: Date.now() + CACHE_TTL_MS } as any);
  }

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

      // Memoize userAssignments to prevent N+1 query loops
      let userAssignments: any[] | null = null;
      const getUserAssignments = async () => {
        if (!userAssignments) {
          userAssignments = await RoleAssignment.find({ userId, companyId }).lean();
        }
        return userAssignments;
      };

      // Department Match check
      if (conditions.departmentMatch) {
        const targetDeptId = contextData.departmentId?.toString();
        const assignments = await getUserAssignments();
        const hasDeptAssignment = assignments.some(
          (a) => a.departmentId?.toString() === targetDeptId
        );
        if (!hasDeptAssignment) {
          isConditionSatisfied = false;
        }
      }

      // Workspace Match check
      if (conditions.workspaceMatch) {
        const targetWorkspaceId = contextData.workspaceId?.toString();
        const assignments = await getUserAssignments();
        const hasWorkspaceAssignment = assignments.some(
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
