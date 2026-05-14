/**
 * Error boundary component
 * Catch errors and display fallback UI
 */

'use client';

import React from 'react';
import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Something went wrong</h3>
              <p className="mt-1 text-sm text-destructive/80">{this.state.error?.message}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
