import { Flame } from 'lucide-react';

import type { ThemeMode } from './types';

interface DashboardFooterProps {
  platformsCount: number;
  theme: ThemeMode;
}

export function DashboardFooter({ platformsCount, theme }: DashboardFooterProps) {
  return (
    <footer className={`relative z-10 shrink-0 border-t py-3 text-[13px] transition-colors duration-300 ${theme === 'dark' ? 'border-slate-900/50 text-slate-500' : 'border-slate-200/60 text-slate-400'}`}>
      <div className="mx-auto flex max-w-[1536px] flex-col items-center justify-between gap-4 px-5 min-[1181px]:px-12 sm:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-700 dark:text-slate-300">
            <Flame className="size-4 text-[#ff451b]" fill="currentColor" aria-hidden="true" />
            <span>摸鱼热榜</span>
            <span className="font-mono text-[11px] font-bold tracking-widest opacity-60">HOTBOARD</span>
          </div>
          <span className="hidden h-3 w-px bg-slate-500/15 sm:inline" />
          <div className="flex items-center gap-1.5 text-[12.5px] opacity-80">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            <span>{platformsCount}+ 平台实时聚合 · 每天摸鱼从这里开始</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center text-[12.5px] sm:items-end sm:text-right">
          <p className="font-bold text-slate-500 dark:text-slate-400">
            © 2026 今日热榜 · 上班可以累，摸鱼不能停
          </p>
        </div>
      </div>
    </footer>
  );
}
