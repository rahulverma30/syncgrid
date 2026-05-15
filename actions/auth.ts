'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { requirePermission } from '@/lib/auth/session';
import { Activity } from '@/models';

export async function trackActivityAction(input: {
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const session = await requirePermission('activity', 'create');

  await connectToDatabase();

  await Activity.create({
    companyId: session.user.companyId,
    userId: session.user.id,
    type: input.type,
    title: input.title,
    description: input.description,
    metadata: input.metadata || {},
  });

  revalidatePath('/dashboard');

  return {
    success: true,
  };
}
