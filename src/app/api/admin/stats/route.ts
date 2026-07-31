import { NextRequest, NextResponse } from 'next/server';

import { isLocalStatsEnabled } from '@/lib/features';
import { getAdminDashboardData, isAdminRequestAuthenticated } from '@/lib/visit-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isLocalStatsEnabled()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  if (!isAdminRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getAdminDashboardData(request.nextUrl.searchParams.get('range'), 200);
  return NextResponse.json(data);
}
