import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { appendFile, mkdir, open, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { NextRequest, NextResponse } from 'next/server';

export type VisitLog = {
  id: string;
  visitorId: string;
  sessionId: string;
  ip: string;
  country: string;
  province: string;
  city: string;
  path: string;
  referer: string;
  userAgent: string;
  visitedAt: string;
};

export type VisitStats = {
  todayPv: number;
  todayUv: number;
  totalPv: number;
  totalUv: number;
  latest: VisitLog[];
};

export type AdminStatsRange = 'today' | '7d' | '30d';

export type VisitChartPoint = {
  label: string;
  pv: number;
  uv: number;
};

export type VisitBreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

export type AdminDashboardData = {
  range: AdminStatsRange;
  rangePv: number;
  rangeUv: number;
  totalPv: number;
  totalUv: number;
  activeUsersLast5Min: number;
  latest: VisitLog[];
  hourlyTrends: VisitChartPoint[];
  dailyTrends: VisitChartPoint[];
  paths: VisitBreakdownItem[];
  geo: VisitBreakdownItem[];
  generatedAt: string;
};

export const VISITOR_COOKIE = 'moyu_visitor_id';
export const SESSION_COOKIE = 'moyu_session_id';
export const ADMIN_COOKIE = 'moyu_admin';

const SESSION_MAX_AGE = 60 * 30;
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const ADMIN_MAX_AGE = 60 * 60 * 24 * 7;
const ADMIN_MAX_AGE_MS = ADMIN_MAX_AGE * 1_000;
const DEFAULT_RETENTION_DAYS = 30;
const COMPACTION_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

const getVisitLogPath = () => {
  if (process.env.VISIT_LOG_PATH) {
    return process.env.VISIT_LOG_PATH;
  }

  return process.env.NODE_ENV === 'production'
    ? '/data/visits.jsonl'
    : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'visits.jsonl');
};

const toShanghaiDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

const toShanghaiHour = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return Number(parts.find(part => part.type === 'hour')?.value || '0');
};

const sanitizePath = (value: unknown) => {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return '/';
  }

  return value.slice(0, 256);
};

const sanitizeReferer = (value: string | null) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 512);
  } catch {
    return '';
  }
};

const getClientIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  return (
    request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || forwardedFor
    || 'unknown'
  );
};

const isPrivateIp = (ip: string) => (
  ip === 'unknown'
  || ip === '::1'
  || ip === '127.0.0.1'
  || ip.startsWith('10.')
  || ip.startsWith('192.168.')
  || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
);

const maskIp = (ip: string) => {
  if (isPrivateIp(ip)) return ip;
  const ipv4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (ipv4) return `${ipv4[1]}.0`;
  if (ip.includes(':')) return `${ip.split(':').filter(Boolean).slice(0, 4).join(':')}::`;
  return 'unknown';
};

const retentionDays = () => {
  const configured = Number(process.env.VISIT_RETENTION_DAYS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_RETENTION_DAYS;
};

const retentionCutoff = () => Date.now() - retentionDays() * 24 * 60 * 60 * 1_000;

const resolveGeo = async (ip: string) => {
  const empty = { country: '未知', province: '未知', city: '未知' };
  const geoApiUrl = process.env.VISIT_GEO_API_URL;

  if (!geoApiUrl || isPrivateIp(ip)) {
    return empty;
  }

  try {
    const response = await fetch(geoApiUrl.replace('{ip}', encodeURIComponent(ip)), {
      headers: {
        'User-Agent': 'Mozilla/5.0 HotNewsVisitLogger/1.0',
      },
      signal: AbortSignal.timeout(1800),
    });

    if (!response.ok) {
      return empty;
    }

    const data = await response.json() as Record<string, unknown>;
    return {
      country: String(data.country || data.country_name || data.countryName || data.region || '未知'),
      province: String(data.province || data.region || data.region_name || data.regionName || data.administrative || '未知'),
      city: String(data.city || data.city_name || data.cityName || '未知'),
    };
  } catch {
    return empty;
  }
};

export const getOrCreateVisitIdentity = (request: NextRequest) => {
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value || randomUUID();
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value || randomUUID();

  return {
    visitorId,
    sessionId,
    shouldSetVisitor: !request.cookies.get(VISITOR_COOKIE)?.value,
    shouldSetSession: !request.cookies.get(SESSION_COOKIE)?.value,
  };
};

export const buildVisitLog = async (
  request: NextRequest,
  body: unknown,
  visitorId: string,
  sessionId: string,
): Promise<VisitLog> => {
  const ip = getClientIp(request);
  const geo = await resolveGeo(ip);
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};

  return {
    id: randomUUID(),
    visitorId,
    sessionId,
    ip: process.env.VISIT_STORE_RAW_IP === 'true' ? ip : maskIp(ip),
    country: geo.country,
    province: geo.province,
    city: geo.city,
    path: sanitizePath(payload.path),
    referer: sanitizeReferer(request.headers.get('referer')),
    userAgent: (request.headers.get('user-agent') || '').slice(0, 512),
    visitedAt: new Date().toISOString(),
  };
};

