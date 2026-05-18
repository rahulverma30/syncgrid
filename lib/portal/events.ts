import { EventEmitter } from 'events';

class PortalEventEmitter extends EventEmitter {}

// Create a single global emitter instance
const globalForEvents = global as unknown as { portalEventEmitter?: PortalEventEmitter };

export const portalEventEmitter = globalForEvents.portalEventEmitter || new PortalEventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.portalEventEmitter = portalEventEmitter;
}

/**
 * Common dispatch function for portal updates.
 * Call this when a model updates (e.g. ticket modified, approval decision registered).
 */
export function dispatchPortalEvent(params: {
  companyId: string;
  clientId: string;
  type: 'ticket_update' | 'approval_update' | 'comment_added' | 'project_update';
  payload: any;
}) {
  portalEventEmitter.emit('portal-event', {
    companyId: params.companyId,
    clientId: params.clientId,
    type: params.type,
    payload: params.payload,
    timestamp: new Date().toISOString(),
  });
}
