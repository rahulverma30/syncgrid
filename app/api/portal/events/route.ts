import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/auth/portal';
import { portalEventEmitter } from '@/lib/portal/events';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { clientId, companyId } = session.user;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // 1. Listen for dynamic event emissions
        const onPortalEvent = (event: any) => {
          if (event.companyId === companyId && event.clientId === clientId) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch (err) {
              console.error('SSE Stream enqueue failed:', err);
            }
          }
        };

        portalEventEmitter.on('portal-event', onPortalEvent);

        // 2. Setup periodic keep-alive heartbeats (every 15 seconds)
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (err) {
            console.error('Heartbeat enqueue failed:', err);
          }
        }, 15000);

        // 3. Clear listeners when the stream aborts
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAliveInterval);
          portalEventEmitter.off('portal-event', onPortalEvent);
          try {
            controller.close();
          } catch (err) {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('SSE stream connection error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'SERVER_ERROR', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
