'use client';

import { Check, ChevronLeft, ChevronRight, Flame, Inbox, RefreshCw, SearchX, SlidersHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { filterBoardItems, findItemRank } from './dashboard-model';
import type { BoardState, Platform, ThemeMode } from './types';

import { formatNumber } from '@/lib/utils';

interface FeaturedBoardProps {
  aggregate?: boolean;
  customizeOptions?: Platform[];
  homePlatformValues?: string[];
  itemLimit?: number;
  onHomePlatformsChange?: (values: string[]) => void;
  onPlatformChange?: (value: string) => void;
  onRefresh: (platform: Platform) => void;
  platform: Platform;
  platformOptions?: Platform[];
  searchQuery: string;
  state: BoardState;
  theme: ThemeMode;
}

export function FeaturedBoard({
  aggregate = false,
  customizeOptions,
  homePlatformValues,
  itemLimit = 12,
  onHomePlatformsChange,
  onPlatformChange,
  onRefresh,
  platform,
  platformOptions,
  searchQuery,
  state,
  theme,
}: FeaturedBoardProps) {
  const dark = theme === 'dark';
  const [isHomeEditorOpen, setIsHomeEditorOpen] = useState(false);
  const [pillScrollState, setPillScrollState] = useState({ left: false, right: false });
  const activePlatformPillRef = useRef<HTMLButtonElement>(null);
  const homeEditorRef = useRef<HTMLDivElement>(null);
  const pillScrollerRef = useRef<HTMLDivElement>(null);
  const filteredData = useMemo(
    () => filterBoardItems(state.data, searchQuery),
    [searchQuery, state.data],
  );

  const canSwitchPlatform = Boolean(onPlatformChange && platformOptions && platformOptions.length > 1);

  useEffect(() => {
    activePlatformPillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [platform.value]);

  useEffect(() => {
    const scroller = pillScrollerRef.current;
    if (!scroller) return;
    const updateScrollState = () => {
      setPillScrollState({
        left: scroller.scrollLeft > 4,
        right: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4,
      });
    };
    updateScrollState();
    scroller.addEventListener('scroll', updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [platformOptions]);

  useEffect(() => {
    if (!isHomeEditorOpen) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!homeEditorRef.current?.contains(event.target as Node)) setIsHomeEditorOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsHomeEditorOpen(false);
    };
    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isHomeEditorOpen]);

  const toggleHomePlatform = (value: string) => {
    if (!homePlatformValues || !onHomePlatformsChange) return;
    if (homePlatformValues.includes(value)) {
      if (homePlatformValues.length > 1) onHomePlatformsChange(homePlatformValues.filter(item => item !== value));
      return;
    }
    if (homePlatformValues.length < 6) onHomePlatformsChange([...homePlatformValues, value]);
  };

  return (
    <section
      id={`board-${platform.value}`}
      className={`featured-board relative flex min-h-[697px] flex-col overflow-hidden rounded-[28px] border min-[961px]:min-h-0 min-[961px]:flex-1 ${
        dark
          ? 'border-white/[0.08] bg-[#101520]/78 shadow-[0_28px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]'
          : 'border-slate-900/[0.05] bg-white/90 shadow-[0_12px_36px_rgba(60,74,106,0.065),inset_0_1px_0_rgba(255,255,255,0.92)]'
      }`}
    >
      <div className="featured-board-header flex items-start gap-4 px-5 pb-[9px] pt-6 md:px-6">
        {canSwitchPlatform && platformOptions && onPlatformChange ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {pillScrollState.left ? (
                <button
                  type="button"
                  aria-label="向左查看更多平台"
                  onClick={() => pillScrollerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                  className={`featured-board-scroll-control flex size-7 shrink-0 cursor-pointer items-center justify-center bg-transparent transition max-md:hidden ${dark ? 'text-slate-600 hover:text-slate-300' : 'text-slate-300 hover:text-slate-500'}`}
                >
                  <ChevronLeft className="size-4" />
                </button>
              ) : null}
              <div
                ref={pillScrollerRef}
                className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
              {platformOptions.map(option => {
                const active = option.value === platform.value;
                return (
                  <button
                    key={option.value}
                    ref={active ? activePlatformPillRef : undefined}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPlatformChange(option.value)}
                    className={`group/pill flex cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-center text-[14px] font-extrabold transition duration-200 active:scale-[0.98] ${
                      platformOptions.length <= 6 ? 'min-w-[112px] flex-1' : 'shrink-0'
                    } ${
                      active
                        ? dark
                          ? 'border-orange-300/25 bg-gradient-to-b from-orange-400/20 to-orange-500/10 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.12)]'
                          : 'border-[#ff6a2c]/15 bg-gradient-to-b from-[#ff7a45] to-[#ff5f35] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_rgba(255,106,44,0.2)]'
                        : dark
                          ? 'border-white/[0.08] bg-white/[0.035] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-px hover:bg-white/[0.07] hover:text-white'
                          : 'border-slate-200/80 bg-white/90 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(30,41,59,0.04)] hover:-translate-y-px hover:border-slate-300 hover:text-slate-900 hover:shadow-[0_6px_16px_rgba(30,41,59,0.08)]'
                    }`}
                  >
                    <span className={`flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md ${active ? 'bg-white/95 p-0.5' : ''}`}>
                      <Image src={`/${option.value}.svg`} alt="" width={20} height={20} className="size-5 rounded-[5px]" />
                    </span>
                    <span className="whitespace-nowrap">{option.label}</span>
                  </button>
                );
              })}
              </div>
              {pillScrollState.right ? (
                <button
                  type="button"
                  aria-label="向右查看更多平台"
                  onClick={() => pillScrollerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                  className={`featured-board-scroll-control flex size-7 shrink-0 cursor-pointer items-center justify-center bg-transparent transition max-md:hidden ${dark ? 'text-slate-600 hover:text-slate-300' : 'text-slate-300 hover:text-slate-500'}`}
                >
                  <ChevronRight className="size-4" />
                </button>
              ) : null}
            </div>
            {customizeOptions && homePlatformValues && onHomePlatformsChange ? (
              <div ref={homeEditorRef} className="featured-board-home-editor relative shrink-0 max-md:hidden">
                <button
                  type="button"
                  aria-expanded={isHomeEditorOpen}
                  onClick={() => setIsHomeEditorOpen(open => !open)}
                  title="编辑首页平台"
                  className={`flex size-10 cursor-pointer items-center justify-center rounded-full border transition ${
                    dark
                      ? 'border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                </button>

                {isHomeEditorOpen ? (
                  <div className={`absolute right-0 top-12 z-40 w-[min(620px,calc(100vw-48px))] rounded-2xl border p-4 shadow-[0_24px_70px_rgba(30,41,59,0.2)] ${
                    dark ? 'border-white/[0.1] bg-[#151a25]' : 'border-slate-200/80 bg-white'
                  }`}>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className={`text-[15px] font-black ${dark ? 'text-white' : 'text-slate-900'}`}>选择首页平台</p>
                        <p className={`mt-0.5 text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>点击即可添加或移除，最多展示 6 个</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${homePlatformValues.length === 6 ? 'bg-orange-50 text-[#ef6038]' : dark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        {homePlatformValues.length}/6
                      </span>
                    </div>
                    <div className="custom-scrollbar grid max-h-[330px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                      {customizeOptions.map(option => {
                        const selected = homePlatformValues.includes(option.value);
                        const disabled = !selected && homePlatformValues.length >= 6;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            disabled={disabled}
                            onClick={() => toggleHomePlatform(option.value)}
                            className={`flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
                              selected
                                ? dark ? 'border-orange-400/25 bg-orange-400/10 text-orange-200' : 'border-orange-200 bg-orange-50 text-[#dc542e]'
                                : dark ? 'border-white/[0.07] text-slate-300 hover:bg-white/[0.05]' : 'border-slate-200/80 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Image src={`/${option.value}.svg`} alt="" width={26} height={26} className="size-[26px] shrink-0 rounded-lg" />
                            <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold">{option.label}</span>
                            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-[#ff6a2c] text-white' : dark ? 'border border-white/10' : 'border border-slate-200'}`}>
                              {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="featured-board-logo flex size-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${platform.accentColor}14` }}
            >
              {aggregate
                ? <Flame className="size-7 text-[#ff5f35]" fill="currentColor" aria-hidden="true" />
                : <Image src={`/${platform.value}.svg`} alt="" width={48} height={48} className="featured-board-logo-image size-12 rounded-xl" />}
            </span>
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`featured-board-title truncate text-xl font-black tracking-[-0.035em] md:text-2xl ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {aggregate
                    ? '全网热榜'
                    : platform.value === 'weibo'
                    ? '微博热搜'
                    : platform.value === 'xiaohongshu'
                      ? '小红书热榜'
                      : `${platform.label}${platform.tip}`}
                </span>
                <span className={`shrink-0 text-xs font-black tracking-[0.06em] ${state.cacheStatus === 'stale' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {state.cacheStatus === 'stale' ? '● 缓存' : '● 实时'}
                </span>
              </span>
              <span className={`mt-1 block text-[14px] font-semibold md:text-[15px] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                {aggregate ? '30+ 平台实时聚合 · 去重呈现' : platform.value === 'weibo' ? '实时热榜 · 每分钟更新' : platform.subtitle}
              </span>
            </span>
          </div>
        )}

        <div className="featured-board-refresh ml-auto flex items-center gap-2 max-md:hidden">
          <button
            type="button"
            onClick={() => onRefresh(platform)}
            disabled={state.loading}
            title="刷新当前榜单"
            className={`flex size-10 cursor-pointer items-center justify-center rounded-xl border transition disabled:cursor-wait ${
              dark
                ? 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                : 'border-slate-900/[0.07] bg-white/70 text-slate-500 hover:bg-white hover:text-slate-900'
            }`}
          >
            <RefreshCw className={`size-4 ${state.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="featured-board-tabs flex items-center gap-3 px-5 pb-[11px] pt-4 md:px-6">
        <span className={`flex items-center gap-2 text-[14px] font-extrabold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
          实时热榜
        </span>
        <span className={`text-xs font-semibold ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
          {state.cacheStatus === 'stale'
            ? `数据源异常，展示 ${state.updateTime || '较早'} 缓存`
            : `更新于 ${state.updateTime || '同步中'}`}
        </span>
        <span className={`ml-auto rounded-full px-3 py-1.5 text-[13px] font-bold ${dark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
          {searchQuery.trim() ? `${filteredData.length} 条结果` : `共 ${state.data.length} 条`}
        </span>
      </div>

      <div className={`mx-5 border-t md:mx-6 ${dark ? 'border-white/[0.07]' : 'border-slate-200/75'}`} />

      <div className={`custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 md:px-4 ${
        itemLimit === 11 ? 'min-[961px]:[--visible-rows:11]' : 'min-[961px]:[--visible-rows:12]'
      }`}>
        {state.loading && state.data.length === 0 ? (
          <LoadingRows dark={dark} />
        ) : state.error && state.data.length === 0 ? (
          <EmptyState
            dark={dark}
            icon={<RefreshCw className="size-6" />}
            title={state.error}
            description="数据源可能暂时不可用，可以稍后重新拉取。"
            actionLabel="重新加载"
            onAction={() => onRefresh(platform)}
          />
        ) : state.data.length === 0 ? (
          <EmptyState
            dark={dark}
            icon={<Inbox className="size-6" />}
            title="本日榜单虚位以待"
            description="暂时没有检索到该平台的最新内容。"
            actionLabel="重新拉取"
            onAction={() => onRefresh(platform)}
          />
        ) : filteredData.length === 0 ? (
          <EmptyState
            dark={dark}
            icon={<SearchX className="size-6" />}
            title="没有找到匹配内容"
            description={`换个关键词搜索“${platform.label}”榜单。`}
          />
        ) : (
          filteredData.map(item => {
            const rank = findItemRank(state.data, item);
            const hotValue = item.hot ? String(formatNumber(item.hot)) : item.tip || '';
            return (
              <div
                key={item.id || `${platform.value}-${rank}`}
                className={`featured-board-row group/row grid min-h-[54px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b px-2.5 transition-colors duration-150 md:px-3 min-[961px]:h-[calc(100%/var(--visible-rows))] min-[961px]:min-h-0 ${
                  dark ? 'border-white/[0.055] hover:bg-white/[0.04]' : 'border-slate-200/65 hover:bg-slate-500/[0.045]'
                }`}
              >
                <span className={rankClass(rank)}>{rank}</span>
                <div className="flex min-w-0 items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`featured-board-row-title min-w-0 truncate text-[16px] font-bold leading-6 transition md:text-[18px] ${
                      dark ? 'text-slate-100 hover:text-orange-300' : 'text-slate-800 hover:text-[#d94f1c]'
                    }`}
                    title={item.title}
                  >
                    {highlightTitle(item.title, searchQuery)}
                  </a>
                  {item.label ? <span className={labelClass(item.label)}>{item.label}</span> : null}
                  {aggregate && item.sourcePlatformValue ? (
                    <span
                      className="hidden size-6 shrink-0 items-center justify-center opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100 sm:flex"
                      title={`来源：${item.sourcePlatformLabel || item.sourcePlatformValue}`}
                      aria-label={`来源：${item.sourcePlatformLabel || item.sourcePlatformValue}`}
                    >
                      <Image
                        src={`/${item.sourcePlatformValue}.svg`}
                        alt=""
                        width={18}
                        height={18}
                        className="size-[18px] rounded-[4px]"
                      />
                    </span>
                  ) : null}
                </div>
                <span className={`hidden w-[108px] shrink-0 items-center justify-end gap-2 text-right font-mono text-[15px] tabular-nums sm:flex ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Flame className="size-4 text-[#ff6a2c]" fill="currentColor" />
                  {hotValue}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function rankClass(rank: number) {
  const base = 'flex size-8 shrink-0 items-center justify-center rounded-[9px] text-[15px] font-black tabular-nums';
  if (rank === 1) return `${base} bg-[#ff5d36] text-white shadow-[0_7px_16px_rgba(255,93,54,0.22)]`;
  if (rank === 2) return `${base} bg-[#ff8a18] text-white`;
  if (rank === 3) return `${base} bg-[#f4ae27] text-white`;
  return `${base} text-slate-400`;
}

function labelClass(label: string) {
  const base = 'hidden shrink-0 rounded-[6px] px-2 py-0.5 text-[12px] font-black leading-5 text-white sm:inline-flex';
  if (label === '新') return `${base} bg-[#ff3850]`;
  if (label === '热') return `${base} bg-[#ff8a00]`;
  if (label === '荐') return `${base} bg-[#ffb000]`;
  return `${base} bg-[#ff6a2c]`;
}

function highlightTitle(title: string, query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return title;
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = title.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return parts.map((part, index) =>
    part.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-orange-400/20 px-0.5 text-inherit">
        {part}
      </mark>
    ) : part,
  );
}

function LoadingRows({ dark }: { dark: boolean }) {
  return (
    <div className="divide-y divide-transparent">
      {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex min-h-[54px] animate-pulse items-center gap-3 px-3">
          <span className={`size-7 rounded-[10px] ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />
          <span className={`h-3 flex-1 rounded ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`} style={{ maxWidth: `${54 + (index % 4) * 9}%` }} />
          <span className={`h-3 w-16 rounded ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  actionLabel,
  dark,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string;
  dark: boolean;
  description: string;
  icon: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center px-6 text-center">
      <div className={`mb-4 rounded-2xl border p-4 ${dark ? 'border-white/[0.08] bg-white/[0.04] text-slate-500' : 'border-slate-200 bg-white text-slate-400 shadow-sm'}`}>
        {icon}
      </div>
      <p className={`text-sm font-black ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{title}</p>
      <p className={`mt-1.5 max-w-xs text-xs leading-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="mt-4 cursor-pointer rounded-xl bg-[#ff6a2c] px-4 py-2 text-xs font-extrabold text-white shadow-[0_9px_22px_rgba(255,106,44,0.2)]">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
