import { NextResponse } from 'next/server';

import { isLocalStatsEnabled } from '@/lib/features';
import { clearAdminCookie } from '@/lib/visit-store';

export const runtime = 'nodejs';

export async function POST() {
  if (!isLocalStatsEnabled()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: '/admin/login',
    },
  });
  clearAdminCookie(response);
  return response;
}
