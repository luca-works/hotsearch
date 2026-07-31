import { Clock, Inbox, RefreshCw, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { BoardItem } from './BoardItem';
import type { BoardState, Platform, ThemeMode } from './types';

import { formatNumber } from '@/lib/utils';

interface BoardCardProps {
  fetchBoardData: (platform: Platform) => void;
  platform: Platform;
  state: BoardState;
  theme: ThemeMode;
}

export function BoardCard({
  fetchBoardData,
  platform,
  state,
  theme,
}: BoardCardProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return state.data;
    return state.data.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [state.data, searchQuery]);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.section
      key={platform.value}
      id={`card-${platform.value}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered ? `${platform.accentColor}50` : undefined,
        boxShadow: isHovered
          ? theme === 'dark'
            ? `0 8px 32px ${platform.accentColor}18`
            : `0 8px 24px ${platform.accentColor}12`
          : undefined,
      }}
      className={`backdrop-glass group/card flex h-fit flex-col overflow-hidden rounded-xl transition-all duration-300 ${
        theme === 'dark'
          ? 'border border-white/[0.08] bg-[#0b0e1b]/45 shadow-[0_8px_24px_rgba(2,4,10,0.3)]'
          : 'border border-white/60 bg-white/45 shadow-[0_8px_24px_rgba(31,38,135,0.03)]'
      }`}
    >
      <div className={`flex items-center justify-between border-b p-3.5 transition-colors relative ${theme === 'dark' ? 'border-[#1b223c]/45 bg-[#0e1224]/30' : 'border-slate-200/30 bg-slate-50/40'}`}>
        {!showSearch ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-lg p-1.5" style={{ backgroundColor: `${platform.accentColor}12`, color: platform.accentColor }}>
                <Image
                  src={`/${platform.value}.svg`}
                  alt={`${platform.label}${platform.tip}`}
                  width={18}
                  height={18}
                  className="size-[18px]"
                />
              </div>
              <div>
                <h4 className={`flex items-center gap-1.5 text-[15.5px] font-bold tracking-tight ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                  {platform.label}
                </h4>
                <p className={`mt-0.5 text-[12px] font-bold leading-none ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {platform.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                title="搜索榜单条目"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-[#1a263f]/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Search className="size-3.5" />
              </button>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[11.5px] font-bold tracking-wider ${
                  platform.category === 'tech'
                    ? theme === 'dark'
                      ? 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                      : 'border border-indigo-200/70 bg-indigo-50 text-indigo-600'
                    : platform.category === 'ent'
                    ? theme === 'dark'
                      ? 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                      : 'border border-rose-200/70 bg-rose-50 text-rose-600'
                    : theme === 'dark'
                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border border-emerald-200/70 bg-emerald-50 text-emerald-600'
                }`}
              >
                {platform.category === 'tech' ? '科技' : platform.category === 'ent' ? '文娱' : '综合'}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center w-full gap-2 relative">
            <Search className={`size-3.5 absolute left-2 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              autoFocus
              type="text"
              placeholder={`搜索 ${platform.label} 热搜...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-1 pl-7 pr-8 rounded-lg text-[12.5px] font-bold shadow-inner outline-none transition ${
                theme === 'dark'
                  ? 'border border-[#1e2942] bg-[#0b0e1b]/80 text-white placeholder:text-slate-600 focus:border-[#ff8200]/40'
                  : 'border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#ff8200]/40'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              title="关闭搜索"
              className={`p-1 absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md transition-colors cursor-pointer ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className={`custom-scrollbar h-[320px] shrink-0 divide-y overflow-y-auto px-1 py-0 ${theme === 'dark' ? 'divide-[#1e2942]/10' : 'divide-slate-100/70'}`}>
        {state.loading && state.data.length === 0 ? (
          <div className="divide-y divide-transparent overflow-hidden">
            {Array.from({ length: 8 }, (_, index) => {
              const widths = ['w-[80%]', 'w-[60%]', 'w-[75%]', 'w-[45%]', 'w-[70%]', 'w-[85%]', 'w-[50%]', 'w-[65%]'];
              const widthClass = widths[index % widths.length];
              return (
                <div key={index} className="flex h-[40px] animate-pulse items-center gap-2.5 px-3.5">
                  <div className={`h-3.5 w-4 shrink-0 rounded ${theme === 'dark' ? 'bg-[#141b2c]' : 'bg-slate-100'}`} />
                  <div className="flex-grow">
                    <div className={`h-3 ${widthClass} rounded ${theme === 'dark' ? 'bg-[#141b2c]' : 'bg-slate-100'}`} />
                  </div>
                  <div className={`h-2.5 w-8 shrink-0 rounded ${theme === 'dark' ? 'bg-[#141b2c]' : 'bg-slate-100'}`} />
                </div>
              );
            })}
          </div>
        ) : state.error && state.data.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center p-6 text-center">
            <p className="mb-2 text-[13px] font-bold text-rose-500">{state.error}</p>
            <button
              onClick={() => fetchBoardData(platform)}
              type="button"
              className={`text-[13px] font-bold underline ${theme === 'dark' ? 'text-indigo-400 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              重试加载
            </button>
          </div>
        ) : state.data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex h-[320px] flex-col items-center justify-center overflow-hidden p-6 text-center"
          >
            <div className={`pointer-events-none absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr opacity-20 blur-2xl ${theme === 'dark' ? 'from-[#ff8200] to-indigo-500' : 'from-[#ff8200] to-indigo-300'}`} />
            <div className={`relative mb-3.5 flex items-center justify-center rounded-full border p-4 ${theme === 'dark' ? 'border-slate-800/80 bg-slate-900/40 text-slate-400' : 'border-slate-200/50 bg-white text-slate-500 shadow-sm'}`}>
              <Inbox className="size-6" />
            </div>
            <h4 className={`z-10 mb-1.5 text-[15px] font-bold tracking-tight ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
              本日榜单虚位以待
            </h4>
            <p className={`z-10 mx-auto mb-4 max-w-[220px] text-[13px] leading-relaxed ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              未检索到该平台的最新舆情。可能由于数据正在后台刷新或暂无大事件发布。
            </p>
            <button
              onClick={() => fetchBoardData(platform)}
              disabled={state.loading}
              type="button"
              className={`z-10 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12.5px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                theme === 'dark'
                  ? 'border-orange-500/20 bg-orange-500/10 text-[#ff8200] hover:bg-orange-500/20'
                  : 'border-orange-200 bg-orange-50 text-[#ff8200] hover:bg-orange-100'
              }`}
            >
              <RefreshCw className={`size-3 ${state.loading ? 'animate-spin' : ''}`} />
              <span>重新拉取榜单</span>
            </button>
          </motion.div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center p-6 text-center select-none">
            <p className={`text-[13.5px] font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>没有找到匹配的热搜条目</p>
          </div>
        ) : (
          filteredData.map((item) => {
            const originalRank = state.data.findIndex(origItem => origItem.title === item.title) + 1;
            return (
              <BoardItem
                key={item.id || `${platform.value}-${originalRank}`}
                item={{ ...item, hot: item.hot ? String(formatNumber(item.hot)) : item.tip }}
                rank={originalRank > 0 ? originalRank : 1}
                theme={theme}
                searchQuery={searchQuery}
              />
            );
          })
        )}
      </div>

      <div className={`hot-card-footer flex shrink-0 select-none items-center justify-between border-t px-4 py-2.5 text-[12.5px] font-bold ${theme === 'dark' ? 'border-[#1b223c]/40 bg-[#0b0e1b]/40 text-slate-400' : 'border-slate-200/30 bg-slate-50/30 text-slate-500'}`}>
        <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <Clock className="size-3 shrink-0 text-slate-500" />
          <span>更新时间:</span>
          <span className="whitespace-nowrap font-bold">{state.updateTime || '未知时间'}</span>
        </div>
        <button
          onClick={() => fetchBoardData(platform)}
          disabled={state.loading}
          type="button"
          title="刷新数据"
          className={`cursor-pointer rounded-md border p-[5px] transition-all ${
            theme === 'dark'
              ? 'border-[#232f4b]/30 bg-[#162035]/30 text-slate-400 hover:bg-[#1f2d4e]/50 hover:text-white'
              : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <RefreshCw className={`size-3 ${state.loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </motion.section>
  );
}
