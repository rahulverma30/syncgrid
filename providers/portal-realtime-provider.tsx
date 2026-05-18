'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

interface RealtimeContextProps {
  lastEvent: any | null;
  registerListener: (type: string, callback: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextProps | undefined>(undefined);

export function PortalRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const listenersRef = useRef<{ [type: string]: Array<(payload: any) => void> }>({});

  const registerListener = (type: string, callback: (payload: any) => void) => {
    if (!listenersRef.current[type]) {
      listenersRef.current[type] = [];
    }
    listenersRef.current[type].push(callback);

    // Return clean cleanup function
    return () => {
      listenersRef.current[type] = listenersRef.current[type].filter((cb) => cb !== callback);
    };
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let failureCount = 0;

    const connectSSE = () => {
      if (typeof window === 'undefined') return;

      if (!window.EventSource) {
        startFallbackPolling();
        return;
      }

      eventSource = new EventSource('/api/portal/events');

      eventSource.onopen = () => {
        failureCount = 0;
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      eventSource.onmessage = (event) => {
        // Heartbeats might be sent as empty data or keep-alive comments
        if (!event.data || event.data === 'heartbeat') return;

        try {
          const parsed = JSON.parse(event.data);
          setLastEvent(parsed);

          // Alert user via Toast Notification
          showEventToast(parsed);

          // Dispatch to specific listeners registered by active pages
          if (listenersRef.current[parsed.type]) {
            listenersRef.current[parsed.type].forEach((callback) => {
              try {
                callback(parsed.payload);
              } catch (e) {
                console.error('Error in registered realtime event listener:', e);
              }
            });
          }
        } catch (error) {
          console.error('Failed to parse SSE payload:', error);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('SSE Connection dropped. Reconnecting...', err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        failureCount++;
        if (failureCount >= 3) {
          // If SSE keeps failing, transition to polling fallback to protect user experience
          startFallbackPolling();
        } else {
          // Reconnect with incremental backoff delay
          reconnectTimeout = setTimeout(connectSSE, Math.min(5000, failureCount * 1000));
        }
      };
    };

    const startFallbackPolling = () => {
      if (fallbackInterval) return;
      console.info('Starting client-side 5-second polling fallback.');

      fallbackInterval = setInterval(() => {
        // Dispatch generic tick event to prompt pages to pull updates
        const pollEvent = { type: 'poll_tick', payload: {}, timestamp: new Date().toISOString() };
        setLastEvent(pollEvent);

        if (listenersRef.current['poll_tick']) {
          listenersRef.current['poll_tick'].forEach((cb) => cb({}));
        }
      }, 5000);
    };

    const showEventToast = (event: any) => {
      const type = event.type;
      const payload = event.payload;

      switch (type) {
        case 'ticket_update':
          toast.info(
            `Support Ticket Update: "${payload.title}" status changed to ${payload.status}`
          );
          break;
        case 'approval_update':
          if (payload.status === 'approved') {
            toast.success(`Approval Completed: "${payload.title}" is signed off.`);
          } else if (payload.status === 'revision_requested') {
            toast.warning(`Revisions Requested: "${payload.title}" needs adjustments.`);
          } else {
            toast.info(`New Review Request: "${payload.title}" requires your approval.`);
          }
          break;
        case 'comment_added':
          toast.message(`New Discussion comment from ${payload.userName}`);
          break;
        case 'project_update':
          toast.info(`Project Notification: ${payload.message}`);
          break;
        default:
          break;
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ lastEvent, registerListener }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function usePortalRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('usePortalRealtime must be used within a PortalRealtimeProvider');
  }
  return context;
}
