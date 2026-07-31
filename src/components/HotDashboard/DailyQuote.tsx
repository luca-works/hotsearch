'use client';

import { Check, Copy, Quote, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ThemeMode } from './types';

const FISH_QUOTES = [
  '上班可以累，摸鱼不能停。愿你在喧嚣的数字洪流中拥有一块理性的沙滩。',
  '代码写得好，下班回家早。摸鱼摸得妙，心情少烦恼。',
  '今日无大事，唯有摸鱼真。按时下班，是对生活最好的尊重。',
  '少写一个 Bug，多看一刻热搜。劳逸结合，才是极客修养。',
  '生活不止眼前的需求，还有诗和远方的热搜。',
  '摸鱼不是偷懒，而是给灵魂进行适度的系统重置。',
  '没有解决不了的 Bug，只有还没到时间的下班声音。',
  '理性观热搜，沉着应对，做自己生活的掌控者。',
  '风浪越大，鱼越贵；代码越稳，心越静。',
  '按时吃饭，快乐摸鱼，把健康和好心情留在第一位。',
  '保持好奇，拥抱未知，在数据海洋里捕捉真实的世界。',
  '工作是生活的调味剂，快乐才是人生的大主线。',
];

interface DailyQuoteProps {
  theme: ThemeMode;
}

export function DailyQuote({ theme }: DailyQuoteProps) {
  // Stable quote based on day of the year
  const initialIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear % FISH_QUOTES.length;
  }, []);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copied, setCopied] = useState(false);

  const handleNextQuote = () => {
    setCurrentIndex(prev => (prev + 1) % FISH_QUOTES.length);
  };

  const handleCopyQuote = () => {
    void navigator.clipboard.writeText(FISH_QUOTES[currentIndex]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto my-6 max-w-7xl 2xl:max-w-[1536px] px-4 md:px-6 select-none">
      <div
        className={`backdrop-glass relative flex flex-col items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 sm:flex-row transition-all duration-300 ${
          theme === 'dark'
            ? 'border-white/[0.07] bg-[#0c0f20]/50 text-slate-300 shadow-[0_4px_20px_rgba(2,4,10,0.2)]'
            : 'border-white/80 bg-white/70 text-slate-700 shadow-[0_4px_20px_rgba(31,38,135,0.03)]'
        }`}
      >
        {/* Quote content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${
            theme === 'dark'
              ? 'border-orange-500/20 bg-orange-500/10 text-orange-400'
              : 'border-orange-200 bg-orange-50 text-orange-600'
          }`}>
            <Quote className="size-4 opacity-90" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>
                摸鱼金句 · 解压一言
              </span>
            </div>
            <p className={`mt-0.5 text-xs font-semibold leading-relaxed tracking-wide ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              “{FISH_QUOTES[currentIndex]}”
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleNextQuote}
            title="换一句"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="size-3 text-orange-500" />
            <span>换一句</span>
          </button>

          <button
            type="button"
            onClick={handleCopyQuote}
            title="复制金句"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-500 animate-pulse" />
                <span className="text-emerald-500">已复制</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
