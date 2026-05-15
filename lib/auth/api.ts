import { NextResponse } from 'next/server';
import { AuthError } from './errors';
import { requireApiAuth, requirePermission } from './session';

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
