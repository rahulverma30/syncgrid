import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import mongoose from 'mongoose';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsSnapshot, ExecutiveInsight, Transaction, Invoice, TaskTimeLog } from '@/models';

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

    // Dynamic metrics stream loop (sends actual current values from live DB metrics)
    const intervalId = setInterval(async () => {
      if (isClosed || !controllerRef) {
        clearInterval(intervalId);
        return;
      }

      try {
        // 1. Financial Performance Aggregation (Revenue vs Expenses)
        const incomeAgg = await Transaction.aggregate([
          {
            $match: {
              companyId: new mongoose.Types.ObjectId(companyId),
              type: 'income',
              status: 'cleared',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const expenseAgg = await Transaction.aggregate([
          {
            $match: {
              companyId: new mongoose.Types.ObjectId(companyId),
              type: { $in: ['expense', 'refund'] },
              status: 'cleared',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const revenueTotal = incomeAgg[0]?.total || 0;
        const expenseTotal = expenseAgg[0]?.total || 0;
        const netProfit = revenueTotal - expenseTotal;
        const profitMargin = revenueTotal > 0 ? (netProfit / revenueTotal) * 100 : 0;

        // 2. Workforce & Resource Utilization Metrics (TaskTimeLog billable ratio)
        const utilizationAgg = await TaskTimeLog.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
          {
            $group: {
              _id: null,
              totalBillableMinutes: {
                $sum: {
                  $cond: [{ $eq: ['$billable', true] }, '$durationMinutes', 0],
                },
              },
              totalMinutes: { $sum: '$durationMinutes' },
            },
          },
        ]);

        const billableMins = utilizationAgg[0]?.totalBillableMinutes || 0;
        const totalMins = utilizationAgg[0]?.totalMinutes || 0;
        const laborUtilization = totalMins > 0 ? (billableMins / totalMins) * 100 : 0;

        // 3. Overdue Invoices Receivables Calculation
        const overdueAgg = await Invoice.aggregate([
          {
            $match: {
              companyId: new mongoose.Types.ObjectId(companyId),
              isSoftDeleted: false,
              status: { $in: ['sent', 'partially_paid', 'overdue'] },
            },
          },
          {
            $group: {
              _id: null,
              outstanding: { $sum: '$outstandingAmount' },
              overdue: {
                $sum: {
                  $cond: [{ $lt: ['$dueDate', new Date()] }, '$outstandingAmount', 0],
                },
              },
            },
          },
        ]);

        const totalOutstanding = overdueAgg[0]?.outstanding || 0;
        const totalOverdue = overdueAgg[0]?.overdue || 0;
        const overdueRatio = totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;

        // 4. Budget Alerts
        const activeInsightsCount = await ExecutiveInsight.countDocuments({
          companyId,
          isResolved: false,
        });

        writeSSEEvent('telemetry', {
          revenueTotal: Number(revenueTotal.toFixed(2)),
          profitMargin: Number(profitMargin.toFixed(2)),
          netProfit: Number(netProfit.toFixed(2)),
          laborUtilization: Number(laborUtilization.toFixed(2)),
          overdueRatio: Number(overdueRatio.toFixed(2)),
          totalOverdue: Number(totalOverdue.toFixed(2)),
          budgetAlertsCount: activeInsightsCount,
          timestamp: new Date().toISOString(),
        });
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
    return apiErrorResponse(error);
  }
});
