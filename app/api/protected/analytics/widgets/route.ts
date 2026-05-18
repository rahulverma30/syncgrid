import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DashboardLayout } from '@/models';
import { DashboardLayoutUpdateSchema } from '@/schemas/analytics';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    let layout = await DashboardLayout.findOne({ companyId, userId, isDefault: true });

    // Seed default widget coordinates if completely new user profile
    if (!layout) {
      const defaultWidgets = [
        { widgetId: 'kpi_financials', x: 0, y: 0, w: 12, h: 3 },
        { widgetId: 'chart_cashflow', x: 0, y: 3, w: 8, h: 4 },
        { widgetId: 'chart_workload', x: 8, y: 3, w: 4, h: 4 },
        { widgetId: 'insight_cockpit', x: 0, y: 7, w: 12, h: 3 },
      ];

      layout = new DashboardLayout({
        companyId,
        userId,
        name: 'Default Cockpit Layout',
        isDefault: true,
        widgets: defaultWidgets,
      });

      await layout.save();
    }

    return NextResponse.json({ success: true, data: layout });
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
    const body = await request.json();

    const parseResult = DashboardLayoutUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { widgets, name = 'Custom Layout' } = parseResult.data;

    let layout = await DashboardLayout.findOne({ companyId, userId, isDefault: true });

    if (!layout) {
      layout = new DashboardLayout({
        companyId,
        userId,
        name,
        isDefault: true,
        widgets,
      });
    } else {
      layout.widgets = widgets;
      if (name) {
        layout.name = name;
      }
    }

    await layout.save();

    return NextResponse.json({ success: true, data: layout });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
