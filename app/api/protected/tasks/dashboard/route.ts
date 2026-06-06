import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskStatus, User, Project } from '@/models';
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const sprintId = url.searchParams.get('sprintId');

    // Base filter
    const filterQuery: Record<string, any> = { companyId, isSoftDeleted: false };
    if (projectId && mongoose.isValidObjectId(projectId)) {
      filterQuery.projectId = projectId;
    }
    if (sprintId && mongoose.isValidObjectId(sprintId)) {
      filterQuery.sprintId = sprintId;
    }

    const tasks = await Task.find(filterQuery)
      .select(
        'statusId assignees dueDate completedDate dependencies storyPoints estimatedHours actualHours sprintId'
      )
      .populate({ path: 'statusId', select: 'category name' })
      .lean();

    // ── 1. KPI Dials ─────────────────────────────────────────────────────────
    let totalCount = tasks.length;
    let assignedCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let blockedCount = 0;
    const now = new Date();

    tasks.forEach((task) => {
      const isDone = task.statusId && (task.statusId as any).category === 'done';
      const isAssigned = task.assignees.some((id: any) => id.toString() === userId);
      if (isAssigned) assignedCount++;
      if (isDone) completedCount++;
      if (task.dueDate && new Date(task.dueDate) < now && !isDone) overdueCount++;
      const isBlocked = task.dependencies.some((dep: any) => dep.type === 'blocked_by');
      if (isBlocked && !isDone) blockedCount++;
    });

    // ── 2. Completion Trend (last 14 days) ───────────────────────────────────
    const trendMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap.set(key, 0);
    }
    tasks.forEach((t) => {
      if (t.completedDate) {
        const key = new Date(t.completedDate).toISOString().split('T')[0];
        if (trendMap.has(key)) {
          trendMap.set(key, trendMap.get(key)! + 1);
        }
      }
    });
    const completionTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      completed: count,
    }));

    // ── 3. Workload distribution ─────────────────────────────────────────────
    const users = await User.find({ companyId }).select('name email image').lean();
    const workloadDistribution = users
      .map((u) => {
        let taskCount = 0;
        let estimatedHours = 0;
        let actualHours = 0;
        tasks.forEach((t) => {
          const isAssigned = t.assignees.some((id: any) => id.toString() === u._id.toString());
          if (isAssigned) {
            taskCount++;
            estimatedHours += t.estimatedHours || 0;
            actualHours += t.actualHours || 0;
          }
        });
        return {
          userId: u._id,
          userName: u.name,
          email: u.email,
          image: u.image,
          taskCount,
          estimatedHours: Math.round(estimatedHours),
          actualHours: Math.round(actualHours),
        };
      })
      .filter((item) => item.taskCount > 0);

    // ── 4. Real Burndown Chart ───────────────────────────────────────────────
    // Use the last 10 calendar days as "sprint". Count actual story points
    // completed each day and subtract from total.
    const totalPoints = Math.max(
      1,
      tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0)
    );
    const totalDays = 10;
    const burndown: { day: string; Ideal: number; Remaining: number }[] = [];

    // Build a daily completed points map for last 10 days
    const dailyCompleted = new Map<number, number>(); // dayIndex → pointsCompleted
    for (let d = 0; d <= totalDays; d++) dailyCompleted.set(d, 0);

    tasks.forEach((t) => {
      if (t.completedDate) {
        const diffMs = now.getTime() - new Date(t.completedDate).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const dayIndex = totalDays - diffDays;
        if (dayIndex >= 0 && dayIndex <= totalDays) {
          dailyCompleted.set(dayIndex, (dailyCompleted.get(dayIndex) || 0) + (t.storyPoints || 1));
        }
      }
    });

    let cumulativeCompleted = 0;
    for (let day = 0; day <= totalDays; day++) {
      cumulativeCompleted += dailyCompleted.get(day) || 0;
      const ideal = Math.max(0, Math.round(totalPoints - (totalPoints / totalDays) * day));
      const actual = Math.max(0, totalPoints - cumulativeCompleted);
      burndown.push({ day: `Day ${day}`, Ideal: ideal, Remaining: actual });
    }

    // ── 5. Real Velocity (by sprint) ─────────────────────────────────────────
    // Group tasks by sprintId and calculate planned vs completed story points
    const sprintMap = new Map<string, { name: string; planned: number; completed: number }>();

    // Get sprint metadata from projects
    const projects = await Project.find({ companyId }).select('sprints').lean();
    const sprintMeta = new Map<string, string>();
    projects.forEach((proj: any) => {
      (proj.sprints || []).forEach((sp: any) => {
        sprintMeta.set(sp._id.toString(), sp.name);
      });
    });

    tasks.forEach((t) => {
      if (!t.sprintId) return;
      const sid = t.sprintId.toString();
      if (!sprintMap.has(sid)) {
        sprintMap.set(sid, {
          name: sprintMeta.get(sid) || `Sprint`,
          planned: 0,
          completed: 0,
        });
      }
      const entry = sprintMap.get(sid)!;
      entry.planned += t.storyPoints || 1;
      const isDone = t.statusId && (t.statusId as any).category === 'done';
      if (isDone) entry.completed += t.storyPoints || 1;
    });

    const velocity = Array.from(sprintMap.entries())
      .slice(-4) // last 4 sprints
      .map(([, v]) => ({ sprint: v.name, completed: v.completed, planned: v.planned }));

    // Fall back to a single current-sprint entry if no sprint data exists
    if (velocity.length === 0) {
      velocity.push({
        sprint: 'Current',
        completed: completedCount,
        planned: totalCount,
      });
    }

    const responseData = {
      kpis: {
        total: totalCount,
        assigned: assignedCount,
        overdue: overdueCount,
        completed: completedCount,
        blocked: blockedCount,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      },
      completionTrend,
      workloadDistribution,
      burndown,
      velocity,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