let lastCompactionAt = 0;
let visitWriteQueue = Promise.resolve();

const readLogFile = async (logPath: string) => {
  const file = await open(logPath, 'r');
  try {
    return await file.readFile('utf8');
  } finally {
    await file.close();
  }
};

const compactVisitLog = async (logPath: string) => {
  const content = await readLogFile(logPath).catch(() => '');
  if (!content) return;

  const cutoff = retentionCutoff();
  const retainedLines = content
    .split('\n')
    .filter(Boolean)
    .filter((line) => {
      try {
        const log = JSON.parse(line) as VisitLog;
        return new Date(log.visitedAt).getTime() >= cutoff;
      } catch {
        return false;
      }
    });

  await writeFile(logPath, retainedLines.length ? `${retainedLines.join('\n')}\n` : '', 'utf8');
};

export const appendVisitLog = async (log: VisitLog) => {
  const logPath = getVisitLogPath();
  const writeTask = visitWriteQueue.then(async () => {
    await mkdir(path.dirname(logPath), { recursive: true });
    await appendFile(logPath, `${JSON.stringify(log)}\n`, 'utf8');

    if (Date.now() - lastCompactionAt >= COMPACTION_INTERVAL_MS) {
      await compactVisitLog(logPath);
      lastCompactionAt = Date.now();
    }
  });
  visitWriteQueue = writeTask.catch(() => undefined);
  await writeTask;
};

export const readVisitLogs = async () => {
  try {
    const content = await readLogFile(getVisitLogPath());
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as VisitLog)
      .filter(log => log.visitorId && new Date(log.visitedAt).getTime() >= retentionCutoff());
  } catch {
    return [];
  }
};

export const hasVisitSession = async (sessionId: string) => {
  const logs = await readVisitLogs();
  return logs.some(log => log.sessionId === sessionId);
};

const uniqueBy = <T,>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
};

const percentOf = (count: number, total: number) => (
  total > 0 ? Math.round((count / total) * 1000) / 10 : 0
);

const countBreakdown = (
  logs: VisitLog[],
  getKey: (log: VisitLog) => string,
  limit = 5,
): VisitBreakdownItem[] => {
  const counts = new Map<string, number>();

  for (const log of logs) {
    const key = getKey(log) || '未知';
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentOf(count, logs.length),
    }));
};

const rangeDays = (range: AdminStatsRange) => {
  if (range === '30d') {
    return 30;
  }

  if (range === '7d') {
    return 7;
  }

  return 1;
};

const normalizeRange = (range: string | null): AdminStatsRange => {
  if (range === '7d' || range === '30d') {
    return range;
  }

  return 'today';
};

const recentDateKeys = (days: number) => {
  const now = Date.now();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now - (days - index - 1) * 24 * 60 * 60 * 1000);
    return toShanghaiDateKey(date);
  });
};

const shortDateLabel = (dateKey: string) => dateKey.slice(5);

const trendPoint = (label: string, logs: VisitLog[]): VisitChartPoint => ({
  label,
  pv: uniqueBy(logs, log => log.sessionId).length,
  uv: new Set(logs.map(log => log.visitorId)).size,
});

