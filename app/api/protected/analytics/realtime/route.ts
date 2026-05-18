import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsSnapshot, ExecutiveInsight } from '@/models';

// Set route to dynamic to avoid Next.js static page bundling optimization
export const dynamic = 'force-dynamic';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    let controllerRef: ReadableStreamDefaultController | null = null;
    let isClosed = false;

    // Construct standard EventSource SSE readable stream
    const stream = new ReadableStream({
      start(controller) {
        controllerRef = controller;
      },
      cancel() {
        isClosed = true;
      },
    });

    const encoder = new TextEncoder();

    const writeSSEEvent = (eventName: string, data: any) => {
      if (isClosed || !controllerRef) return;
      try {
        const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        controllerRef.enqueue(encoder.encode(payload));
      } catch (err) {
        // Safe channel close on transmission failure
        isClosed = true;
      }
    };

    // Immediate connection acknowledgement
    setTimeout(() => {
      writeSSEEvent('welcome', {
        message: 'Connected to SyncGrid Realtime corporate telemetry hub.',
      });
    }, 100);

    // Dynamic metrics stream loop (sends actual current values with subtle fluctuations simulating operations activity)
    const intervalId = setInterval(async () => {
      if (isClosed || !controllerRef) {
        clearInterval(intervalId);
        return;
      }

      try {
        // Fetch current snapshots and alarm records for company
        const latestSnapshot = await AnalyticsSnapshot.findOne({ companyId }).sort({
          snapshotDate: -1,
        });
        const activeInsightsCount = await ExecutiveInsight.countDocuments({
          companyId,
          isResolved: false,
        });

        if (latestSnapshot) {
          // Add micro-fluctuations simulating active invoicing and labor logging in realtime
          const microRevenueChange = (Math.random() - 0.45) * 450;
          const simulatedRevenue = Math.max(
            10000,
            latestSnapshot.revenueTotal + microRevenueChange
          );
          const simulatedProfitMargin = Math.min(
            100,
            Math.max(1, latestSnapshot.profitMargin + (Math.random() - 0.5) * 0.2)
          );

          writeSSEEvent('telemetry', {
            revenueTotal: Number(simulatedRevenue.toFixed(2)),
            profitMargin: Number(simulatedProfitMargin.toFixed(2)),
            netProfit: Number((simulatedRevenue * (simulatedProfitMargin / 100)).toFixed(2)),
            laborUtilization: Number(latestSnapshot.laborUtilization.toFixed(2)),
            overdueRatio: Number(latestSnapshot.overdueRatio.toFixed(2)),
            totalOverdue: Number(latestSnapshot.totalOverdue.toFixed(2)),
            budgetAlertsCount: activeInsightsCount,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Fail silently inside interval thread
      }
    }, 4500); // Pulse every 4.5 seconds

    // Keep-alive heartbeats thread to prevent connection drops in load balancers
    const heartbeatId = setInterval(() => {
      if (isClosed || !controllerRef) {
        clearInterval(heartbeatId);
        return;
      }
      try {
        controllerRef.enqueue(encoder.encode(': heartbeat\n\n'));
      } catch (err) {
        isClosed = true;
      }
    }, 20000);

    // Clean connection disconnect observer
    request.signal.addEventListener('abort', () => {
      isClosed = true;
      clearInterval(intervalId);
      clearInterval(heartbeatId);
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SSE_CONNECTION_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
