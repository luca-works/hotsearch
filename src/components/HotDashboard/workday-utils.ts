export const DEFAULT_WORKDAY_CONFIG: WorkdayConfig = {
  workStart: '09:00',
  workEnd: '19:30',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  workdays: [1, 2, 3, 4, 5],
  showSeconds: true,
};

export const WORKDAY_CONFIG_KEY = 'hot-dashboard-workday-config';
export const LEGACY_OFF_WORK_TIME_KEY = 'hot-dashboard-off-work-time';

export type WorkdayConfig = {
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
  workdays: number[];
  showSeconds: boolean;
};

export type WorkdayPhase =
  | 'before-work'
  | 'working'
  | 'lunch'
  | 'almost-off'
  | 'off-work'
  | 'weekend';

export type DayScene = 'morning' | 'afternoon' | 'sunset' | 'night';

export type WorkdayCountdownState = {
  now: Date;
  phase: WorkdayPhase;
  scene: DayScene;
  progress: number;
  remainingMs: number;
  totalWorkingMs: number;
  headline: string;
  statusText: string;
  footerText: string;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return hour * 60 + minute;
}

export function validateWorkdayConfig(config: WorkdayConfig): string | null {
  const workStart = parseTimeToMinutes(config.workStart);
  const workEnd = parseTimeToMinutes(config.workEnd);
  const lunchStart = parseTimeToMinutes(config.lunchStart);
  const lunchEnd = parseTimeToMinutes(config.lunchEnd);

  if (workStart === null || workEnd === null || lunchStart === null || lunchEnd === null) {
    return '请填写有效的时间';
  }
  if (workStart >= workEnd) return '下班时间必须晚于上班时间';
  if (lunchStart >= lunchEnd || lunchStart < workStart || lunchEnd > workEnd) {
    return '午休时间必须处于上班和下班之间';
  }
  if (!config.workdays.length || config.workdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) {
    return '至少选择一个工作日';
  }

  return null;
}

export function normalizeWorkdayConfig(input: Partial<WorkdayConfig> | null | undefined): WorkdayConfig {
  const candidate: WorkdayConfig = {
    ...DEFAULT_WORKDAY_CONFIG,
    ...input,
    workdays: Array.isArray(input?.workdays) ? input.workdays : DEFAULT_WORKDAY_CONFIG.workdays,
  };

  return validateWorkdayConfig(candidate) ? DEFAULT_WORKDAY_CONFIG : candidate;
}

export function readWorkdayConfig(storage: Pick<Storage, 'getItem'> | undefined): WorkdayConfig {
  if (!storage) return DEFAULT_WORKDAY_CONFIG;

  const serialized = storage.getItem(WORKDAY_CONFIG_KEY);
  if (serialized) {
    try {
      return normalizeWorkdayConfig(JSON.parse(serialized) as Partial<WorkdayConfig>);
    } catch {
      return DEFAULT_WORKDAY_CONFIG;
    }
  }

  const legacyOffWorkTime = storage.getItem(LEGACY_OFF_WORK_TIME_KEY);
  return legacyOffWorkTime
    ? normalizeWorkdayConfig({ workEnd: legacyOffWorkTime })
    : DEFAULT_WORKDAY_CONFIG;
}

export function atLocalTime(date: Date, time: string): Date {
  const minutes = parseTimeToMinutes(time) ?? 0;
  const result = new Date(date);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

export function getDayScene(date: Date): DayScene {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 5 * 60 && minutes < 11 * 60) return 'morning';
  if (minutes >= 11 * 60 && minutes < 16 * 60 + 30) return 'afternoon';
  if (minutes >= 16 * 60 + 30 && minutes < 19 * 60 + 30) return 'sunset';
  return 'night';
}

export function getNextWorkdayStart(date: Date, config: WorkdayConfig): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 7; offset += 1) {
    if (config.workdays.includes(result.getDay())) {
      return atLocalTime(result, config.workStart);
    }
    result.setDate(result.getDate() + 1);
  }

  return atLocalTime(date, config.workStart);
}

