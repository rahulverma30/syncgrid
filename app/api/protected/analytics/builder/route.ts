import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Transaction, Invoice, TaskTimeLog, Task, Project } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import mongoose from 'mongoose';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const {
      type = 'financial',
      dateRange = {},
      groupBy = 'month',
      aggregateType = 'sum',
      metrics = ['amount'],
    } = body;

    const startDate = dateRange.start
      ? new Date(dateRange.start)
      : new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
    const endDate = dateRange.end ? new Date(dateRange.end) : new Date();

    const matchStage: Record<string, any> = {
      companyId: new mongoose.Types.ObjectId(companyId),
    };

    let dataResults: any[] = [];

    // --- CASE 1: FINANCIAL PIPELINE ---
    if (type === 'financial') {
      matchStage.paymentDate = { $gte: startDate, $lte: endDate };
      matchStage.status = 'cleared';

      let groupField: any = {};
      if (groupBy === 'month') {
        groupField = {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
        };
      } else if (groupBy === 'category') {
        groupField = '$type';
      } else if (groupBy === 'paymentMethod') {
        groupField = '$paymentMethod';
      } else {
        groupField = '$type';
      }

      const aggPipeline: any[] = [
        { $match: matchStage },
        {
          $group: {
            _id: groupField,
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
          },
        },
      ];

      const res = await Transaction.aggregate(aggPipeline);

      dataResults = res.map((r) => {
        let label = '';
        if (typeof r._id === 'object' && r._id !== null) {
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          label = `${monthNames[r._id.month - 1]} ${r._id.year}`;
        } else {
          label = String(r._id).toUpperCase();
        }

        return {
          label,
          amount: r.amount,
          count: r.count,
          avgAmount: r.avgAmount,
        };
      });
    }

    // --- CASE 2: WORKFORCE PIPELINE ---
    else if (type === 'workforce') {
      matchStage.startTime = { $gte: startDate, $lte: endDate };

      let groupField: any = '$userId';
      if (groupBy === 'employee') {
        groupField = '$userId';
      } else if (groupBy === 'billable') {
        groupField = '$billable';
      }

      const aggPipeline: any[] = [
        { $match: matchStage },
        {
          $group: {
            _id: groupField,
            totalMinutes: { $sum: '$durationMinutes' },
            billableMinutes: {
              $sum: {
                $cond: [{ $eq: ['$billable', true] }, '$durationMinutes', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ];

      // Populate user profiles context if grouping by employee user reference
      if (groupBy === 'employee') {
        aggPipeline.push(
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
        );
      }

      const res = await TaskTimeLog.aggregate(aggPipeline);

      dataResults = res.map((r) => {
        let label = '';
        if (groupBy === 'employee') {
          label = r.user?.name || 'General resource';
        } else if (groupBy === 'billable') {
          label = r._id ? 'Billable Logs' : 'Non-Billable Logs';
        } else {
          label = String(r._id);
        }

        const hours = r.totalMinutes / 60;
        const billableHours = r.billableMinutes / 60;
        const ratio = r.totalMinutes > 0 ? (r.billableMinutes / r.totalMinutes) * 100 : 0;

        return {
          label,
          totalHours: Number(hours.toFixed(2)),
          billableHours: Number(billableHours.toFixed(2)),
          billableRatio: Number(ratio.toFixed(1)),
          count: r.count,
        };
      });
    }

    // --- CASE 3: PROJECT/TASK PRODUCTIVITY PIPELINE ---
    else {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
      matchStage.isSoftDeleted = { $ne: true };

      let groupField: any = '$status';
      if (groupBy === 'project') {
        groupField = '$projectId';
      } else if (groupBy === 'priority') {
        groupField = '$priority';
      } else {
        groupField = '$status';
      }

      const aggPipeline: any[] = [
        { $match: matchStage },
        {
          $group: {
            _id: groupField,
            count: { $sum: 1 },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
          },
        },
      ];

      if (groupBy === 'project') {
        aggPipeline.push(
          { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
          { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } }
        );
      }

      const res = await Task.aggregate(aggPipeline);

      dataResults = res.map((r) => {
        let label = '';
        if (groupBy === 'project') {
          label = r.project?.name || 'Unassigned Overhead';
        } else {
          label = String(r._id).toUpperCase();
        }

        return {
          label,
          count: r.count,
          completedCount: r.completedTasks,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: dataResults,
      meta: {
        type,
        groupBy,
        startDate,
        endDate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
