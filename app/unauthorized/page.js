import { Button } from '@/components/ui';
import Link from 'next/link';

/**
 * Unauthorized page - shown when user lacks required permissions
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9 9 0 1119.02 12a9 9 0 01-11.94-5.53"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>

        {/* Description */}
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          You don&apos;t have permission to access this resource. If you believe this is an error,
          please contact your administrator.
        </p>

        {/* Status Code */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-sm">
            403 Forbidden
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