export function getWorkdayProgress(now: Date, config: WorkdayConfig): number {
  if (!config.workdays.includes(now.getDay())) return 0;

  const workStart = atLocalTime(now, config.workStart);
  const workEnd = atLocalTime(now, config.workEnd);
  const lunchStart = atLocalTime(now, config.lunchStart);
  const lunchEnd = atLocalTime(now, config.lunchEnd);
  const totalWorkingMs = workEnd.getTime() - workStart.getTime() - (lunchEnd.getTime() - lunchStart.getTime());

  if (now <= workStart) return 0;
  if (now >= workEnd) return 100;

  let elapsedWorkingMs = now.getTime() - workStart.getTime();
  if (now > lunchStart) {
    elapsedWorkingMs -= Math.min(now.getTime(), lunchEnd.getTime()) - lunchStart.getTime();
  }

  return clamp((elapsedWorkingMs / totalWorkingMs) * 100, 0, 100);
}

export function getWorkdayCountdownState(now: Date, rawConfig: WorkdayConfig): WorkdayCountdownState {
  const config = normalizeWorkdayConfig(rawConfig);
  const scene = getDayScene(now);
  const isWorkday = config.workdays.includes(now.getDay());
  const workStart = atLocalTime(now, config.workStart);
  const workEnd = atLocalTime(now, config.workEnd);
  const lunchStart = atLocalTime(now, config.lunchStart);
  const lunchEnd = atLocalTime(now, config.lunchEnd);
  const totalWorkingMs = workEnd.getTime() - workStart.getTime() - (lunchEnd.getTime() - lunchStart.getTime());
  const progress = getWorkdayProgress(now, config);
  const weekendFooter = now.getDay() === 5 ? '今天下班就是周末 🎉' : '今天也要给自己留一点时间 🌿';

  if (!isWorkday) {
    const nextStart = getNextWorkdayStart(now, config);
    return {
      now,
      phase: 'weekend',
      scene,
      progress: 100,
      remainingMs: Math.max(nextStart.getTime() - now.getTime(), 0),
      totalWorkingMs,
      headline: '周末进行中',
      statusText: '享受美好周末时光～ 🛋️',
      footerText: `下周${weekdayLabel(nextStart.getDay())} ${config.workStart} 再见`,
    };
  }

  if (now < workStart) {
    return {
      now,
      phase: 'before-work',
      scene,
      progress,
      remainingMs: workStart.getTime() - now.getTime(),
      totalWorkingMs,
      headline: '距离上班还有',
      statusText: '今天也是元气满满的一天！ 🌱',
      footerText: weekendFooter,
    };
  }

  if (now >= workEnd) {
    return {
      now,
      phase: 'off-work',
      scene,
      progress: 100,
      remainingMs: 0,
      totalWorkingMs,
      headline: '下班啦！',
      statusText: '自由时间开始！ 🎉',
      footerText: weekendFooter,
    };
  }

  if (now >= lunchStart && now < lunchEnd) {
    return {
      now,
      phase: 'lunch',
      scene,
      progress,
      remainingMs: lunchEnd.getTime() - now.getTime(),
      totalWorkingMs,
      headline: '距离午休结束还有',
      statusText: '困了？喝杯咖啡继续！ ☕',
      footerText: '午休一下，下午继续',
    };
  }

  const remainingMs = workEnd.getTime() - now.getTime();
  const phase: WorkdayPhase = remainingMs <= HOUR_MS ? 'almost-off' : 'working';
  return {
    now,
    phase,
    scene,
    progress,
    remainingMs,
    totalWorkingMs,
    headline: '距离下班还有',
    statusText: getSceneStatus(scene),
    footerText: weekendFooter,
  };
}

function getSceneStatus(scene: DayScene): string {
  if (scene === 'morning') return '新的一天，加油鸭！ 💪';
  if (scene === 'afternoon') return '下午茶时间，稳住别浪～ ☕';
  if (scene === 'sunset') return '夕阳已就位，就等下班的你 🌇';
  return '夜深了，早点回家休息吧 🌙';
}

function weekdayLabel(day: number): string {
  return ['日', '一', '二', '三', '四', '五', '六'][day] || '一';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
