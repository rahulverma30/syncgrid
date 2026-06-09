import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutomationTemplate } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Load both system templates and custom tenant templates
    const templates = await AutomationTemplate.find({
      $or: [{ isSystem: true }, { companyId }],
    }).sort({ category: 1, name: 1 });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
