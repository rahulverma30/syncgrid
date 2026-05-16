import { NextResponse } from 'next/server';
import { AuthError, PermissionError } from './errors';
import { requireApiAuth, requirePermission, requireRole } from './session';

/**
 * API Error Response Handler
 * Converts errors to proper HTTP responses
 */
export function apiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.code,
        message: error.message,
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong.',
    },
    { status: 500 }
  );
}

/**
 * Higher-order function: Protect API route with authentication
 * Usage: export const GET = withApiAuth(async (req, ctx, session) => {...})
 */
export function withApiAuth(handler: Function) {
  return async function guardedHandler(request: Request, context: any) {
    try {
      const session = await requireApiAuth();
      return handler(request, context, session);
    } catch (error) {
      return apiError(error);
    }
  };
}

/**
 * Higher-order function: Protect API route with permission check
 * Usage: export const POST = withApiPermission('users', 'create', async (req, ctx, session) => {...})
 */
export function withApiPermission(resource: string, action: string, handler: Function) {
  return async function guardedHandler(request: Request, context: any) {
    try {
      const session = await requirePermission(resource, action);
      return handler(request, context, session);
    } catch (error) {
      return apiError(error);
    }
  };
}

/**
 * Higher-order function: Protect API route with role requirement
 * Usage: export const DELETE = withApiRole(['admin', 'super_admin'], async (req, ctx, session) => {...})
 */
export function withApiRole(roles: string[], handler: Function) {
  return async function guardedHandler(request: Request, context: any) {
    try {
      const session = await requireRole(roles);
      return handler(request, context, session);
    } catch (error) {
      return apiError(error);
    }
  };
}

/**
 * Validate JSON request body against schema
 * Returns parsed data or error response
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: any // Zod schema
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            details: parsed.error.flatten(),
          },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Standardized API response wrapper
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Standardized API error response
 */
export function apiErrorResponse(error: string, message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    { status }
  );
}
