import { useEffect, useRef } from 'react';
import { useCommunicationStore } from '@/store';
import { toast } from 'sonner';

/**
 * Resilient Realtime SSE Transport Hook
 * Handles multi-tenant scoped EventSource streams, exponential reconnection backoffs,
 * heartbeat silence detectors, stale connection purges, and duplicate event deduplication.
 */
export function useRealtime(
  companyId: string | undefined,
  activeChannelId: string | null,
  activeConversationId: string | null
) {
  const {
    addMessage,
    updateMessage,
    deleteMessage,
    updatePresence,
    announcements,
    setAnnouncements,
    setUserTyping,
  } = useCommunicationStore();

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatTimeoutRef = useRef<any>(null);
  const retryDelayRef = useRef<number>(1000); // Start reconnect retry delay at 1s
  const processedEventIdsRef = useRef<Set<string>>(new Set()); // Rolling event deduplication filter

  const cleanupEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!companyId) return;

    const establishConnection = () => {
      // 1. Stale connection cleanup
      cleanupEventSource();

      console.log(`[REALTIME_SSE] Connecting to stream with delay ${retryDelayRef.current}ms...`);

      const es = new EventSource('/api/protected/tasks/realtime');
      eventSourceRef.current = es;

      // Reset heartbeat timeout monitor on initialization
      resetHeartbeatMonitor();

      es.onopen = () => {
        console.log('[REALTIME_SSE] Connection established successfully.');
        retryDelayRef.current = 1000; // Reset exponential backoff retry delay on successful link
        resetHeartbeatMonitor();
      };

      es.onmessage = (event) => {
        // Reset heartbeat timer on any active stream data
        resetHeartbeatMonitor();

        try {
          const parsed = JSON.parse(event.data);

          // Tenant protection guard
          if (parsed.companyId !== companyId) return;

          const { event: sseEvent, payload } = parsed;

          // Duplicate event deduplication filter
          const uniqueEventKey = `${sseEvent}_${payload._id || payload.messageId || payload.userId || Date.now()}`;
          if (processedEventIdsRef.current.has(uniqueEventKey)) {
            console.warn('[REALTIME_SSE] Prevented duplicate event trigger:', uniqueEventKey);
            return;
          }
          // Maintain a sliding rolling cache of the last 100 event IDs
          processedEventIdsRef.current.add(uniqueEventKey);
          if (processedEventIdsRef.current.size > 100) {
            const firstKey = processedEventIdsRef.current.values().next().value;
            if (firstKey) processedEventIdsRef.current.delete(firstKey);
          }

          // Process unified state actions
          if (sseEvent === 'message_posted') {
            if (
              (activeChannelId && payload.channelId === activeChannelId) ||
              (activeConversationId && payload.conversationId === activeConversationId)
            ) {
              addMessage(payload);
            }
          } else if (sseEvent === 'message_updated') {
            updateMessage(payload._id, payload);
          } else if (sseEvent === 'message_deleted') {
            deleteMessage(payload._id);
          } else if (sseEvent === 'presence_updated') {
            updatePresence(payload.userId, payload.status);
          } else if (sseEvent === 'announcement_posted') {
            setAnnouncements([payload, ...announcements]);
          } else if (sseEvent === 'message_reaction_toggled') {
            updateMessage(payload.messageId, { reactions: payload.reactions });
          } else if (sseEvent === 'user_typing_update') {
            setUserTyping(payload.userId, payload.isTyping);
          }
        } catch (err) {
          console.error('[REALTIME_SSE] Payload parsing failed:', err);
        }
      };

      es.onerror = () => {
        console.warn('[REALTIME_SSE] Stream connection dropped. Initializing recovery...');
        triggerReconnection();
      };
    };

    const triggerReconnection = () => {
      cleanupEventSource();

      // Exponential backoff reconnect: double the backoff, capped at 30 seconds
      const currentDelay = retryDelayRef.current;
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        establishConnection();
      }, currentDelay);
    };

    const resetHeartbeatMonitor = () => {
      if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);

      // Heartbeat timeout loop: if no stream events for 35s, assume silent failure and restart
      heartbeatTimeoutRef.current = setTimeout(() => {
        console.warn('[REALTIME_SSE] Heartbeat silent for 35s. Purging stale connection...');
        toast.error('Real-time connection lost. Reconnecting...');
        triggerReconnection();
      }, 35000);
    };

    establishConnection();

    return () => {
      cleanupEventSource();
    };
  }, [
    companyId,
    activeChannelId,
    activeConversationId,
    addMessage,
    updateMessage,
    deleteMessage,
    updatePresence,
    announcements,
    setAnnouncements,
    setUserTyping,
  ]);
}
