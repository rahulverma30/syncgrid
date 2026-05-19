import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { KnowledgeCategory } from '@/models';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const categories = await KnowledgeCategory.find({ companyId }).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Failed to load categories:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const { name, colorCode } = body;
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name required' },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await KnowledgeCategory.findOne({ companyId, slug });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Category already exists' },
        { status: 400 }
      );
    }

    const category = new KnowledgeCategory({
      companyId,
      name,
      slug,
      colorCode: colorCode || '#10B981',
    });

    await category.save();

    logger.info(`[KnowledgeCategory POST] Category "${name}" created.`, { companyId });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Failed to create category:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
