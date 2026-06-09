/**
 * SyncGrid — Backend API Error Sanitizer
 *
 * This is the single source of truth for all API error responses.
 * ALL catch blocks in API routes must call `sanitizeApiError(error)`
 * instead of `message: error.message`.
 *
 * Users should NEVER see:
 *  - Stack traces
 *  - Mongoose validation details
 *  - Database error codes
 *  - Internal implementation details
 */

import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────
// Error type detection helpers
// ─────────────────────────────────────────────

function isMongooseValidationError(error: any): boolean {
  return error?.name === 'ValidationError' && error?.errors !== undefined;
}

function isMongooseCastError(error: any): boolean {
  return error?.name === 'CastError';
}

function isMongoServerDuplicate(error: any): boolean {
  return error?.name === 'MongoServerError' && error?.code === 11000;
}

function isAuthError(error: any): boolean {
  return error?.name === 'AuthError' || error?.name === 'PermissionError';
}

// ─────────────────────────────────────────────
// Friendly message resolver
// ─────────────────────────────────────────────

export interface SanitizedError {
  error: string;
  message: string;
  status: number;
}

export function sanitizeApiError(error: any): SanitizedError {
  // Auth / Permission errors
  if (isAuthError(error)) {
    if (error.status === 401) {
      return {
        error: 'UNAUTHORIZED',
        message: 'Your session has expired. Please sign in again.',
        status: 401,
      };
    }
    return {
      error: 'FORBIDDEN',
      message:
        "You don't have permission to perform this action. Contact your administrator if you believe this is incorrect.",
      status: 403,
    };
  }

  // Mongoose duplicate key (e.g., unique email, unique name)
  if (isMongoServerDuplicate(error)) {
    // Extract the duplicate field name if available
    const keyPattern = error.keyPattern ? Object.keys(error.keyPattern)[0] : null;
    const fieldLabel = keyPattern ? ` (${keyPattern})` : '';
    return {
      error: 'DUPLICATE_ERROR',
      message: `A record with this ${fieldLabel || 'value'} already exists. Please use a different value and try again.`,
      status: 409,
    };
  }

  // Mongoose CastError (invalid ObjectId, wrong data type, etc.)
  if (isMongooseCastError(error)) {
    return {
      error: 'INVALID_ID',
      message: "We couldn't find the item you're looking for. It may have been deleted or moved.",
      status: 400,
    };
  }

  // Mongoose ValidationError (required fields, enum values, min/max, etc.)
  if (isMongooseValidationError(error)) {
    // Extract the first validation message and clean it up
    const firstKey = Object.keys(error.errors)[0];
    const firstError = error.errors[firstKey];

    let friendlyMessage =
      'The form contains invalid values. Please review your entries and try again.';

    if (firstError?.kind === 'required') {
      const field = firstError.path
        ? firstError.path.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())
        : 'A required field';
      friendlyMessage = `${field} is required. Please fill in all required fields before saving.`;
    } else if (firstError?.kind === 'enum') {
      friendlyMessage =
        'One of the selected options is no longer valid. Please refresh the page and try again.';
    } else if (firstError?.kind === 'min' || firstError?.kind === 'max') {
      friendlyMessage = 'A value is outside the allowed range. Please adjust and try again.';
    }

    return {
      error: 'VALIDATION_ERROR',
      message: friendlyMessage,
      status: 422,
    };
  }

  // Network / connection errors
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    return {
      error: 'CONNECTION_ERROR',
      message: "We couldn't connect to the database. Please try again in a few moments.",
      status: 503,
    };
  }

  // Default — generic server error (never expose details)
  return {
    error: 'SERVER_ERROR',
    message:
      'Something went wrong on our end. Please try again in a few moments. If the problem persists, contact support.',
    status: 500,
  };
}

// ─────────────────────────────────────────────
// Convenience: Build a NextResponse from a sanitized error
// ─────────────────────────────────────────────

export function apiErrorResponse(error: any): NextResponse {
  const sanitized = sanitizeApiError(error);
  return NextResponse.json(
    {
      success: false,
      error: sanitized.error,
      message: sanitized.message,
    },
    { status: sanitized.status }
  );
}

// ─────────────────────────────────────────────
// Convenience: Build friendly "not found" response
// ─────────────────────────────────────────────

export function notFoundResponse(resource = 'record'): NextResponse {
  const label = resource.charAt(0).toUpperCase() + resource.slice(1);
  return NextResponse.json(
    {
      success: false,
      error: 'NOT_FOUND',
      message: `${label} not available. It may have been deleted or moved. Try refreshing the page.`,
    },
    { status: 404 }
  );
}

// ─────────────────────────────────────────────
// Convenience: Build forbidden response
// ─────────────────────────────────────────────

export function forbiddenResponse(action = 'this action'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'FORBIDDEN',
      message: `You don't have permission to perform ${action}. Contact your administrator if you believe this is incorrect.`,
    },
    { status: 403 }
  );
}
