import { DashboardLayout } from '@/components/layouts';
import { requireAuth } from '@/lib/auth/session';

export default async function DashboardRootLayout({ children }) {
  await requireAuth();

  return <DashboardLayout>{children}</DashboardLayout>;
}
