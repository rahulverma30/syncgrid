/**
 * Error boundary component — Premium fallback UI
 * Catches runtime errors and surfaces a design-consistent recovery screen.
 */

'use client';

import React from 'react';
import { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional module name shown in the error card */
  moduleName?: string;
  /** Custom fallback — overrides the default premium error UI */
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-5 p-8 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-sm font-bold text-foreground">
              {this.props.moduleName ? `${this.props.moduleName} — ` : ''}Module Error
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected error occurred while rendering this module. This has been logged
              automatically.
            </p>
            {this.state.error && (
              <code className="block mt-2 text-[10px] text-destructive/80 bg-destructive/10 rounded-md px-3 py-2 font-mono text-left truncate max-w-xs">
                {this.state.error.message}
              </code>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
