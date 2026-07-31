'use client';

import { Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { ThemeMode } from './types';

interface DashboardIntroProps {
  currentClockDate: string;
  currentClockTime: string;
  theme: ThemeMode;
}

interface DashboardClockProps extends DashboardIntroProps {
  className?: string;
}

const HEADLINES = [
  '今天，全网都在聊什么',
  '今天，值得关注的都在这里',
  '热点很多，我们先帮你筛一遍',
  '一分钟，看遍今天',
  '少一点噪音，多一点价值',
  '一个页面，看遍全网',
  '摸鱼五分钟，热点全知道',
  '今天，从重要开始',
  '全网热点，一页掌握',
  '今天的新鲜事，都在这里',
  '别急着刷，先看重点',
  '此刻热门，一眼看完',
  '今天发生了什么',
  '先看热点，再慢慢摸鱼',
  '全网正在关注什么',
  '今天的重点，已经整理好了',
  '信息太多，只看值得看的',
  '热闹全网，重点在这里',
  '不用到处刷，一页就够',
  '今天的热门，不错过',
  '看看此刻，大家都在聊什么',
  '热点不迷路，重点直接看',
  '从全网热闹里，找到真正重要的',
  '每天几分钟，热点都清楚',
  '今天的互联网，在聊这些',
  '全网有多热，一看就知道',
  '重要的消息，值得先看',
  '打开这一页，跟上今天',
] as const;

export function DashboardIntro({
  currentClockDate,
  currentClockTime,
  theme,
}: DashboardIntroProps) {
  const dark = theme === 'dark';
  const [headline, setHeadline] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHeadline(getDailyHeadline(currentClockDate));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentClockDate]);

  return (
    <section className="dashboard-intro relative flex min-h-[120px] flex-col rounded-3xl px-1 pb-2 pt-[6px] md:h-[72px] md:min-h-0 md:px-0">
      <div className="min-w-0">
        <h2
          className={`dashboard-intro-title ml-[7px] mt-2 max-w-[820px] text-[32px] font-bold leading-[1.14] tracking-[-0.02em] md:mt-0 md:text-[36px] xl:text-[42px] ${
            dark ? 'text-white' : 'text-[#080b12]'
          }`}
        >
          <span
            aria-live="polite"
            className={`inline-block will-change-[transform,opacity,filter] transition-[opacity,transform,filter,letter-spacing] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transform-none motion-reduce:blur-none motion-reduce:transition-none ${
              headline
                ? 'translate-y-0 tracking-[inherit] opacity-100 blur-0'
                : 'translate-y-2 tracking-[0.035em] opacity-0 blur-[2px]'
            }`}
          >
            {headline || HEADLINES[0]}
          </span>
        </h2>
      </div>

      <div className="dashboard-intro-clock-placement mt-3 md:absolute md:-right-2 md:top-[6px] md:mt-0">
        <DashboardClock
          currentClockDate={currentClockDate}
          currentClockTime={currentClockTime}
          theme={theme}
        />
      </div>
    </section>
  );
}

function getDailyHeadline(dateKey: string): string {
  if (!dateKey) return HEADLINES[0];

  let hash = 0;
  for (const character of dateKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return HEADLINES[hash % HEADLINES.length];
}

export function DashboardClock({
  className = '',
  currentClockDate,
  currentClockTime,
  theme,
}: DashboardClockProps) {
  const dark = theme === 'dark';
  const weekday = currentClockDate.match(/星期(.)$/)?.[1];
  const compactTime = currentClockTime.slice(0, 5);

  return (
    <div
      className={`dashboard-intro-clock ${className} flex h-11 min-w-[180px] max-w-60 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-[14px] font-extrabold ${
        dark
          ? 'border-white/[0.08] bg-white/[0.045] text-slate-400'
          : 'border-slate-900/[0.055] bg-white/80 text-slate-600 shadow-[0_8px_24px_rgba(30,41,59,0.04)]'
      }`}
    >
      <span className="dashboard-clock-date flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
        <span>{weekday ? `周${weekday}` : '今日'}</span>
      </span>
      <span className={`dashboard-clock-separator ${dark ? 'text-slate-700' : 'text-slate-300'}`}>·</span>
      <span className="dashboard-clock-time flex items-center gap-2">
        <span className="font-mono tabular-nums">{compactTime || '--:--'}</span>
        <Sun className="size-[18px] text-amber-500" fill="currentColor" strokeWidth={1.8} />
      </span>
    </div>
  );
}
