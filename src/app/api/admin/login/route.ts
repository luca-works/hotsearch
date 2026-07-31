import { NextRequest, NextResponse } from 'next/server';

import { isLocalStatsEnabled } from '@/lib/features';
import { isValidAdminToken, setAdminCookie } from '@/lib/visit-store';

export const runtime = 'nodejs';

const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const redirectTo = (location: string) => (
  new NextResponse(null, {
    status: 303,
    headers: {
      Location: location,
    },
  })
);

const clientKey = (request: NextRequest) => (
  request.headers.get('cf-connecting-ip')
  || request.headers.get('x-real-ip')
  || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  || 'local'
);

export async function POST(request: NextRequest) {
  if (!isLocalStatsEnabled()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const key = clientKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);
  const attempts = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + LOGIN_WINDOW_MS }
    : current;
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return redirectTo('/admin/login?error=2');
  }

  const formData = await request.formData();
  const token = String(formData.get('token') || '');

  if (!isValidAdminToken(token)) {
    loginAttempts.set(key, { ...attempts, count: attempts.count + 1 });
    return redirectTo('/admin/login?error=1');
  }

  loginAttempts.delete(key);
  const response = redirectTo('/admin/visits');
  setAdminCookie(response);
  return response;
}
