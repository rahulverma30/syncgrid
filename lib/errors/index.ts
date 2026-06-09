/**
 * SyncGrid Error System — Public API
 *
 * Import from here in all files:
 *
 * Backend API routes:
 *   import { apiErrorResponse, notFoundResponse } from '@/lib/errors';
 *
 * Frontend pages/components:
 *   import { getClientError, getNetworkError, SUCCESS_MESSAGES, EMPTY_STATES } from '@/lib/errors';
 */

// Backend utilities
export {
  apiErrorResponse,
  notFoundResponse,
  forbiddenResponse,
  sanitizeApiError,
} from './apiErrors';
export type { SanitizedError } from './apiErrors';

// Frontend utilities
export { getClientError, getNetworkError, SUCCESS_MESSAGES, EMPTY_STATES } from './clientErrors';
export type { ClientError, ApiResponse, EmptyStateKey } from './clientErrors';