export const getAdminDashboardData = async (
  rawRange: string | null = 'today',
  latestLimit = 200,
): Promise<AdminDashboardData> => {
  const range = normalizeRange(rawRange);
  const logs = await readVisitLogs();
  const allUniqueSessions = uniqueBy(logs, log => log.sessionId);
  const dateKeys = recentDateKeys(rangeDays(range));
  const dateKeySet = new Set(dateKeys);
  const rangeLogs = logs.filter(log => dateKeySet.has(toShanghaiDateKey(new Date(log.visitedAt))));
  const reversedUniqueRangeLogs = uniqueBy([...rangeLogs].reverse(), log => log.sessionId);
  const nowTime = Date.now();
  const activeUsersLast5Min = new Set(
    logs
      .filter(log => nowTime - new Date(log.visitedAt).getTime() <= 5 * 60 * 1000)
      .map(log => log.visitorId),
  ).size;

  const hourlyTrends = Array.from({ length: 24 }, (_, hour) => {
    const hourLogs = rangeLogs.filter(log => toShanghaiHour(new Date(log.visitedAt)) === hour);
    return trendPoint(`${String(hour).padStart(2, '0')}:00`, hourLogs);
  });

  const dailyTrends = dateKeys.map(dateKey => {
    const dayLogs = logs.filter(log => toShanghaiDateKey(new Date(log.visitedAt)) === dateKey);
    return trendPoint(shortDateLabel(dateKey), dayLogs);
  });

  return {
    range,
    rangePv: uniqueBy(rangeLogs, log => log.sessionId).length,
    rangeUv: new Set(rangeLogs.map(log => log.visitorId)).size,
    totalPv: allUniqueSessions.length,
    totalUv: new Set(logs.map(log => log.visitorId)).size,
    activeUsersLast5Min,
    latest: reversedUniqueRangeLogs.slice(0, latestLimit),
    hourlyTrends,
    dailyTrends,
    paths: countBreakdown(rangeLogs, log => log.path || '/', 5),
    geo: countBreakdown(rangeLogs, (log) => (
      [log.country, log.province, log.city]
        .filter(Boolean)
        .filter(item => item !== '未知')
        .join(' · ') || '未知'
    ), 5),
    generatedAt: new Date().toISOString(),
  };
};

export const getVisitStats = async (latestLimit = 100): Promise<VisitStats> => {
  const logs = await readVisitLogs();
  const today = toShanghaiDateKey(new Date());
  const todayLogs = logs.filter(log => toShanghaiDateKey(new Date(log.visitedAt)) === today);
  const uniqueTodaySessions = uniqueBy(todayLogs, log => log.sessionId);
  const uniqueAllSessions = uniqueBy(logs, log => log.sessionId);

  return {
    todayPv: uniqueTodaySessions.length,
    todayUv: new Set(todayLogs.map(log => log.visitorId)).size,
    totalPv: uniqueAllSessions.length,
    totalUv: new Set(logs.map(log => log.visitorId)).size,
    latest: uniqueBy([...logs].reverse(), log => log.sessionId).slice(0, latestLimit),
  };
};

export const setVisitCookies = (
  response: NextResponse,
  visitorId: string,
  sessionId: string,
) => {
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    ...COOKIE_OPTIONS,
    maxAge: VISITOR_MAX_AGE,
  });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE,
  });
};

const safeEqual = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
};

const adminSignature = (issuedAt: string) => {
  const token = process.env.ADMIN_TOKEN || '';
  return token ? createHmac('sha256', token).update(`hotsearch-admin:${issuedAt}`).digest('hex') : '';
};

export const isValidAdminToken = (token: string) => {
  const expected = process.env.ADMIN_TOKEN || '';
  return Boolean(expected && safeEqual(token, expected));
};

const getAdminCookieValue = () => {
  const issuedAt = String(Date.now());
  return `${issuedAt}.${adminSignature(issuedAt)}`;
};

const isAdminCookieValid = (value?: string) => {
  if (!value) return false;
  const [issuedAt, signature] = value.split('.');
  const issuedAtMs = Number(issuedAt);
  if (!issuedAt || !signature || !Number.isFinite(issuedAtMs)) return false;
  if (issuedAtMs > Date.now() || Date.now() - issuedAtMs > ADMIN_MAX_AGE_MS) return false;
  const expected = adminSignature(issuedAt);
  return Boolean(expected && safeEqual(signature, expected));
};

export const setAdminCookie = (
  response: NextResponse,
) => {
  response.cookies.set(ADMIN_COOKIE, getAdminCookieValue(), {
    ...COOKIE_OPTIONS,
    maxAge: ADMIN_MAX_AGE,
  });
};

export const clearAdminCookie = (
  response: NextResponse,
) => {
  response.cookies.set(ADMIN_COOKIE, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
};

export const isAdminAuthenticated = (cookieStore: ReadonlyRequestCookies) => {
  return isAdminCookieValid(cookieStore.get(ADMIN_COOKIE)?.value);
};

export const isAdminRequestAuthenticated = (request: NextRequest) => {
  return isAdminCookieValid(request.cookies.get(ADMIN_COOKIE)?.value);
};
