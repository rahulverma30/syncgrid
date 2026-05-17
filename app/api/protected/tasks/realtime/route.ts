import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { registerClient } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  const companyId = session.user.companyId;
  const userId = session.user.id;

  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const taskId = url.searchParams.get('taskId');

  let cleanup: () => void;

  const stream = new ReadableStream({
    start(controller) {
      cleanup = registerClient(companyId, userId, projectId, taskId, controller);
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
    },
  });
});
