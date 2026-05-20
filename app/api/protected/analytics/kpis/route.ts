import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { KPIConfiguration, FinancialActivity } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { KPIConfigUpdateSchema } from '@/schemas/analytics';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    let kpis = await KPIConfiguration.find({ companyId }).lean();

    return NextResponse.json({ success: true, data: kpis });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_FAILED', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized target settings updates.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { metricName, ...updatePayload } = body;

    const parseResult = KPIConfigUpdateSchema.safeParse(updatePayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    let kpi = await KPIConfiguration.findOne({ companyId, metricName });
    if (!kpi) {
      kpi = new KPIConfiguration({
        companyId,
        metricName,
        title: body.title || 'New KPI Metric',
        unit: body.unit || 'percent',
        currentValue: body.currentValue || 0,
        ...validated,
      });
    } else {
      kpi.targetValue = validated.targetValue;
      kpi.warningThreshold = validated.warningThreshold;
      kpi.criticalThreshold = validated.criticalThreshold;
      kpi.scoringWeight = validated.scoringWeight;
      if (body.currentValue !== undefined) {
        kpi.currentValue = body.currentValue;
      }
    }

    // Dynamic Target Completion Calculation
    // For general metrics where higher is better: targetCompletion = (currentValue / targetValue) * 100
    // For negative metrics like overdue ratios where lower is better, invert the calculation
    let completion = 100;
    if (kpi.targetValue > 0) {
      if (metricName === 'overdue_invoice_ratio') {
        completion =
          kpi.currentValue <= kpi.targetValue ? 100 : (kpi.targetValue / kpi.currentValue) * 100;
      } else {
        completion = (kpi.currentValue / kpi.targetValue) * 100;
      }
    }

    // Determine status boundaries
    let oldStatus = kpi.status;
    if (completion >= kpi.warningThreshold) {
      kpi.status = 'on_track';
      kpi.alertFired = false;
    } else if (completion >= kpi.criticalThreshold) {
      kpi.status = 'warning';
      kpi.alertFired = true;
    } else {
      kpi.status = 'critical';
      kpi.alertFired = true;
    }

    await kpi.save();

    // Trigger Financial Activity Log on metric alert breaches
    if (kpi.alertFired && oldStatus === 'on_track') {
      const alertActivity = new FinancialActivity({
        companyId,
        userId,
        userName,
        type: 'budget_threshold_crossed',
        title: `KPI Metric Alert Breach: ${kpi.title}`,
        description: `Corporate Performance Indicator "${kpi.title}" is currently underperforming against targets. Standing: ${kpi.currentValue}${kpi.unit === 'percent' ? '%' : ''} vs Target: ${kpi.targetValue}${kpi.unit === 'percent' ? '%' : ''}. Status marked as ${kpi.status.toUpperCase()}.`,
        severity: 'critical',
        metadata: { metricName, currentValue: kpi.currentValue, targetValue: kpi.targetValue },
      });
      await alertActivity.save();
    }

    return NextResponse.json({ success: true, data: kpi });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
