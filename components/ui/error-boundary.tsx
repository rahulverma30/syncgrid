/**
 * Error boundary component
 * Catch errors and display fallback UI
 */

'use client';

import React from 'react';
import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNotificationStore } from '@/store';

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
    try {
      // Add a toast notification for the error and avoid rendering the error card
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Something went wrong',
        message: error.message,
        duration: 5000,
      });
    } catch (e) {
      // ignore errors from notification system
    }
  }

  render() {
    if (this.state.hasError) {
      // Do not render the error card here; the error is surfaced via toast only.
      return null;
    }

    return this.props.children;
  }
}
