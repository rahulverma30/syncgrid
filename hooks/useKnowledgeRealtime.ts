import { useEffect, useRef } from 'react';
import { useKnowledgeStore } from '@/store';
import { toast } from 'sonner';

/**
 * Resilient Collaborative Real-Time SSE Transport Listener
 * Handles scoped workspace updates, dynamic page syncs, comments notifications,
 * and compliance milestones broadcasts.
 */
export function useKnowledgeRealtime(companyId: string | undefined) {
  const {
    fetchSpaces,
    fetchDocuments,
    fetchAnalytics,
    activeDocument,
    setActiveDocument,
    activeSpaceId,
    documents,
  } = useKnowledgeStore();

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const cleanupEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!companyId) return;

    const establishConnection = () => {
      cleanupEventSource();

      const es = new EventSource('/api/protected/tasks/realtime');
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.companyId !== companyId) return;

          const { event: sseEvent, payload } = parsed;

          if (sseEvent === 'document_created') {
            if (activeSpaceId && payload.spaceId === activeSpaceId) {
              fetchDocuments(activeSpaceId);
            }
            toast.info(`New page created: "${payload.title}"`);
          } else if (sseEvent === 'document_updated') {
            // Update active document details if currently viewing the modified document
            if (activeDocument?._id === payload._id) {
              setActiveDocument(payload);
              toast.success(`Page "${payload.title}" updated by another user`);
            }
            if (activeSpaceId && payload.spaceId === activeSpaceId) {
              fetchDocuments(activeSpaceId);
            }
          } else if (sseEvent === 'document_deleted') {
            if (activeDocument?._id === payload.documentId) {
              setActiveDocument(null);
              toast.error('The document you are viewing was deleted');
            }
            if (activeSpaceId) {
              fetchDocuments(activeSpaceId);
            }
          } else if (sseEvent === 'document_progress_submitted') {
            if (activeDocument?._id === payload.documentId) {
              fetchAnalytics();
            }
          } else if (sseEvent === 'knowledge_space_added') {
            fetchSpaces();
          }
        } catch (err) {
          console.error('[KNOWLEDGE_SSE] Parse error:', err);
        }
      };

      es.onerror = () => {
        cleanupEventSource();
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          establishConnection();
        }, 3000);
      };
    };

    establishConnection();

    return () => {
      cleanupEventSource();
    };
  }, [companyId, activeSpaceId, activeDocument?._id]);
}
