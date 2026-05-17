/**
 * Centralized Realtime SSE Broadcast Engine
 * Supports multi-tenant isolation, room subscriptions, and keep-alive heartbeats.
 * Native, serverless-ready, and HTTP/2 multiplexing optimized.
 */

export interface RealtimeEvent {
  companyId: string;
  projectId?: string;
  taskId?: string;
  event: string; // 'task_updated' | 'timer_synced' | 'comment_posted' | 'blocker_linked'
  payload: any;
}

interface ClientConnection {
  userId: string;
  companyId: string;
  projectId?: string;
  taskId?: string;
  controller: ReadableStreamDefaultController;
}

// In-Memory active clients registry (scales out to Redis PubSub in high-scale production)
const clientsRegistry = new Set<ClientConnection>();

/**
 * Register an active streaming connection
 */
export function registerClient(
  companyId: string,
  userId: string,
  projectId: string | null,
  taskId: string | null,
  controller: ReadableStreamDefaultController
) {
  const connection: ClientConnection = {
    companyId,
    userId,
    projectId: projectId || undefined,
    taskId: taskId || undefined,
    controller,
  };

  clientsRegistry.add(connection);

  // Send initial welcome message
  sendEventToController(controller, 'connected', { status: 'ok', userId });

  return () => {
    clientsRegistry.delete(connection);
  };
}

/**
 * Broadcast an event to appropriate rooms matching tenant isolation
 */
export function broadcastEvent(event: RealtimeEvent) {
  const dataString = JSON.stringify(event.payload);
  const formattedMsg = `event: ${event.event}\ndata: ${dataString}\n\n`;

  // Trace Observability Log
  console.log(`[SSE Broadcast] [${event.companyId}] Event: ${event.event}`);

  clientsRegistry.forEach((client) => {
    // 1. Tenant Security isolation
    if (client.companyId !== event.companyId) return;

    // 2. Room match validations (optional sub-scoping)
    if (event.projectId && client.projectId && client.projectId !== event.projectId) return;
    if (event.taskId && client.taskId && client.taskId !== event.taskId) return;

    try {
      client.controller.enqueue(new TextEncoder().encode(formattedMsg));
    } catch {
      // Clean up failed connections automatically
      clientsRegistry.delete(client);
    }
  });
}

/**
 * Send directly to a specific controller
 */
function sendEventToController(
  controller: ReadableStreamDefaultController,
  event: string,
  payload: any
) {
  try {
    const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    controller.enqueue(new TextEncoder().encode(msg));
  } catch (err) {
    console.error('Failed to send event to client controller:', err);
  }
}

// Keep-alive heartbeat loop to prevent HTTP proxy drops (e.g. Nginx, Vercel timeouts) every 25 seconds
if (typeof global !== 'undefined') {
  const globalAny = global as any;
  if (!globalAny.__sseHeartbeatInterval__) {
    globalAny.__sseHeartbeatInterval__ = setInterval(() => {
      const pingMsg = new TextEncoder().encode(':\n\n'); // SSE Comment heartbeat
      clientsRegistry.forEach((client) => {
        try {
          client.controller.enqueue(pingMsg);
        } catch {
          clientsRegistry.delete(client);
        }
      });
    }, 25000);
  }
}
