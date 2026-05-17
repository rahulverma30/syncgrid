import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CrmSettings } from '@/models/CrmSettings';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    let settings = await CrmSettings.findOne({ companyId });
    if (!settings) {
      // Create defaults
      settings = await CrmSettings.create({ companyId });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const { pipelineStages, leadSources } = body;

    let settings = await CrmSettings.findOne({ companyId });
    if (!settings) {
      settings = new CrmSettings({ companyId });
    }

    if (pipelineStages) settings.pipelineStages = pipelineStages;
    if (leadSources) settings.leadSources = leadSources;

    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SAVE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
