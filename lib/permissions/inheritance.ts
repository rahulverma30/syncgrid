/**
 * Enterprise Hierarchical Permission Inheritance Engine
 * Computes cascading visibility, resolved group overrides, and provides a permission simulation audit mode.
 */

export type PermissionLevel = 'admin' | 'write' | 'read' | 'none';

export interface UserContext {
  id: string;
  roles: string[];
  department?: string;
  groups?: string[];
}

export interface SecurityAsset {
  _id: string;
  ownerId: string | { _id: string };
  visibility: 'public' | 'internal' | 'private' | 'restricted';
  collaborators?: Array<string | { _id: string }>;
  parentDocumentId?: string | any;
  spaceId?: any;
}

export interface PermissionAuditStep {
  checkpoint: string;
  decision: string;
  resultLevel: PermissionLevel;
}

export class PermissionInheritanceEngine {
  /**
   * Computes the absolute, effective permission rights for a user against a target document asset.
   */
  public static computeEffectivePermission(
    user: UserContext,
    document: SecurityAsset,
    spaceContext?: { visibility: string; allowedGroups?: string[] },
    parentDocumentContext?: SecurityAsset
  ): { level: PermissionLevel; auditTrail: PermissionAuditStep[] } {
    const auditTrail: PermissionAuditStep[] = [];
    const userId = typeof user.id === 'object' ? String((user as any).id) : user.id;
    const docOwnerId =
      typeof document.ownerId === 'object'
        ? String(document.ownerId._id || document.ownerId)
        : String(document.ownerId);

    // Helper to log decision path
    const trace = (checkpoint: string, decision: string, level: PermissionLevel) => {
      auditTrail.push({ checkpoint, decision, resultLevel: level });
    };

    // 1. Super Admin / Admin Override Gate (Always Admin rights)
    const isAdmin = user.roles.some(
      (role) => role.toLowerCase() === 'admin' || role.toLowerCase() === 'super admin'
    );
    if (isAdmin) {
      trace('RBAC Gate', 'User holds administrative credentials.', 'admin');
      return { level: 'admin', auditTrail };
    }

    // 2. Ownership Check
    const isOwner = userId === docOwnerId;
    if (isOwner) {
      trace('Asset Ownership', 'User is the registered owner of this document.', 'admin');
      return { level: 'admin', auditTrail };
    }

    // 3. Parent Cascading Inheritance Check
    // If parent context is restricted or private, propagate restriction down
    if (parentDocumentContext) {
      const parentResult = this.computeEffectivePermission(user, parentDocumentContext);
      if (parentResult.level === 'none') {
        trace(
          'Inherited Gate',
          `Cascaded restriction from parent page (${parentDocumentContext._id})`,
          'none'
        );
        return { level: 'none', auditTrail };
      }
    }

    // 4. Document-Level Visibility Rules
    switch (document.visibility) {
      case 'private':
        // Only owner & admin get access. Since owner check passed, others get none.
        trace('Private Lock', 'Access strictly restricted to asset owner.', 'none');
        return { level: 'none', auditTrail };

      case 'restricted':
        // Only explicitly listed collaborators have access
        const isCollaborator = (document.collaborators || []).some((c) => {
          const cid = typeof c === 'object' ? String((c as any)._id || c) : String(c);
          return cid === userId;
        });

        if (isCollaborator) {
          trace(
            'Collaborator Match',
            'User is explicitly added as an active collaborator.',
            'write'
          );
          return { level: 'write', auditTrail };
        }

        trace('Restricted Boundary', 'User is not listed in document collaborators.', 'none');
        return { level: 'none', auditTrail };

      case 'internal':
        // Any tenant employee can read. Write if in the space group overrides.
        if (spaceContext && spaceContext.allowedGroups && user.groups) {
          const inGroup = spaceContext.allowedGroups.some((g) => user.groups!.includes(g));
          if (inGroup) {
            trace('Internal Share', 'Company user matched Wiki Space group overrides.', 'write');
            return { level: 'write', auditTrail };
          }
        }
        trace('Internal Share', 'Company employee read-only baseline access.', 'read');
        return { level: 'read', auditTrail };

      case 'public':
        trace('Public Domain', 'Free document view rights.', 'read');
        return { level: 'read', auditTrail };

      default:
        trace('System Fallback', 'Undefined visibility schema, defaulted to secure lock.', 'none');
        return { level: 'none', auditTrail };
    }
  }

  /**
   * Simulation mode: Predicts hypothetical access permission mappings
   */
  public static simulate(
    document: SecurityAsset,
    simulatedUser: UserContext,
    parentContext?: SecurityAsset
  ): { permitted: boolean; level: PermissionLevel; path: PermissionAuditStep[] } {
    const { level, auditTrail } = this.computeEffectivePermission(
      simulatedUser,
      document,
      undefined,
      parentContext
    );

    return {
      permitted: level !== 'none',
      level,
      path: auditTrail,
    };
  }
}
