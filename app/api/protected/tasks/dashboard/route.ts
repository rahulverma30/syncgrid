import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, User, Project, TaskTimeLog, TaskActivity } from '@/models';
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const filterUserId = url.searchParams.get('userId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Base filter
    const filterQuery: Record<string, any> = { companyId, isSoftDeleted: false };
    if (projectId && mongoose.isValidObjectId(projectId)) {
      filterQuery.projectId = projectId;
    }
    if (filterUserId && mongoose.isValidObjectId(filterUserId)) {
      filterQuery.assignees = filterUserId;
    }
    if (dateFrom || dateTo) {
      filterQuery.dueDate = {};
      if (dateFrom) filterQuery.dueDate.$gte = new Date(dateFrom);
      if (dateTo) filterQuery.dueDate.$lte = new Date(dateTo);
    }

    const tasks = await Task.find(filterQuery)
      .select(
        'title code statusId assignees dueDate completedDate dependencies storyPoints estimatedHours actualHours projectId createdAt'
      )
      .populate({ path: 'statusId', select: 'category name' })
      .populate({ path: 'projectId', select: 'name code' })
      .populate({ path: 'assignees', select: 'name image email' })
      .lean();

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // ── 1. Exec Summary Variables ──────────────────────────────
    let totalTasks = tasks.length;
    let totalTasksWeekAgo = 0;
    let openTasks = 0;
    let openTasksWeekAgo = 0;
    let completedToday = 0;
    let completedYesterday = 0;
    let overdueTasks = 0;
    let overdueTasksWeekAgo = 0;
    let tasksAtRisk = 0;
    let tasksAtRiskWeekAgo = 0;
    let hoursLoggedToday = 0;
    let hoursLoggedYesterday = 0;

    // ── 2. Needs Attention Center Variables ─────────────────────
    const attentionOverdue: any[] = [];
    const attentionOverEstimate: any[] = [];
    const attentionBlocked: any[] = [];
    const attentionUnassigned: any[] = [];
    const attentionDueToday: any[] = [];

    // ── 3. Maps for Workload, Health, Analytics ─────────────────
    const workloadMap = new Map<string, any>();
    const projectHealthMap = new Map<string, any>();
    let totalEstimated = 0;
    let totalActual = 0;

    tasks.forEach((t: any) => {
      const isDone = t.statusId && t.statusId.category === 'done';
      const createdDate = new Date(t.createdAt);
      const isOldTask = createdDate < sevenDaysAgo;

      if (isOldTask) totalTasksWeekAgo++;

      // Time Analytics
      const est = t.estimatedHours || 0;
      const act = t.actualHours || 0;
      totalEstimated += est;
      totalActual += act;

      // Open tasks
      if (!isDone) {
        openTasks++;
        if (isOldTask && (!t.completedDate || new Date(t.completedDate) > sevenDaysAgo)) {
          openTasksWeekAgo++;
        }
      }

      // Completed Today
      if (isDone && t.completedDate) {
        const compDate = new Date(t.completedDate);
        if (compDate >= startOfToday) completedToday++;
        else if (compDate >= startOfYesterday && compDate < startOfToday) completedYesterday++;
      }

      // Overdue
      const due = t.dueDate ? new Date(t.dueDate) : null;
      let isOverdue = false;
      if (due && due < now && !isDone) {
        overdueTasks++;
        isOverdue = true;
        if (attentionOverdue.length < 20) attentionOverdue.push(t);
      }
      if (
        isOldTask &&
        due &&
        due < sevenDaysAgo &&
        (!t.completedDate || new Date(t.completedDate) > sevenDaysAgo)
      ) {
        overdueTasksWeekAgo++;
      }

      // At Risk
      let isAtRisk = false;
      const isBlocked = t.dependencies?.some((dep: any) => dep.type === 'blocked_by');
      const isOverEstimate = est > 0 && act > est;

      if ((isBlocked || isOverEstimate) && !isDone) {
        tasksAtRisk++;
        isAtRisk = true;

        if (isBlocked && attentionBlocked.length < 20) attentionBlocked.push(t);
        if (isOverEstimate && attentionOverEstimate.length < 20) attentionOverEstimate.push(t);
      }
      if (
        isOldTask &&
        (isBlocked || isOverEstimate) &&
        (!t.completedDate || new Date(t.completedDate) > sevenDaysAgo)
      ) {
        tasksAtRiskWeekAgo++;
      }

      // Unassigned
      if (!t.assignees || t.assignees.length === 0) {
        if (!isDone && attentionUnassigned.length < 20) attentionUnassigned.push(t);
      }

      // Due Today
      if (
        due &&
        due >= startOfToday &&
        due < new Date(startOfToday.getTime() + 86400000) &&
        !isDone
      ) {
        if (attentionDueToday.length < 20) attentionDueToday.push(t);
      }

      // Workload
      if (!isDone && t.assignees) {
        t.assignees.forEach((a: any) => {
          const id = a._id ? a._id.toString() : a.toString();
          if (!workloadMap.has(id)) {
            workloadMap.set(id, {
              user: a,
              assignedTasks: 0,
              inProgressTasks: 0,
              overdueTasks: 0,
              estimatedHours: 0,
              actualHours: 0,
            });
          }
          const w = workloadMap.get(id);
          w.assignedTasks++;
          if (t.statusId?.category === 'in-progress') w.inProgressTasks++;
          if (isOverdue) w.overdueTasks++;
          w.estimatedHours += est;
          w.actualHours += act;
        });
      }

      // Project Health
      if (t.projectId) {
        const pId = t.projectId._id ? t.projectId._id.toString() : t.projectId.toString();
        if (!projectHealthMap.has(pId)) {
          projectHealthMap.set(pId, {
            project: t.projectId,
            totalTasks: 0,
            completedTasks: 0,
            remainingTasks: 0,
            overdueTasks: 0,
            estimatedHours: 0,
            loggedHours: 0,
            atRisk: false,
            deadlineDistanceDays: 999,
          });
        }
        const ph = projectHealthMap.get(pId);
        ph.totalTasks++;
        ph.estimatedHours += est;
        ph.loggedHours += act;
        if (isDone) ph.completedTasks++;
        else ph.remainingTasks++;
        if (isOverdue) ph.overdueTasks++;
        if (isAtRisk) ph.atRisk = true;
        if (due && !isDone) {
          const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
          if (days < ph.deadlineDistanceDays) ph.deadlineDistanceDays = days;
        }
      }
    });

    // ── 4. Format Project Health ──────────────────────────────────────────
    let delayedProjectsCount = 0;
    let atRiskProjectsCount = 0;
    let globalProjHealthSum = 0;

    const projectHealthList = Array.from(projectHealthMap.values()).map((ph) => {
      const progress =
        ph.totalTasks > 0 ? Math.round((ph.completedTasks / ph.totalTasks) * 100) : 0;
      let score = 100;
      const explanations: string[] = [];

      if (ph.overdueTasks > 0) {
        score -= ph.overdueTasks * 5;
        explanations.push(`${ph.overdueTasks} overdue task(s)`);
      }
      if (ph.loggedHours > ph.estimatedHours && ph.estimatedHours > 0) {
        score -= 15;
        explanations.push(`Budget overrun`);
      }
      if (ph.deadlineDistanceDays < 3 && ph.remainingTasks > 0) {
        score -= 10;
        explanations.push(`Approaching deadline`);
      }
      if (progress < 20 && ph.deadlineDistanceDays < 14) {
        score -= 10;
        explanations.push(`Behind schedule`);
      }

      score = Math.max(0, score);

      let riskLabel = 'Healthy';
      let health = '🟢 Healthy';

      if (score < 60) {
        health = '🔴 Critical';
        riskLabel = 'Critical';
        delayedProjectsCount++;
      } else if (score < 80) {
        health = '🟡 At Risk';
        riskLabel = 'At Risk';
        atRiskProjectsCount++;
      } else if (score < 95) {
        riskLabel = 'Needs Attention';
        health = '⚪ Needs Attention';
      } else {
        if (explanations.length === 0) explanations.push('Operating smoothly');
      }

      globalProjHealthSum += score;

      return {
        ...ph,
        progress,
        health,
        healthScore: score,
        riskLabel,
        explanations,
        remainingHours: Math.max(0, ph.estimatedHours - ph.loggedHours),
      };
    });

    const subScoreProjectHealth =
      projectHealthList.length > 0
        ? Math.round(globalProjHealthSum / projectHealthList.length)
        : 100;

    // ── 5. Format Workload ───────────────────────────────────────────────
    let overloadedEmployeesCount = 0;
    let globalCapSum = 0;

    const workloadList = Array.from(workloadMap.values()).map((w) => {
      const capacityHours = 40;
      const capacityPct = capacityHours > 0 ? Math.round((w.actualHours / capacityHours) * 100) : 0;

      let status = '⚪ No Active Work';
      if (capacityPct > 0 && capacityPct <= 80) status = '🟢 Healthy';
      else if (capacityPct > 80 && capacityPct <= 100) status = '🟡 Near Capacity';
      else if (capacityPct > 100) {
        status = '🔴 Overloaded';
        overloadedEmployeesCount++;
      }

      // calculate capacity health for sub-score
      // 100 is perfect. If overloaded, subtract points.
      let capHealth = 100;
      if (capacityPct > 100) capHealth -= capacityPct - 100;
      capHealth = Math.max(0, Math.min(100, capHealth));
      globalCapSum += capHealth;

      return {
        ...w,
        capacityPct,
        status,
      };
    });

    const subScoreCapacity =
      workloadList.length > 0 ? Math.round(globalCapSum / workloadList.length) : 100;

    // ── 6. Time Performance & Logging Analytics ───────────────────────────
    const recentLogs = await TaskTimeLog.find({
      companyId,
      startTime: { $gte: startOfYesterday },
    }).lean();
    recentLogs.forEach((log: any) => {
      const d = new Date(log.startTime);
      if (d >= startOfToday) {
        hoursLoggedToday += (log.durationMinutes || 0) / 60;
      } else if (d >= startOfYesterday && d < startOfToday) {
        hoursLoggedYesterday += (log.durationMinutes || 0) / 60;
      }
    });

    const timeEfficiency =
      totalEstimated > 0
        ? Math.round((totalActual / totalEstimated) * 100)
        : totalActual > 0
          ? 0
          : 100;

    let efficiencyStatus = 'Healthy';
    if (timeEfficiency > 100) efficiencyStatus = 'Slight Overrun';
    if (timeEfficiency > 120) efficiencyStatus = 'Severe Overrun';
    if (timeEfficiency < 50) efficiencyStatus = 'Early Stage';

    const subScoreTime = timeEfficiency > 100 ? Math.max(0, 100 - (timeEfficiency - 100)) : 100;

    const timePerformance = {
      estimated: Math.round(totalEstimated),
      logged: Math.round(totalActual),
      remaining: Math.max(0, Math.round(totalEstimated - totalActual)),
      overrun: Math.max(0, Math.round(totalActual - totalEstimated)),
      efficiency: timeEfficiency,
      efficiencyStatus,
    };

    // ── 7. Active Work Stream (Running Timers) ────────────────────────────
    const activeTimers = await TaskTimeLog.find({ companyId, isRunning: true })
      .populate('userId', 'name image email')
      .populate('taskId', 'title code projectId')
      .lean();

    const totalCompanyUsers = await User.countDocuments({ companyId, status: 'active' });
    const employeesWorking = activeTimers.length;
    const employeesPaused = totalCompanyUsers - employeesWorking;

    const timerProjectsIds = Array.from(
      new Set(activeTimers.map((t: any) => t.taskId?.projectId).filter(Boolean))
    );
    const timerProjects = await Project.find({ _id: { $in: timerProjectsIds } })
      .select('name')
      .lean();
    const projMap = new Map(timerProjects.map((p) => [p._id.toString(), p.name]));

    const activeWorkStreamFormatted = activeTimers.map((t: any) => {
      const startTime = new Date(t.startTime).getTime();
      const elapsedMinutes = Math.floor((now.getTime() - startTime) / 60000);
      const h = Math.floor(elapsedMinutes / 60);
      const m = elapsedMinutes % 60;
      return {
        ...t,
        projectName: t.taskId?.projectId
          ? projMap.get(t.taskId.projectId.toString())
          : 'Unknown Project',
        elapsedFormatted: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      };
    });

    // ── 8. Automation Insights ──────────────────────────────────────────────
    const todayActivities = await TaskActivity.find({
      companyId,
      createdAt: { $gte: startOfToday },
      type: 'automation_fired',
    }).lean();

    let autoCompleted = 0;
    let autoAssigned = 0;
    let autoEscalated = 0;
    let rulesFailed = 0;

    todayActivities.forEach((act: any) => {
      const desc = act.description?.toLowerCase() || '';
      if (desc.includes('status')) autoCompleted++;
      if (desc.includes('assign')) autoAssigned++;
      if (desc.includes('escalate')) autoEscalated++;
      if (desc.includes('fail') || desc.includes('error')) rulesFailed++;
    });

    const subScoreAutomation = rulesFailed > 0 ? Math.max(0, 100 - rulesFailed * 10) : 100;

    const automationInsights = {
      triggeredToday: todayActivities.length,
      autoCompleted,
      autoAssigned,
      autoEscalated,
      rulesFailed,
    };

    // ── 9. Global Operations Health Score ─────────────────────────────────
    const subScoreTaskDelivery = Math.max(0, 100 - overdueTasks * 2 - attentionBlocked.length * 3);
    const opsHealth = Math.round(
      (subScoreProjectHealth +
        subScoreCapacity +
        subScoreTime +
        subScoreAutomation +
        subScoreTaskDelivery) /
        5
    );

    let opsHealthStatus = 'Excellent';
    if (opsHealth < 60) opsHealthStatus = 'Critical';
    else if (opsHealth < 75) opsHealthStatus = 'Needs Attention';
    else if (opsHealth < 90) opsHealthStatus = 'Healthy';

    // ── 10. Actionable Insights Engine ───────────────────────────────────────
    const insights: any[] = [];

    if (attentionOverdue.length > 0) {
      const userOverdue = new Map<string, any>();
      attentionOverdue.forEach((t) => {
        t.assignees?.forEach((a: any) => {
          const id = a._id ? a._id.toString() : a.toString();
          if (!userOverdue.has(id)) userOverdue.set(id, { name: a.name || 'Someone', count: 0 });
          userOverdue.get(id).count++;
        });
      });
      let maxUser = { name: '', count: 0, id: '' };
      userOverdue.forEach((val, id) => {
        if (val.count > maxUser.count) {
          maxUser = { name: val.name, count: val.count, id };
        }
      });
      if (maxUser.count > 0) {
        insights.push({
          message: `${maxUser.count} task${maxUser.count > 1 ? 's' : ''} require reassignment. Currently overdue and assigned to ${maxUser.name}.`,
          actionLabel: 'Reassign Tasks',
          actionHref: `/tasks?userId=${maxUser.id}&status=overdue`,
        });
      }
    }

    const criticalProjects = projectHealthList.filter(
      (ph) => ph.healthScore < 60 && ph.deadlineDistanceDays < 7
    );
    criticalProjects.forEach((p) => {
      insights.push({
        message: `Project "${p.project.name}" is likely to miss its deadline within ${p.deadlineDistanceDays} days.`,
        actionLabel: 'View Project',
        actionHref: `/projects/${p.project._id}`,
      });
    });

    const overloaded = workloadList.filter((w) => w.capacityPct > 100);
    overloaded.forEach((o) => {
      insights.push({
        message: `${o.user.name} is currently overloaded at ${o.capacityPct}% capacity.`,
        actionLabel: 'Manage Capacity',
        actionHref: `/tasks?userId=${o.user._id}`,
      });
    });

    if (attentionOverEstimate.length > 0) {
      insights.push({
        message: `${attentionOverEstimate.length} active task${attentionOverEstimate.length > 1 ? 's' : ''} exceeded their estimated hours.`,
        actionLabel: 'Review Estimates',
        actionHref: `/tasks?status=over-estimate`, // Custom front-end filter support needed ideally, but mock link
      });
    }

    if (insights.length === 0) {
      insights.push({
        message: 'All systems are healthy. Delivery operations are operating optimally.',
        actionLabel: 'View All Work',
        actionHref: '/tasks',
      });
    }

    // ── 11. Momentum Trend (Tasks Completed Over Time) ──────────────────────
    const momentumTrendMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      momentumTrendMap.set(d.toISOString().split('T')[0], 0);
    }
    tasks.forEach((t) => {
      if (t.completedDate) {
        const key = new Date(t.completedDate).toISOString().split('T')[0];
        if (momentumTrendMap.has(key)) {
          momentumTrendMap.set(key, momentumTrendMap.get(key)! + 1);
        }
      }
    });
    const momentumTrend = Array.from(momentumTrendMap.entries()).map(([date, completed]) => ({
      date,
      completed,
    }));

    // ── 12. Daily Briefing ──────────────────────────────────────────────────
    const dailyBriefing = {
      tasksCompletedToday: completedToday,
      overdueCount: overdueTasks,
      hoursLoggedToday: Math.round(hoursLoggedToday),
      activeEmployees: employeesWorking,
      criticalBlockers: attentionBlocked.length,
      projectsAtRisk: atRiskProjectsCount + delayedProjectsCount,
    };

    const responseData = {
      operationsHealth: {
        score: opsHealth,
        status: opsHealthStatus,
        breakdown: {
          projectHealth: subScoreProjectHealth,
          taskDelivery: subScoreTaskDelivery,
          capacity: subScoreCapacity,
          automation: subScoreAutomation,
          timePerformance: subScoreTime,
        },
      },
      dailyBriefing,
      kpis: {
        totalTasks: { value: totalTasks, trend: totalTasks - totalTasksWeekAgo },
        openTasks: { value: openTasks, trend: openTasks - openTasksWeekAgo },
        completedToday: { value: completedToday, trend: completedToday - completedYesterday },
        overdueTasks: { value: overdueTasks, trend: overdueTasks - overdueTasksWeekAgo },
        tasksAtRisk: { value: tasksAtRisk, trend: tasksAtRisk - tasksAtRiskWeekAgo },
        hoursLoggedToday: {
          value: Math.round(hoursLoggedToday),
          trend: Math.round(hoursLoggedToday - hoursLoggedYesterday),
        },
      },
      attentionRequired: {
        overdue: attentionOverdue,
        overEstimate: attentionOverEstimate,
        blocked: attentionBlocked,
        unassigned: attentionUnassigned,
        dueToday: attentionDueToday,
      },
      teamWorkload: workloadList.sort((a, b) => b.capacityPct - a.capacityPct),
      projectHealth: projectHealthList.sort((a, b) => a.healthScore - b.healthScore), // Lower score = more critical
      timePerformance,
      activeWorkStream: {
        timers: activeWorkStreamFormatted,
        employeesWorking,
        employeesPaused,
      },
      automationInsights,
      actionableInsights: insights,
      momentumTrend,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Dashboard Engine Error:', error);
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
