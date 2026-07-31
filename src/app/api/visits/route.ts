import { NextRequest, NextResponse } from 'next/server';

import { isLocalStatsEnabled } from '@/lib/features';
import {
  appendVisitLog,
  buildVisitLog,
  getOrCreateVisitIdentity,
  hasVisitSession,
  setVisitCookies,
} from '@/lib/visit-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isLocalStatsEnabled()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const identity = getOrCreateVisitIdentity(request);

  try {
    const body = await request.json().catch(() => ({}));
    const hasCurrentSession = await hasVisitSession(identity.sessionId);

    if (!hasCurrentSession) {
      const log = await buildVisitLog(request, body, identity.visitorId, identity.sessionId);
      await appendVisitLog(log);
    }

    const response = NextResponse.json({ ok: true });
    setVisitCookies(response, identity.visitorId, identity.sessionId);
    return response;
  } catch (error) {
    console.error('Failed to record local visit', error);
    const response = NextResponse.json({ ok: false }, { status: 500 });
    setVisitCookies(response, identity.visitorId, identity.sessionId);
    return response;
  }
}
