import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AuthorizationPolicy, AuditLog } from '@/models';
import { hasRoleCheck } from '@/lib/auth/engine';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const policies = await AuthorizationPolicy.find({
      $or: [{ companyId: null }, { companyId }],
    })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: policies });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const headerList = await headers();
    const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'Unknown';

    const isAdmin = await hasRoleCheck(userId, companyId, [
      'super-admin',
      'admin',
      'organization-owner',
    ]);
    if (!isAdmin) {
      await AuditLog.create({
        companyId,
        actorId: userId,
        action: 'privilege_escalation_attempt',
        resource: 'policies',
        ipAddress,
        userAgent,
        status: 'failure',
        metadata: { attemptedAction: 'write_policy' },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Privileged operations require administrative access.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { policyId, enabled, name, resource, actions, conditions, effect, priority } = body;

    if (policyId) {
      const existing = await AuthorizationPolicy.findById(policyId);
      if (!existing) {
        return NextResponse.json({ success: false, message: 'Policy not found' }, { status: 404 });
      }

      if (existing.companyId && existing.companyId.toString() !== companyId.toString()) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized policy mutation' },
          { status: 403 }
        );
      }

      if (!existing.companyId) {
        // Create override copy
        const override = await AuthorizationPolicy.create({
          name: name || existing.name,
          resource: resource || existing.resource,
          actions: actions || existing.actions,
          conditions: conditions || existing.conditions,
          effect: effect || existing.effect,
          priority: priority !== undefined ? priority : existing.priority,
          enabled: enabled !== undefined ? enabled : existing.enabled,
          companyId,
          tenantAware: true,
        });

        // Write audit log
        await AuditLog.create({
          companyId,
          actorId: userId,
          action: 'create_policy_override',
          resource: 'policies',
          resourceId: override._id.toString(),
          ipAddress,
          userAgent,
          status: 'success',
          metadata: { policyName: override.name, enabled: override.enabled },
        });

        return NextResponse.json({ success: true, data: override });
      } else {
        // Update direct override
        const previousState = { enabled: existing.enabled };
        if (name) existing.name = name;
        if (resource) existing.resource = resource;
        if (actions) existing.actions = actions;
        if (conditions) existing.conditions = conditions;
        if (effect) existing.effect = effect;
        if (priority !== undefined) existing.priority = priority;
        if (enabled !== undefined) existing.enabled = enabled;

        await existing.save();

        // Write audit log
        await AuditLog.create({
          companyId,
          actorId: userId,
          action: 'update_policy',
          resource: 'policies',
          resourceId: existing._id.toString(),
          ipAddress,
          userAgent,
          status: 'success',
          metadata: {
            policyName: existing.name,
            previousState,
            newState: { enabled: existing.enabled },
          },
        });

        return NextResponse.json({ success: true, data: existing });
      }
    } else {
      if (!name || !resource || !actions || actions.length === 0) {
        return NextResponse.json(
          { success: false, message: 'name, resource, and actions are required parameters' },
          { status: 400 }
        );
      }

      const newPolicy = await AuthorizationPolicy.create({
        name,
        resource: resource.toLowerCase(),
        actions: actions.map((a: string) => a.toLowerCase()),
        conditions: conditions || {},
        effect: effect || 'allow',
        priority: priority !== undefined ? Number(priority) : 10,
        enabled: enabled !== undefined ? enabled : true,
        companyId,
        tenantAware: true,
      });

      // Write audit log
      await AuditLog.create({
        companyId,
        actorId: userId,
        action: 'create_policy',
        resource: 'policies',
        resourceId: newPolicy._id.toString(),
        ipAddress,
        userAgent,
        status: 'success',
        metadata: { policyName: name, resource, effect },
      });

      return NextResponse.json({ success: true, data: newPolicy }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
