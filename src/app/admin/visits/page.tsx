import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { AdminDashboard } from '@/components/AdminDashboard';
import { isLocalStatsEnabled } from '@/lib/features';
import { getAdminDashboardData, isAdminAuthenticated } from '@/lib/visit-store';

export const dynamic = 'force-dynamic';

export default async function AdminVisitsPage() {
  if (!isLocalStatsEnabled()) notFound();

  const cookieStore = await cookies();

  if (!isAdminAuthenticated(cookieStore)) {
    redirect('/admin/login');
  }

  const initialData = await getAdminDashboardData('today', 200);

  return <AdminDashboard initialData={initialData} />;
}
