'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import type { Platform, ThemeMode } from './types';

interface DashboardSidebarProps {
  focusItems: Array<{ platform: Platform; item: App.HotListItem }>;
  theme: ThemeMode;
}

const MOODS = [
  { emoji: '😴', label: '躺平' },
  { emoji: '😌', label: '佛系' },
  { emoji: '😊', label: '开心' },
  { emoji: '😎', label: '自信' },
  { emoji: '🤯', label: '爆炸' },
] as const;

const MOOD_STORAGE_KEY = 'hotsearch-today-mood';

export function DashboardSidebar({ focusItems, theme }: DashboardSidebarProps) {
  const dark = theme === 'dark';
  const [activeMood, setActiveMood] = useState<string | null>(null);

  useEffect(() => {
    const hydrationFrame = window.requestAnimationFrame(() => {
      try {
        const savedMood = window.localStorage.getItem(MOOD_STORAGE_KEY);
        setActiveMood(MOODS.some(mood => mood.label === savedMood) ? savedMood : '开心');
      } catch {
        setActiveMood('开心');
      }
    });
    return () => window.cancelAnimationFrame(hydrationFrame);
  }, []);

  const selectMood = (mood: string) => {
    setActiveMood(mood);
    try {
      window.localStorage.setItem(MOOD_STORAGE_KEY, mood);
    } catch {
      // Mood selection still works for the current session.
    }
  };

  return (
    <aside className="dashboard-sidebar flex flex-col gap-[21px] min-[961px]:min-h-0 min-[961px]:flex-1">
      <section className={`dashboard-focus-card ${sideCardClass(dark)} px-6 py-5 min-[961px]:h-[320px]`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-[24px] font-black tracking-[-0.04em] ${dark ? 'text-white' : 'text-[#121a2e]'}`}>大家都在看</h3>
            <p className={`mt-1.5 text-[15px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              从不同平台发现此刻热门
            </p>
          </div>
        </div>

        <div className="mt-4 grid">
          {focusItems.length ? focusItems.map(({ item, platform }, index) => (
            <a
              key={`${platform.value}-${item.id}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={`dashboard-focus-row group/focus grid min-h-[55px] grid-cols-[30px_minmax(0,1fr)_70px_16px] items-center gap-2 border-b transition last:border-b-0 ${
                dark ? 'border-white/[0.06] hover:bg-white/[0.035]' : 'border-slate-200/65 hover:bg-slate-500/[0.025]'
              }`}
            >
              <span className={`font-mono text-sm font-black tabular-nums ${index < 3 ? 'text-[#ff6a2c]' : dark ? 'text-slate-600' : 'text-slate-400'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <OverflowTitle dark={dark} title={item.title} />
              <span className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Image src={`/${platform.value}.svg`} alt="" width={18} height={18} className="size-[18px] shrink-0 rounded" />
                <span className="whitespace-nowrap">{platform.label}</span>
              </span>
              <ChevronRight className={`size-4 transition group-hover/focus:translate-x-0.5 ${dark ? 'text-slate-700' : 'text-slate-300'}`} />
            </a>
          )) : (
            <p className={`py-20 text-center text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
              其他平台正在同步中
            </p>
          )}
        </div>
      </section>

      <section className={`dashboard-mood-card ${sideCardClass(dark)} min-h-[176px] overflow-hidden px-[18px] py-4 min-[961px]:flex-1`}>
        <div className="dashboard-mood-header flex items-end justify-between gap-3">
          <h3 className={`text-[24px] font-black tracking-[-0.04em] ${dark ? 'text-white' : 'text-[#121a2e]'}`}>今日心情</h3>
          <p className={`pb-0.5 text-[13px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>今天感觉如何？</p>
        </div>
        <div className={`dashboard-mood-options mt-3 grid grid-cols-5 gap-1.5 rounded-2xl p-1.5 ${dark ? 'bg-white/[0.035]' : 'bg-slate-100/75'}`}>
          {MOODS.map(mood => {
            const active = activeMood === mood.label;
            return (
              <button
                key={mood.label}
                type="button"
                aria-pressed={active}
                onClick={() => selectMood(mood.label)}
                className={`dashboard-mood-button flex h-[76px] min-w-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border text-center transition duration-200 active:scale-[0.97] ${
                  active
                    ? dark
                      ? 'border-orange-400/30 bg-orange-400/10 text-orange-200 shadow-[0_6px_18px_rgba(0,0,0,0.12)]'
                      : 'border-[#ffc3ad] bg-white text-[#f25f38] shadow-[0_6px_18px_rgba(255,106,44,0.10)]'
                    : dark
                      ? 'border-transparent bg-transparent text-slate-500 hover:bg-white/[0.055] hover:text-slate-300'
                      : 'border-transparent bg-transparent text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
              >
                <span className="dashboard-mood-emoji text-[27px] leading-none" aria-hidden="true">{mood.emoji}</span>
                <span className="dashboard-mood-label text-[12px] font-bold">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function sideCardClass(dark: boolean) {
  return `rounded-[28px] border ${
    dark
      ? 'border-white/[0.08] bg-[#101520]/78 shadow-[0_22px_60px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]'
      : 'border-slate-900/[0.05] bg-white/90 shadow-[0_12px_36px_rgba(60,74,106,0.065),inset_0_1px_0_rgba(255,255,255,0.92)]'
  }`;
}

function OverflowTitle({ dark, title }: { dark: boolean; title: string }) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;
    const measureOverflow = () => setIsOverflowing(element.scrollWidth > element.clientWidth);
    measureOverflow();
    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [title]);

  return (
    <span className="group/title relative min-w-0">
      <span
        ref={titleRef}
        className={`block truncate text-[15px] font-bold ${dark ? 'text-slate-300 group-hover/focus:text-orange-300' : 'text-slate-700 group-hover/focus:text-[#e85d22]'}`}
      >
        {title}
      </span>
      {isOverflowing ? (
        <span className={`pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-max max-w-[360px] whitespace-normal rounded-xl border px-3 py-2 text-sm font-semibold leading-5 shadow-xl group-hover/title:block group-focus-within/title:block ${
          dark ? 'border-white/10 bg-[#171d2a] text-slate-100' : 'border-slate-200 bg-white text-slate-800'
        }`}>
          {title}
        </span>
      ) : null}
    </span>
  );
}
